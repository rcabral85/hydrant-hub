-- HydrantHub Production Database Schema
-- Unified schema for Railway deployment
-- PostgreSQL 14+ with PostGIS extension required
-- Version: 2.0 - Production Ready

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =============================================
-- ORGANIZATIONS & USERS
-- =============================================

-- Organizations table (multi-tenancy)
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT 'municipality',
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    
    -- Subscription Management
    subscription_tier VARCHAR(50) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')),
    hydrant_limit INTEGER DEFAULT 50,
    subscription_start_date DATE,
    subscription_end_date DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Users table with role-based access control
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
    is_superadmin BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Invitation System
    invited_by INTEGER REFERENCES users(id),
    invitation_token VARCHAR(255),
    invitation_expires TIMESTAMP,
    
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- HYDRANT MANAGEMENT
-- =============================================

-- Hydrants table with PostGIS geometry
CREATE TABLE IF NOT EXISTS hydrants (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    hydrant_number VARCHAR(50) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location GEOMETRY(Point, 4326),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    year_installed INTEGER,
    size_inches DECIMAL(4, 2),
    outlet_count INTEGER DEFAULT 2,
    nfpa_class VARCHAR(10),
    available_flow_gpm INTEGER,
    status VARCHAR(50) DEFAULT 'active',
    last_inspection_date DATE,
    last_flow_test_date DATE,
    next_test_due DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, hydrant_number)
);

-- Create spatial index on hydrant locations
CREATE INDEX IF NOT EXISTS idx_hydrants_location ON hydrants USING GIST(location);

-- =============================================
-- FLOW TESTING (NFPA 291)
-- =============================================

-- Flow tests table (NFPA 291 compliant)
CREATE TABLE IF NOT EXISTS flow_tests (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    hydrant_id INTEGER REFERENCES hydrants(id) ON DELETE CASCADE,
    test_number VARCHAR(50) UNIQUE NOT NULL,
    test_date DATE NOT NULL,
    tester_id INTEGER REFERENCES users(id),
    static_pressure_psi DECIMAL(6, 2),
    residual_pressure_psi DECIMAL(6, 2),
    total_flow_gpm INTEGER,
    available_flow_gpm INTEGER,
    nfpa_class VARCHAR(10),
    is_nfpa_compliant BOOLEAN DEFAULT true,
    weather_conditions VARCHAR(100),
    temperature_f INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Flow test outlets (multiple outlets per test)
CREATE TABLE IF NOT EXISTS flow_test_outlets (
    id SERIAL PRIMARY KEY,
    flow_test_id INTEGER REFERENCES flow_tests(id) ON DELETE CASCADE,
    outlet_number INTEGER,
    size_inches DECIMAL(4, 2),
    pitot_pressure_psi DECIMAL(6, 2),
    coefficient DECIMAL(4, 2) DEFAULT 0.9,
    flow_gpm INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- MAINTENANCE & INSPECTIONS (UNIFIED)
-- =============================================

-- Unified maintenance/inspection table
CREATE TABLE IF NOT EXISTS maintenance_inspections (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    hydrant_id INTEGER REFERENCES hydrants(id) ON DELETE CASCADE,
    
    -- Type: inspection, work_order, flow_test, repair, painting, etc.
    inspection_type VARCHAR(50) DEFAULT 'QUICK_MAINTENANCE',
    
    -- Personnel
    inspector_name VARCHAR(100) NOT NULL,
    assigned_to VARCHAR(100),
    
    -- Dates
    inspection_date TIMESTAMP NOT NULL,
    scheduled_date TIMESTAMP,
    completed_date TIMESTAMP,
    
    -- Status
    status VARCHAR(50) DEFAULT 'COMPLETED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'PENDING')),
    overall_status VARCHAR(20) CHECK (overall_status IN ('PASS', 'FAIL', 'NEEDS_REPAIR')),
    
    -- Quick inspection fields (flattened for simple UI)
    paint_condition VARCHAR(20),
    body_condition VARCHAR(20),
    cap_condition VARCHAR(20),
    chains_present BOOLEAN DEFAULT true,
    clearance_adequate BOOLEAN DEFAULT true,
    valve_operation VARCHAR(20),
    static_pressure_psi DECIMAL(6, 2),
    valve_leak_detected BOOLEAN DEFAULT false,
    immediate_action_required BOOLEAN DEFAULT false,
    safety_hazard_description TEXT,
    overall_condition VARCHAR(20),
    repair_needed BOOLEAN DEFAULT false,
    priority_level VARCHAR(10) CHECK (priority_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    
    -- Notes and documentation
    inspector_notes TEXT,
    photos JSON,
    
    -- Audit trail
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work orders table (for repairs and maintenance tasks)
CREATE TABLE IF NOT EXISTS work_orders (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    hydrant_id INTEGER REFERENCES hydrants(id) ON DELETE CASCADE,
    inspection_id INTEGER REFERENCES maintenance_inspections(id),
    
    work_order_number VARCHAR(50) UNIQUE,
    title VARCHAR(255),
    description TEXT,
    priority VARCHAR(10) CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'MEDIUM',
    status VARCHAR(50) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    
    -- Assignment
    assigned_to VARCHAR(100),
    
    -- Dates
    scheduled_date DATE,
    completed_date DATE,
    
    -- Cost tracking
    estimated_cost DECIMAL(10, 2),
    actual_cost DECIMAL(10, 2),
    labor_hours DECIMAL(5, 2),
    
    -- Documentation
    completion_notes TEXT,
    photos JSON,
    
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance history audit trail
CREATE TABLE IF NOT EXISTS maintenance_history (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    hydrant_id INTEGER REFERENCES hydrants(id) ON DELETE CASCADE,
    
    action_type VARCHAR(50),
    action_description TEXT NOT NULL,
    action_date TIMESTAMP NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    notes TEXT,
    
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- IMPORT TRACKING
-- =============================================

-- Hydrant import history
CREATE TABLE IF NOT EXISTS hydrant_imports (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    imported_by INTEGER REFERENCES users(id),
    filename VARCHAR(255),
    total_rows INTEGER,
    successful_rows INTEGER,
    failed_rows INTEGER,
    errors JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_hydrants_organization ON hydrants(organization_id);
CREATE INDEX IF NOT EXISTS idx_hydrants_number ON hydrants(hydrant_number);
CREATE INDEX IF NOT EXISTS idx_flow_tests_hydrant ON flow_tests(hydrant_id);
CREATE INDEX IF NOT EXISTS idx_flow_tests_date ON flow_tests(test_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_inspections_hydrant ON maintenance_inspections(hydrant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_inspections_date ON maintenance_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_work_orders_hydrant ON work_orders(hydrant_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);

-- =============================================
-- TRIGGERS & FUNCTIONS
-- =============================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to all tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hydrants_updated_at BEFORE UPDATE ON hydrants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flow_tests_updated_at BEFORE UPDATE ON flow_tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_inspections_updated_at BEFORE UPDATE ON maintenance_inspections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update hydrant location geometry from lat/long
CREATE OR REPLACE FUNCTION update_hydrant_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hydrant_location_trigger
    BEFORE INSERT OR UPDATE ON hydrants
    FOR EACH ROW
    EXECUTE FUNCTION update_hydrant_location();

-- =============================================
-- VIEWS FOR DASHBOARD & REPORTING
-- =============================================

-- Dashboard statistics view
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    
    -- Hydrant counts
    COUNT(DISTINCT h.id) as total_hydrants,
    COUNT(DISTINCT CASE WHEN h.status = 'active' THEN h.id END) as active_hydrants,
    o.hydrant_limit,
    
    -- Recent activity
    COUNT(DISTINCT CASE WHEN mi.inspection_date >= CURRENT_DATE - INTERVAL '30 days' THEN mi.id END) as inspections_last_30_days,
    COUNT(DISTINCT CASE WHEN ft.test_date >= CURRENT_DATE - INTERVAL '30 days' THEN ft.id END) as flow_tests_last_30_days,
    
    -- Work orders
    COUNT(DISTINCT CASE WHEN wo.status = 'OPEN' THEN wo.id END) as open_work_orders,
    COUNT(DISTINCT CASE WHEN wo.status = 'IN_PROGRESS' THEN wo.id END) as in_progress_work_orders,
    COUNT(DISTINCT CASE WHEN wo.priority = 'CRITICAL' AND wo.status != 'COMPLETED' THEN wo.id END) as critical_work_orders,
    
    -- Compliance
    COUNT(DISTINCT CASE WHEN h.last_inspection_date < CURRENT_DATE - INTERVAL '1 year' OR h.last_inspection_date IS NULL THEN h.id END) as inspections_overdue
    
FROM organizations o
LEFT JOIN hydrants h ON o.id = h.organization_id
LEFT JOIN maintenance_inspections mi ON h.id = mi.hydrant_id
LEFT JOIN flow_tests ft ON h.id = ft.hydrant_id
LEFT JOIN work_orders wo ON h.id = wo.hydrant_id
WHERE o.is_active = true
GROUP BY o.id, o.name, o.hydrant_limit;

-- =============================================
-- SEED DATA (Optional - for testing)
-- =============================================

-- Insert default organization for testing
-- COMMENT OUT FOR PRODUCTION
-- INSERT INTO organizations (name, type, email, subscription_tier, hydrant_limit) 
-- VALUES ('Demo Municipality', 'municipality', 'demo@example.com', 'free', 50)
-- ON CONFLICT DO NOTHING;

-- =============================================
-- SCHEMA VERSION
-- =============================================

CREATE TABLE IF NOT EXISTS schema_version (
    version VARCHAR(10) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

INSERT INTO schema_version (version, description) 
VALUES ('2.0', 'Production-ready unified schema')
ON CONFLICT (version) DO UPDATE SET applied_at = CURRENT_TIMESTAMP;

-- Schema complete and ready for deployment