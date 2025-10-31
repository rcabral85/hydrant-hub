-- HydrantHub Maintenance Module Database Schema
-- Create all tables required for maintenance tracking, inspections, and work orders
-- Compatible with existing hydrants table structure

-- Create maintenance_inspections table
CREATE TABLE IF NOT EXISTS maintenance_inspections (
    id SERIAL PRIMARY KEY,
    hydrant_id INTEGER NOT NULL REFERENCES hydrants(id) ON DELETE CASCADE,
    inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    inspector_name VARCHAR(100) NOT NULL,
    inspector_license VARCHAR(50),
    inspection_type_id INTEGER DEFAULT 1,
    
    -- Weather and conditions
    weather_conditions VARCHAR(50),
    temperature_celsius DECIMAL(4,1),
    
    -- Visual assessment
    paint_condition VARCHAR(20) CHECK (paint_condition IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL')),
    body_condition VARCHAR(20) CHECK (body_condition IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL')),
    cap_condition VARCHAR(20) CHECK (cap_condition IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'MISSING')),
    cap_security VARCHAR(20),
    chains_present BOOLEAN,
    chains_condition VARCHAR(20),
    clearance_adequate BOOLEAN,
    safety_hazards TEXT,
    immediate_action_required BOOLEAN DEFAULT false,
    
    -- Valve operation
    valve_operation VARCHAR(20) CHECK (valve_operation IN ('SMOOTH', 'STIFF', 'BINDING', 'INOPERABLE')),
    valve_turns_to_close INTEGER,
    static_pressure_psi DECIMAL(5,1),
    valve_leak_detected BOOLEAN DEFAULT false,
    valve_exercised BOOLEAN DEFAULT false,
    lubrication_applied BOOLEAN DEFAULT false,
    
    -- Final assessment
    overall_condition VARCHAR(20) CHECK (overall_condition IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL')),
    overall_status VARCHAR(20) DEFAULT 'PASS' CHECK (overall_status IN ('PASS', 'FAIL', 'CONDITIONAL')),
    repair_needed BOOLEAN DEFAULT false,
    priority_level VARCHAR(20) DEFAULT 'LOW' CHECK (priority_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    compliance_status VARCHAR(20) DEFAULT 'COMPLIANT' CHECK (compliance_status IN ('COMPLIANT', 'NON_COMPLIANT', 'CONDITIONAL')),
    
    -- Documentation
    inspector_notes TEXT,
    photos_uploaded INTEGER DEFAULT 0,
    inspector_gps_lat DECIMAL(10,8),
    inspector_gps_lng DECIMAL(11,8),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create work_orders table
CREATE TABLE IF NOT EXISTS work_orders (
    id SERIAL PRIMARY KEY,
    work_order_number VARCHAR(50) UNIQUE NOT NULL,
    hydrant_id INTEGER NOT NULL REFERENCES hydrants(id) ON DELETE CASCADE,
    inspection_id INTEGER REFERENCES maintenance_inspections(id),
    
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'GENERAL',
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    
    -- Assignment and scheduling
    assigned_to VARCHAR(100),
    target_completion_date DATE,
    actual_completion_date DATE,
    
    -- Cost tracking
    estimated_cost DECIMAL(8,2),
    actual_cost DECIMAL(8,2),
    materials_cost DECIMAL(8,2),
    labor_hours DECIMAL(5,1),
    
    -- Progress tracking
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    
    -- Metadata
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create inspection_types lookup table
CREATE TABLE IF NOT EXISTS inspection_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    regulatory_requirement BOOLEAN DEFAULT false,
    frequency_months INTEGER,
    is_active BOOLEAN DEFAULT true
);

-- Insert default inspection types
INSERT INTO inspection_types (name, description, regulatory_requirement, frequency_months) VALUES
    ('Annual Inspection', 'Required annual hydrant inspection per O. Reg 169/03', true, 12),
    ('Flow Test', 'NFPA 291 compliant flow testing', true, 12),
    ('Valve Maintenance', 'Valve operation and lubrication maintenance', false, 6),
    ('Paint Inspection', 'Paint condition and visibility assessment', false, 24),
    ('Emergency Inspection', 'Post-incident or emergency response inspection', false, null),
    ('Pre-Winter Inspection', 'Seasonal preparation inspection', false, 12)
ON CONFLICT DO NOTHING;

-- Create work_order_categories lookup table
CREATE TABLE IF NOT EXISTS work_order_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    typical_cost_range VARCHAR(50),
    priority_default VARCHAR(20) DEFAULT 'MEDIUM'
);

-- Insert default work order categories
INSERT INTO work_order_categories (name, description, typical_cost_range, priority_default) VALUES
    ('VALVE_REPAIR', 'Main valve operation issues', '$100-$500', 'HIGH'),
    ('PAINT_MAINTENANCE', 'Paint restoration and visibility', '$50-$200', 'MEDIUM'),
    ('CAP_REPLACEMENT', 'Cap and chain replacement', '$25-$100', 'LOW'),
    ('SAFETY_HAZARD', 'Immediate safety concerns', '$200-$1000', 'CRITICAL'),
    ('BODY_REPAIR', 'Structural body repairs', '$300-$800', 'HIGH'),
    ('CLEARANCE_ISSUE', 'Access and clearance problems', '$50-$300', 'MEDIUM'),
    ('GENERAL_MAINTENANCE', 'General maintenance and upkeep', '$25-$200', 'LOW')
ON CONFLICT DO NOTHING;

-- Create compliance_schedule table for tracking required inspections
CREATE TABLE IF NOT EXISTS compliance_schedule (
    id SERIAL PRIMARY KEY,
    hydrant_id INTEGER NOT NULL REFERENCES hydrants(id) ON DELETE CASCADE,
    inspection_type_id INTEGER NOT NULL REFERENCES inspection_types(id),
    
    due_date DATE NOT NULL,
    completion_date DATE,
    status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'OVERDUE', 'COMPLETED', 'CANCELLED')),
    
    regulatory_requirement BOOLEAN DEFAULT true,
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_maintenance_inspections_hydrant_id ON maintenance_inspections(hydrant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_inspections_date ON maintenance_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_work_orders_hydrant_id ON work_orders(hydrant_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_compliance_schedule_hydrant_id ON compliance_schedule(hydrant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_schedule_due_date ON compliance_schedule(due_date);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_maintenance_inspections_updated_at ON maintenance_inspections;
CREATE TRIGGER update_maintenance_inspections_updated_at 
    BEFORE UPDATE ON maintenance_inspections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_work_orders_updated_at ON work_orders;
CREATE TRIGGER update_work_orders_updated_at 
    BEFORE UPDATE ON work_orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_compliance_schedule_updated_at ON compliance_schedule;
CREATE TRIGGER update_compliance_schedule_updated_at 
    BEFORE UPDATE ON compliance_schedule 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically generate compliance schedule for new hydrants
CREATE OR REPLACE FUNCTION generate_compliance_schedule(hydrant_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Generate annual inspection schedule
    INSERT INTO compliance_schedule (hydrant_id, inspection_type_id, due_date, regulatory_requirement)
    VALUES (hydrant_id_param, 1, CURRENT_DATE + INTERVAL '12 months', true);
    
    -- Generate flow test schedule
    INSERT INTO compliance_schedule (hydrant_id, inspection_type_id, due_date, regulatory_requirement)
    VALUES (hydrant_id_param, 2, CURRENT_DATE + INTERVAL '12 months', true);
    
    -- Generate valve maintenance schedule
    INSERT INTO compliance_schedule (hydrant_id, inspection_type_id, due_date, regulatory_requirement)
    VALUES (hydrant_id_param, 3, CURRENT_DATE + INTERVAL '6 months', false);
END;
$$ language 'plpgsql';

-- Function to generate work order numbers automatically
CREATE OR REPLACE FUNCTION generate_work_order_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_part TEXT;
    new_number TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    SELECT LPAD((COUNT(*) + 1)::TEXT, 3, '0') INTO sequence_part
    FROM work_orders 
    WHERE work_order_number LIKE 'WO-' || year_part || '-%';
    
    new_number := 'WO-' || year_part || '-' || sequence_part;
    
    RETURN new_number;
END;
$$ language 'plpgsql';

-- Sample data for demonstration (optional - only run if you want demo data)
-- You can uncomment these lines if you want some sample maintenance data

/*
-- Sample maintenance inspection
INSERT INTO maintenance_inspections (
    hydrant_id, inspector_name, inspector_license, inspection_date,
    weather_conditions, temperature_celsius, paint_condition, body_condition,
    cap_condition, chains_present, clearance_adequate, valve_operation,
    static_pressure_psi, overall_condition, overall_status, inspector_notes
) VALUES (
    1, 'Rich Cabral', 'WDO-ON-2019-1234', '2025-10-15',
    'Clear, sunny', 18.5, 'GOOD', 'EXCELLENT', 'GOOD', true, true, 'SMOOTH',
    72.3, 'GOOD', 'PASS', 'Annual inspection completed - hydrant in excellent condition'
);

-- Sample work order
INSERT INTO work_orders (
    work_order_number, hydrant_id, title, description, category, priority, status,
    assigned_to, target_completion_date, estimated_cost, created_by
) VALUES (
    'WO-2025-001', 1, 'Paint Touch-up Required', 
    'Minor paint fading observed on south side of hydrant body', 
    'PAINT_MAINTENANCE', 'MEDIUM', 'SCHEDULED',
    'Rich Cabral', '2025-12-15', 125.00, 'system'
);
*/