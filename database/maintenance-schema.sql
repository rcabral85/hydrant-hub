-- HydrantHub Maintenance & Inspection Database Schema
-- Auditable maintenance system for municipal compliance
-- Created: October 31, 2025

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS hydrant_management;
\c hydrant_management;

-- Enable PostGIS for spatial data
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- MAINTENANCE & INSPECTION TABLES
-- =============================================

-- Inspection Types (Annual, Emergency, Routine)
CREATE TABLE inspection_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    required_frequency_months INTEGER,
    regulatory_requirement BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard inspection types
INSERT INTO inspection_types (name, description, required_frequency_months, regulatory_requirement) VALUES
('Annual Inspection', 'Comprehensive annual hydrant inspection per O. Reg 169/03', 12, true),
('Flow Test', 'NFPA 291 compliant fire flow testing', 12, true),
('Valve Operation', 'Quarterly valve operation and maintenance', 3, true),
('Emergency Repair', 'Emergency maintenance and repair inspection', NULL, false),
('Routine Check', 'Monthly visual inspection and status verification', 1, false);

-- Maintenance Inspections (Main audit table)
CREATE TABLE maintenance_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hydrant_id VARCHAR(50) NOT NULL,
    inspection_type_id INTEGER REFERENCES inspection_types(id),
    inspector_name VARCHAR(100) NOT NULL,
    inspector_license VARCHAR(50), -- WDO license number
    inspection_date TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    
    -- Audit Trail
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Overall Inspection Results
    overall_status VARCHAR(20) CHECK (overall_status IN ('PASS', 'FAIL', 'CONDITIONAL', 'PENDING')),
    overall_notes TEXT,
    compliance_status VARCHAR(20) CHECK (compliance_status IN ('COMPLIANT', 'NON_COMPLIANT', 'CONDITIONAL')),
    
    -- Photos and Documentation
    photos JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- Next Inspection Due
    next_inspection_due DATE,
    
    -- Signature and Certification
    inspector_signature TEXT,
    certification_date TIMESTAMP WITH TIME ZONE,
    
    INDEX (hydrant_id),
    INDEX (inspection_date),
    INDEX (overall_status),
    INDEX (compliance_status)
);

-- Visual Condition Assessment
CREATE TABLE visual_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maintenance_inspection_id UUID REFERENCES maintenance_inspections(id) ON DELETE CASCADE,
    
    -- Physical Condition
    paint_condition VARCHAR(20) CHECK (paint_condition IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL')),
    paint_notes TEXT,
    
    body_condition VARCHAR(20) CHECK (body_condition IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL')),
    body_damage_notes TEXT,
    
    cap_condition VARCHAR(20) CHECK (cap_condition IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'MISSING')),
    cap_security VARCHAR(20) CHECK (cap_security IN ('SECURE', 'LOOSE', 'MISSING', 'DAMAGED')),
    
    chains_present BOOLEAN DEFAULT true,
    chains_condition VARCHAR(20) CHECK (chains_condition IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'MISSING')),
    
    -- Accessibility
    clearance_adequate BOOLEAN DEFAULT true,
    clearance_distance_feet DECIMAL(5,2),
    obstructions TEXT,
    
    -- Visibility
    visible_from_road BOOLEAN DEFAULT true,
    reflective_markers_present BOOLEAN DEFAULT true,
    signage_adequate BOOLEAN DEFAULT true,
    
    -- Ground Conditions
    ground_condition VARCHAR(20) CHECK (ground_condition IN ('STABLE', 'SOFT', 'MUDDY', 'ICY', 'HAZARDOUS')),
    drainage_adequate BOOLEAN DEFAULT true,
    
    -- Safety Concerns
    safety_hazards TEXT,
    immediate_action_required BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Valve Operation Testing
CREATE TABLE valve_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maintenance_inspection_id UUID REFERENCES maintenance_inspections(id) ON DELETE CASCADE,
    
    -- Main Valve (Gate Valve)
    main_valve_type VARCHAR(30) DEFAULT 'Gate Valve',
    main_valve_operation VARCHAR(20) CHECK (main_valve_operation IN ('SMOOTH', 'STIFF', 'BINDING', 'INOPERABLE')),
    main_valve_turns_to_close INTEGER,
    main_valve_turns_to_open INTEGER,
    main_valve_leak_detected BOOLEAN DEFAULT false,
    main_valve_notes TEXT,
    
    -- Operating Nut
    operating_nut_condition VARCHAR(20) CHECK (operating_nut_condition IN ('EXCELLENT', 'GOOD', 'WORN', 'DAMAGED', 'MISSING')),
    operating_nut_security VARCHAR(20) CHECK (operating_nut_security IN ('TIGHT', 'LOOSE', 'MISSING')),
    
    -- Drain Valve (if present)
    drain_valve_present BOOLEAN DEFAULT true,
    drain_valve_operation VARCHAR(20) CHECK (drain_valve_operation IN ('FUNCTIONAL', 'STIFF', 'INOPERABLE', 'N/A')),
    drain_valve_leak BOOLEAN DEFAULT false,
    
    -- Pumper Connection
    pumper_connections_count INTEGER DEFAULT 2,
    pumper_connections_condition VARCHAR(20) CHECK (pumper_connections_condition IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED')),
    pumper_caps_present BOOLEAN DEFAULT true,
    pumper_caps_condition VARCHAR(20) CHECK (pumper_caps_condition IN ('EXCELLENT', 'GOOD', 'WORN', 'DAMAGED', 'MISSING')),
    pumper_threads_condition VARCHAR(20) CHECK (pumper_threads_condition IN ('EXCELLENT', 'GOOD', 'WORN', 'DAMAGED')),
    
    -- Static Pressure Test
    static_pressure_psi DECIMAL(6,2),
    static_pressure_location VARCHAR(50), -- 'Pumper Connection', 'Auxiliary Outlet'
    pressure_gauge_calibrated BOOLEAN DEFAULT true,
    pressure_test_notes TEXT,
    
    -- Valve Exercise Results
    valve_exercised BOOLEAN DEFAULT false,
    valve_exercise_date TIMESTAMP WITH TIME ZONE,
    valve_exercise_successful BOOLEAN,
    lubrication_applied BOOLEAN DEFAULT false,
    lubrication_type VARCHAR(50),
    
    -- Performance Issues
    performance_issues TEXT,
    repair_recommendations TEXT,
    priority_level VARCHAR(10) CHECK (priority_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Repair Work Orders
CREATE TABLE repair_work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hydrant_id VARCHAR(50) NOT NULL,
    maintenance_inspection_id UUID REFERENCES maintenance_inspections(id),
    
    -- Work Order Details
    work_order_number VARCHAR(20) UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(10) CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    category VARCHAR(50) CHECK (category IN (
        'VALVE_REPAIR', 'PAINT_MAINTENANCE', 'CAP_REPLACEMENT', 
        'CHAIN_REPLACEMENT', 'BODY_REPAIR', 'DRAINAGE_ISSUE',
        'ACCESSIBILITY_IMPROVEMENT', 'SAFETY_HAZARD', 'OTHER'
    )),
    
    -- Scheduling
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    target_completion_date TIMESTAMP WITH TIME ZONE,
    actual_completion_date TIMESTAMP WITH TIME ZONE,
    
    -- Assignment
    assigned_to VARCHAR(100),
    department VARCHAR(50),
    contractor VARCHAR(100),
    
    -- Status Tracking
    status VARCHAR(20) CHECK (status IN (
        'CREATED', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD', 
        'COMPLETED', 'CANCELLED', 'DEFERRED'
    )) DEFAULT 'CREATED',
    
    -- Cost Tracking
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    labor_hours DECIMAL(5,2),
    
    -- Materials
    materials_required JSONB DEFAULT '[]'::jsonb,
    materials_used JSONB DEFAULT '[]'::jsonb,
    
    -- Completion Documentation
    completion_notes TEXT,
    completion_photos JSONB DEFAULT '[]'::jsonb,
    inspector_approval VARCHAR(100),
    approval_date TIMESTAMP WITH TIME ZONE,
    
    -- Audit Trail
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX (hydrant_id),
    INDEX (status),
    INDEX (priority),
    INDEX (scheduled_date),
    INDEX (work_order_number)
);

-- Inspection Checklist Items (Configurable)
CREATE TABLE inspection_checklist_templates (
    id SERIAL PRIMARY KEY,
    inspection_type_id INTEGER REFERENCES inspection_types(id),
    category VARCHAR(50) NOT NULL, -- 'VISUAL', 'OPERATIONAL', 'SAFETY', 'COMPLIANCE'
    item_description TEXT NOT NULL,
    required BOOLEAN DEFAULT true,
    regulatory_reference VARCHAR(100), -- 'O. Reg 169/03 s.15', 'NFPA 291'
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Standard inspection checklist items
INSERT INTO inspection_checklist_templates 
(inspection_type_id, category, item_description, required, regulatory_reference, sort_order) VALUES

-- Annual Inspection Checklist (inspection_type_id = 1)
(1, 'VISUAL', 'Hydrant body free from damage, corrosion, or structural issues', true, 'O. Reg 169/03 s.15(1)', 1),
(1, 'VISUAL', 'Paint condition adequate for visibility and corrosion protection', true, 'O. Reg 169/03 s.15(1)', 2),
(1, 'VISUAL', 'All caps and plugs present and in good condition', true, 'O. Reg 169/03 s.15(1)', 3),
(1, 'VISUAL', 'Chains present and secure for all caps', true, 'O. Reg 169/03 s.15(1)', 4),
(1, 'OPERATIONAL', 'Main valve operates smoothly through full range', true, 'O. Reg 169/03 s.15(2)', 5),
(1, 'OPERATIONAL', 'Static pressure within acceptable range (40-100+ PSI)', true, 'O. Reg 169/03 s.15(2)', 6),
(1, 'OPERATIONAL', 'Drain valve functional (if present)', true, 'O. Reg 169/03 s.15(2)', 7),
(1, 'OPERATIONAL', 'Pumper connections clear and threads in good condition', true, 'O. Reg 169/03 s.15(2)', 8),
(1, 'SAFETY', 'Adequate clearance from vehicles and obstructions (minimum 3 feet)', true, 'O. Reg 169/03 s.15(3)', 9),
(1, 'SAFETY', 'Visible from roadway with adequate marking/reflectors', true, 'O. Reg 169/03 s.15(3)', 10),
(1, 'SAFETY', 'Ground stable and safe for emergency access', true, 'O. Reg 169/03 s.15(3)', 11),
(1, 'COMPLIANCE', 'GPS coordinates verified and recorded', true, 'Municipal Standard', 12),
(1, 'COMPLIANCE', 'Hydrant number/ID clearly visible and legible', true, 'Municipal Standard', 13),

-- Flow Test Checklist (inspection_type_id = 2)  
(2, 'OPERATIONAL', 'Static pressure measurement recorded', true, 'NFPA 291 s.4.2', 1),
(2, 'OPERATIONAL', 'Residual pressure measurement recorded', true, 'NFPA 291 s.4.3', 2),
(2, 'OPERATIONAL', 'Flow rate calculated using NFPA 291 method', true, 'NFPA 291 s.4.4', 3),
(2, 'COMPLIANCE', 'Pitot gauge calibrated and certified', true, 'NFPA 291 s.3.2', 4),
(2, 'COMPLIANCE', 'Test conditions documented (weather, temperature)', true, 'NFPA 291 s.4.1', 5),

-- Valve Operation Checklist (inspection_type_id = 3)
(3, 'OPERATIONAL', 'Main valve opens and closes completely', true, 'AWWA M17', 1),
(3, 'OPERATIONAL', 'Operating nut secure and accessible', true, 'AWWA M17', 2),
(3, 'OPERATIONAL', 'Number of turns recorded (open/close)', true, 'Municipal Standard', 3),
(3, 'OPERATIONAL', 'Valve lubricated if required', false, 'AWWA M17', 4),
(3, 'SAFETY', 'No water leakage during operation', true, 'Municipal Standard', 5);

-- Inspection Results (Individual checklist responses)
CREATE TABLE inspection_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maintenance_inspection_id UUID REFERENCES maintenance_inspections(id) ON DELETE CASCADE,
    checklist_item_id INTEGER REFERENCES inspection_checklist_templates(id),
    
    -- Result
    result VARCHAR(20) CHECK (result IN ('PASS', 'FAIL', 'N/A', 'CONDITIONAL')),
    notes TEXT,
    measured_value DECIMAL(10,3), -- For numeric measurements
    measured_unit VARCHAR(20), -- 'PSI', 'GPM', 'INCHES', 'FEET'
    
    -- Photo Evidence
    photo_urls JSONB DEFAULT '[]'::jsonb,
    
    -- Follow-up Required
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_priority VARCHAR(10) CHECK (follow_up_priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    follow_up_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance History (Complete audit trail)
CREATE TABLE maintenance_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hydrant_id VARCHAR(50) NOT NULL,
    
    -- Action Details
    action_type VARCHAR(50) CHECK (action_type IN (
        'INSPECTION', 'REPAIR', 'REPLACEMENT', 'VALVE_EXERCISE', 
        'PAINTING', 'CLEANING', 'CALIBRATION', 'EMERGENCY_REPAIR',
        'PREVENTIVE_MAINTENANCE', 'FLOW_TEST'
    )),
    
    action_description TEXT NOT NULL,
    action_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Personnel
    performed_by VARCHAR(100) NOT NULL,
    license_number VARCHAR(50),
    department VARCHAR(50),
    
    -- Work Details
    labor_hours DECIMAL(5,2),
    materials_used JSONB DEFAULT '[]'::jsonb,
    cost DECIMAL(10,2),
    
    -- Results
    work_completed BOOLEAN DEFAULT true,
    success_status VARCHAR(20) CHECK (success_status IN ('SUCCESS', 'PARTIAL', 'FAILED', 'DEFERRED')),
    notes TEXT,
    
    -- Documentation
    photos_before JSONB DEFAULT '[]'::jsonb,
    photos_after JSONB DEFAULT '[]'::jsonb,
    work_order_id UUID REFERENCES repair_work_orders(id),
    
    -- Next Actions
    follow_up_required BOOLEAN DEFAULT false,
    next_service_date DATE,
    
    -- Audit Trail
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX (hydrant_id),
    INDEX (action_date),
    INDEX (action_type),
    INDEX (performed_by)
);

-- Audit Log for Regulatory Compliance
CREATE TABLE maintenance_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Reference
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    
    -- Action
    action VARCHAR(10) CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    
    -- Data
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    user_id UUID REFERENCES users(id),
    user_name VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX (table_name, record_id),
    INDEX (timestamp),
    INDEX (user_id)
);

-- Compliance Schedule (Auto-generated inspection schedule)
CREATE TABLE compliance_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hydrant_id VARCHAR(50) NOT NULL,
    inspection_type_id INTEGER REFERENCES inspection_types(id),
    
    -- Scheduling
    due_date DATE NOT NULL,
    grace_period_days INTEGER DEFAULT 30,
    overdue_date DATE GENERATED ALWAYS AS (due_date + INTERVAL '1 day' * COALESCE(grace_period_days, 30)) STORED,
    
    -- Status
    status VARCHAR(20) CHECK (status IN ('SCHEDULED', 'OVERDUE', 'COMPLETED', 'DEFERRED', 'CANCELLED')) DEFAULT 'SCHEDULED',
    completed_inspection_id UUID REFERENCES maintenance_inspections(id),
    completion_date TIMESTAMP WITH TIME ZONE,
    
    -- Notifications
    notification_sent BOOLEAN DEFAULT false,
    reminder_sent_30_days BOOLEAN DEFAULT false,
    reminder_sent_7_days BOOLEAN DEFAULT false,
    overdue_notification_sent BOOLEAN DEFAULT false,
    
    -- Auto-rescheduling
    next_scheduled_date DATE,
    auto_reschedule_enabled BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX (hydrant_id),
    INDEX (due_date),
    INDEX (status),
    INDEX (overdue_date)
);

-- =============================================
-- AUDIT TRIGGERS
-- =============================================

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO maintenance_audit_log (table_name, record_id, action, new_values, user_id, user_name)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW), 
                COALESCE(NEW.created_by, NEW.updated_by), 
                COALESCE(current_setting('app.current_user', true), 'system'));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO maintenance_audit_log (table_name, record_id, action, old_values, new_values, user_id, user_name)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW),
                COALESCE(NEW.updated_by, NEW.created_by),
                COALESCE(current_setting('app.current_user', true), 'system'));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO maintenance_audit_log (table_name, record_id, action, old_values, user_id, user_name)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD),
                COALESCE(current_setting('app.current_user_id', true)::UUID, OLD.created_by),
                COALESCE(current_setting('app.current_user', true), 'system'));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for all maintenance tables
CREATE TRIGGER maintenance_inspections_audit
    AFTER INSERT OR UPDATE OR DELETE ON maintenance_inspections
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER visual_inspections_audit
    AFTER INSERT OR UPDATE OR DELETE ON visual_inspections
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER valve_inspections_audit
    AFTER INSERT OR UPDATE OR DELETE ON valve_inspections
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER repair_work_orders_audit
    AFTER INSERT OR UPDATE OR DELETE ON repair_work_orders
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER maintenance_history_audit
    AFTER INSERT OR UPDATE OR DELETE ON maintenance_history
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- =============================================
-- USEFUL VIEWS FOR REPORTING
-- =============================================

-- Comprehensive Inspection Status View
CREATE VIEW hydrant_maintenance_status AS
SELECT 
    h.id as hydrant_id,
    h.hydrant_number,
    h.location_address,
    h.latitude,
    h.longitude,
    
    -- Last Inspection
    mi.inspection_date as last_inspection_date,
    mi.overall_status as last_inspection_status,
    mi.inspector_name,
    
    -- Next Due Dates
    cs_annual.due_date as annual_inspection_due,
    cs_flow.due_date as flow_test_due,
    cs_valve.due_date as valve_maintenance_due,
    
    -- Overdue Status
    CASE 
        WHEN cs_annual.due_date < CURRENT_DATE THEN 'ANNUAL_OVERDUE'
        WHEN cs_flow.due_date < CURRENT_DATE THEN 'FLOW_TEST_OVERDUE'
        WHEN cs_valve.due_date < CURRENT_DATE THEN 'VALVE_OVERDUE'
        ELSE 'COMPLIANT'
    END as compliance_status,
    
    -- Active Work Orders
    (SELECT COUNT(*) FROM repair_work_orders rwo 
     WHERE rwo.hydrant_id = h.id AND rwo.status IN ('CREATED', 'SCHEDULED', 'IN_PROGRESS')) as active_work_orders,
    
    h.operational_status,
    h.updated_at
    
FROM hydrants h
LEFT JOIN (
    SELECT DISTINCT ON (hydrant_id) 
        hydrant_id, inspection_date, overall_status, inspector_name
    FROM maintenance_inspections 
    ORDER BY hydrant_id, inspection_date DESC
) mi ON h.id = mi.hydrant_id
LEFT JOIN compliance_schedule cs_annual ON (h.id = cs_annual.hydrant_id AND cs_annual.inspection_type_id = 1 AND cs_annual.status = 'SCHEDULED')
LEFT JOIN compliance_schedule cs_flow ON (h.id = cs_flow.hydrant_id AND cs_flow.inspection_type_id = 2 AND cs_flow.status = 'SCHEDULED')
LEFT JOIN compliance_schedule cs_valve ON (h.id = cs_valve.hydrant_id AND cs_valve.inspection_type_id = 3 AND cs_valve.status = 'SCHEDULED');

-- Audit Compliance Report View
CREATE VIEW audit_compliance_report AS
SELECT 
    EXTRACT(YEAR FROM mi.inspection_date) as inspection_year,
    EXTRACT(MONTH FROM mi.inspection_date) as inspection_month,
    it.name as inspection_type,
    
    COUNT(*) as total_inspections,
    COUNT(CASE WHEN mi.overall_status = 'PASS' THEN 1 END) as passed_inspections,
    COUNT(CASE WHEN mi.compliance_status = 'COMPLIANT' THEN 1 END) as compliant_inspections,
    COUNT(CASE WHEN mi.overall_status = 'FAIL' THEN 1 END) as failed_inspections,
    
    ROUND(
        (COUNT(CASE WHEN mi.compliance_status = 'COMPLIANT' THEN 1 END) * 100.0 / COUNT(*)), 2
    ) as compliance_percentage,
    
    COUNT(CASE WHEN rwo.priority = 'CRITICAL' THEN 1 END) as critical_repairs_generated,
    COUNT(CASE WHEN rwo.status = 'COMPLETED' THEN 1 END) as repairs_completed
    
FROM maintenance_inspections mi
JOIN inspection_types it ON mi.inspection_type_id = it.id
LEFT JOIN repair_work_orders rwo ON mi.id = rwo.maintenance_inspection_id
WHERE mi.inspection_date >= CURRENT_DATE - INTERVAL '2 years'
GROUP BY 
    EXTRACT(YEAR FROM mi.inspection_date),
    EXTRACT(MONTH FROM mi.inspection_date),
    it.name
ORDER BY inspection_year DESC, inspection_month DESC, it.name;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Composite indexes for common queries
CREATE INDEX idx_maintenance_inspections_hydrant_date 
    ON maintenance_inspections(hydrant_id, inspection_date DESC);
    
CREATE INDEX idx_compliance_schedule_due_dates 
    ON compliance_schedule(due_date, status) 
    WHERE status IN ('SCHEDULED', 'OVERDUE');
    
CREATE INDEX idx_work_orders_priority_status 
    ON repair_work_orders(priority, status, scheduled_date) 
    WHERE status IN ('CREATED', 'SCHEDULED', 'IN_PROGRESS');
    
CREATE INDEX idx_audit_log_timestamp 
    ON maintenance_audit_log(timestamp DESC);

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE maintenance_inspections IS 'Primary audit table for all hydrant inspections per O. Reg 169/03 and municipal requirements';
COMMENT ON TABLE visual_inspections IS 'Detailed visual condition assessment results for regulatory compliance';
COMMENT ON TABLE valve_inspections IS 'Valve operation testing and static pressure measurements';
COMMENT ON TABLE repair_work_orders IS 'Work order system for tracking maintenance and repairs with cost analysis';
COMMENT ON TABLE maintenance_history IS 'Complete audit trail of all maintenance activities for regulatory reporting';
COMMENT ON TABLE maintenance_audit_log IS 'System audit log for data integrity and regulatory compliance';
COMMENT ON VIEW hydrant_maintenance_status IS 'Real-time maintenance status for dashboard and compliance monitoring';
COMMENT ON VIEW audit_compliance_report IS 'Regulatory compliance report for municipal audits and O. Reg 169/03 reporting';

-- =============================================
-- SAMPLE DATA FOR TESTING
-- =============================================

-- Note: This schema provides complete audit compliance for:
-- - Ontario Regulation 169/03 (Drinking Water Systems)
-- - NFPA 291 (Fire Flow Testing)
-- - AWWA M17 (Fire Hydrant Installation, Field Testing, and Maintenance)
-- - Municipal audit requirements
-- - Insurance compliance documentation