-- =====================================================
-- HydrantHub Maintenance Module Schema
-- Version: 2.0 (UUID Compatible)
-- Supports: O. Reg 169/03, NFPA 291, AWWA M17
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- INSPECTION TYPES
-- =====================================================

CREATE TABLE IF NOT EXISTS inspection_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  frequency_months INTEGER,
  regulatory_standard VARCHAR(50), -- 'NFPA_291', 'AWWA_M17', 'O_REG_169_03'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default inspection types
INSERT INTO inspection_types (name, description, frequency_months, regulatory_standard) VALUES
('Visual Inspection', 'External condition assessment', 12, 'NFPA_291'),
('Valve Operation', 'Operating nut and valve functionality', 12, 'NFPA_291'),
('Flow Test', 'NFPA 291 hydrant flow testing', 60, 'NFPA_291'),
('Annual Inspection', 'Comprehensive annual inspection', 12, 'O_REG_169_03'),
('Seasonal Prep', 'Winter/summer preparation', 6, 'AWWA_M17')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- MAINTENANCE INSPECTIONS (Main Table)
-- =====================================================

CREATE TABLE IF NOT EXISTS maintenance_inspections (
  id SERIAL PRIMARY KEY,
  hydrant_id UUID NOT NULL REFERENCES hydrants(id) ON DELETE CASCADE,
  inspection_type_id INTEGER NOT NULL REFERENCES inspection_types(id),
  inspector_name VARCHAR(100) NOT NULL,
  inspector_license VARCHAR(50),
  inspection_date DATE NOT NULL,
  scheduled_date DATE,
  overall_status VARCHAR(20) DEFAULT 'PASS', -- 'PASS', 'FAIL', 'NEEDS_REPAIR'
  overall_notes TEXT,
  compliance_status VARCHAR(20) DEFAULT 'COMPLIANT', -- 'COMPLIANT', 'NON_COMPLIANT', 'PENDING'
  photos JSONB DEFAULT '[]', -- Array of photo URLs
 created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_maintenance_inspections_hydrant ON maintenance_inspections(hydrant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_inspections_date ON maintenance_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_inspections_status ON maintenance_inspections(overall_status);

-- =====================================================
-- VISUAL INSPECTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS visual_inspections (
  id SERIAL PRIMARY KEY,
  inspection_id INTEGER NOT NULL REFERENCES maintenance_inspections(id) ON DELETE CASCADE,
  
  -- Paint condition
  paint_condition VARCHAR(20), -- 'GOOD', 'FAIR', 'POOR'
  paint_color VARCHAR(50),
  paint_notes TEXT,
  
  -- Cap condition
  cap_condition VARCHAR(20), -- 'GOOD', 'DAMAGED', 'MISSING'
  cap_type VARCHAR(50),
  cap_secure BOOLEAN,
  cap_notes TEXT,
  
  -- Barrel condition
  barrel_condition VARCHAR(20), -- 'GOOD', 'FAIR', 'POOR'
  barrel_damage TEXT,
  barrel_notes TEXT,
  
  -- Nozzle caps
  nozzle_caps_present BOOLEAN,
  nozzle_caps_condition VARCHAR(20),
  nozzle_caps_notes TEXT,
  
  -- Chain condition
  chain_present BOOLEAN,
  chain_condition VARCHAR(20),
  chain_notes TEXT,
  
  -- Overall assessment
  repair_needed BOOLEAN DEFAULT false,
  priority VARCHAR(20) DEFAULT 'LOW', -- 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_visual_inspections_inspection ON visual_inspections(inspection_id);

-- =====================================================
-- VALVE INSPECTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS valve_inspections (
  id SERIAL PRIMARY KEY,
  inspection_id INTEGER NOT NULL REFERENCES maintenance_inspections(id) ON DELETE CASCADE,
  
  -- Valve operation
  operating_nut_condition VARCHAR(20), -- 'GOOD', 'WORN', 'DAMAGED', 'MISSING'
  turns_to_open NUMERIC(4,1),
  turns_to_close NUMERIC(4,1),
  valve_operates_smoothly BOOLEAN,
  valve_opens_fully BOOLEAN,
  valve_closes_fully BOOLEAN,
  
  -- Operating issues
  difficult_to_operate BOOLEAN DEFAULT false,
  operation_notes TEXT,
  
  -- Leaks
  valve_leaks BOOLEAN DEFAULT false,
  leak_location VARCHAR(100),
  leak_severity VARCHAR(20), -- 'MINOR', 'MODERATE', 'SEVERE'
  leak_notes TEXT,
  
  -- Lubrication
  lubrication_needed BOOLEAN DEFAULT false,
  last_lubricated DATE,
  lubricant_type VARCHAR(50),
  
  -- Overall assessment
  repair_needed BOOLEAN DEFAULT false,
  priority VARCHAR(20) DEFAULT 'LOW',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_valve_inspections_inspection ON valve_inspections(inspection_id);

-- =====================================================
-- REPAIR WORK ORDERS
-- =====================================================

CREATE TABLE IF NOT EXISTS repair_work_orders (
  id SERIAL PRIMARY KEY,
  hydrant_id UUID NOT NULL REFERENCES hydrants(id) ON DELETE CASCADE,
  inspection_id INTEGER REFERENCES maintenance_inspections(id),
  
  -- Work order details
  work_order_number VARCHAR(50) UNIQUE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
  status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
  
  -- Assignment
  assigned_to VARCHAR(100),
  assigned_date DATE,
  due_date DATE,
  
  -- Completion
  completed_date DATE,
  completed_by VARCHAR(100),
  completion_notes TEXT,
  
  -- Costs
  estimated_cost NUMERIC(10,2),
  actual_cost NUMERIC(10,2),
  
  -- Parts
  parts_required JSONB DEFAULT '[]',
  parts_cost NUMERIC(10,2),
  
  -- Attachments
  photos JSONB DEFAULT '[]',
  documents JSONB DEFAULT '[]',
  
 created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_repair_work_orders_hydrant ON repair_work_orders(hydrant_id);
CREATE INDEX IF NOT EXISTS idx_repair_work_orders_status ON repair_work_orders(status);
CREATE INDEX IF NOT EXISTS idx_repair_work_orders_priority ON repair_work_orders(priority);

-- =====================================================
-- COMPLIANCE SCHEDULE
-- =====================================================

CREATE TABLE IF NOT EXISTS compliance_schedule (
  id SERIAL PRIMARY KEY,
  hydrant_id UUID NOT NULL REFERENCES hydrants(id) ON DELETE CASCADE,
  inspection_type_id INTEGER NOT NULL REFERENCES inspection_types(id),
  
  -- Scheduling
  scheduled_date DATE NOT NULL,
  due_date DATE NOT NULL,
  completed_date DATE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'OVERDUE', 'COMPLETED', 'SKIPPED'
  compliance_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'COMPLIANT', 'NON_COMPLIANT'
  
  -- Notifications
  notification_sent BOOLEAN DEFAULT false,
  notification_date DATE,
  
  -- Notes
  notes TEXT,
  
 created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_compliance_schedule_hydrant ON compliance_schedule(hydrant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_schedule_date ON compliance_schedule(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_compliance_schedule_status ON compliance_schedule(status);

-- =====================================================
-- MAINTENANCE HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS maintenance_history (
  id SERIAL PRIMARY KEY,
  hydrant_id UUID NOT NULL REFERENCES hydrants(id) ON DELETE CASCADE,
  
  -- Action details
  action_type VARCHAR(50) NOT NULL, -- 'INSPECTION', 'REPAIR', 'REPLACEMENT', 'MAINTENANCE'
  action_description TEXT NOT NULL,
  action_date DATE NOT NULL,
  
  -- Performer
  performed_by VARCHAR(100) NOT NULL,
  license_number VARCHAR(50),
  department VARCHAR(100),
  
  -- Details
  notes TEXT,
  cost NUMERIC(10,2),
  
  -- Attachments
  attachments JSONB DEFAULT '[]',
  
 created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_maintenance_history_hydrant ON maintenance_history(hydrant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_history_date ON maintenance_history(action_date);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_inspection_types_updated_at') THEN
    CREATE TRIGGER update_inspection_types_updated_at BEFORE UPDATE ON inspection_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_maintenance_inspections_updated_at') THEN
    CREATE TRIGGER update_maintenance_inspections_updated_at BEFORE UPDATE ON maintenance_inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_visual_inspections_updated_at') THEN
    CREATE TRIGGER update_visual_inspections_updated_at BEFORE UPDATE ON visual_inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_valve_inspections_updated_at') THEN
    CREATE TRIGGER update_valve_inspections_updated_at BEFORE UPDATE ON valve_inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_repair_work_orders_updated_at') THEN
    CREATE TRIGGER update_repair_work_orders_updated_at BEFORE UPDATE ON repair_work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_compliance_schedule_updated_at') THEN
    CREATE TRIGGER update_compliance_schedule_updated_at BEFORE UPDATE ON compliance_schedule FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Overdue inspections view
CREATE OR REPLACE VIEW overdue_inspections AS
SELECT 
  cs.id,
  cs.hydrant_id,
  h.hydrant_number,
  h.address,
  it.name as inspection_type,
  cs.due_date,
  cs.scheduled_date,
  CURRENT_DATE - cs.due_date as days_overdue
FROM compliance_schedule cs
JOIN hydrants h ON cs.hydrant_id = h.id
JOIN inspection_types it ON cs.inspection_type_id = it.id
WHERE cs.status = 'OVERDUE' OR (cs.status = 'SCHEDULED' AND cs.due_date < CURRENT_DATE);

-- Recent maintenance summary view
CREATE OR REPLACE VIEW recent_maintenance_summary AS
SELECT 
  h.id as hydrant_id,
  h.hydrant_number,
  h.address,
  MAX(mi.inspection_date) as last_inspection_date,
  COUNT(DISTINCT mi.id) as total_inspections,
  COUNT(DISTINCT rwo.id) as total_work_orders,
  COUNT(DISTINCT CASE WHEN rwo.status = 'PENDING' THEN rwo.id END) as pending_repairs
FROM hydrants h
LEFT JOIN maintenance_inspections mi ON h.id = mi.hydrant_id
LEFT JOIN repair_work_orders rwo ON h.id = rwo.hydrant_id
GROUP BY h.id, h.hydrant_number, h.address;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
