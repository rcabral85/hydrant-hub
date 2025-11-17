-- HydrantHub Master Database Schema
-- Consolidated schema for production deployment
-- PostgreSQL 14+ with PostGIS extension required
-- Version: 2.0 - Unified maintenance system

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- CORE TABLES
-- ============================================

-- Organizations table (multi-tenancy)
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT 'municipality',
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    subscription_tier VARCHAR(50) DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
    hydrant_limit INTEGER DEFAULT 50,
    stripe_customer_id VARCHAR(255),
    subscription_status VARCHAR(50) DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'past_due')),
    trial_ends_at TIMESTAMP,
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
    invite_token VARCHAR(255),
    invite_expires_at TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hydrants table with PostGIS geometry
CREATE TABLE IF NOT EXISTS hydrants (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    hydrant_id VARCHAR(50) NOT NULL,
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
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_service', 'removed')),
    last_inspection_date DATE,
    last_flow_test_date DATE,
    next_test_due DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, hydrant_id)
);

-- Create spatial index on hydrant locations
CREATE INDEX IF NOT EXISTS idx_hydrants_location ON hydrants USING GIST(location);

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

-- ============================================
-- UNIFIED MAINTENANCE SYSTEM
-- ============================================

-- Maintenance table (unified: inspections, work orders, repairs)
CREATE TABLE IF NOT EXISTS maintenance (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    hydrant_id INTEGER REFERENCES hydrants(id) ON DELETE CASCADE,
    work_order_number VARCHAR(50),
    maintenance_type VARCHAR(50) NOT NULL CHECK (maintenance_type IN ('inspection', 'repair', 'painting', 'lubrication', 'winterization', 'flow_test', 'other')),
    title VARCHAR(255),
    description TEXT,
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    assigned_to INTEGER REFERENCES users(id),
    inspector_id INTEGER REFERENCES users(id),
    scheduled_date DATE,
    completed_date DATE,
    inspection_result VARCHAR(50) CHECK (inspection_result IN ('pass', 'fail', 'needs_repair', NULL)),
    findings TEXT,
    photos JSON,
    parts_used JSON,
    cost DECIMAL(10, 2),
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, work_order_number)
);

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

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_invite_token ON users(invite_token);
CREATE INDEX IF NOT EXISTS idx_hydrants_organization ON hydrants(organization_id);
CREATE INDEX IF NOT EXISTS idx_hydrants_hydrant_id ON hydrants(hydrant_id);
CREATE INDEX IF NOT EXISTS idx_hydrants_status ON hydrants(status);
CREATE INDEX IF NOT EXISTS idx_flow_tests_hydrant ON flow_tests(hydrant_id);
CREATE INDEX IF NOT EXISTS idx_flow_tests_organization ON flow_tests(organization_id);
CREATE INDEX IF NOT EXISTS idx_flow_tests_date ON flow_tests(test_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_hydrant ON maintenance(hydrant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_organization ON maintenance(organization_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_type ON maintenance(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled_date ON maintenance(scheduled_date);

-- ============================================
-- TRIGGERS AND FUNCTIONS
-- ============================================

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

CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON maintenance
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

-- Function to check hydrant limit before insert
CREATE OR REPLACE FUNCTION check_hydrant_limit()
RETURNS TRIGGER AS $$
DECLARE
    org_limit INTEGER;
    current_count INTEGER;
BEGIN
    -- Get organization's hydrant limit
    SELECT hydrant_limit INTO org_limit
    FROM organizations
    WHERE id = NEW.organization_id;
    
    -- Count current hydrants
    SELECT COUNT(*) INTO current_count
    FROM hydrants
    WHERE organization_id = NEW.organization_id
    AND status != 'removed';
    
    -- Check if limit exceeded
    IF current_count >= org_limit THEN
        RAISE EXCEPTION 'Hydrant limit reached. Current: %, Limit: %. Please upgrade your subscription.', current_count, org_limit;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_hydrant_limit
    BEFORE INSERT ON hydrants
    FOR EACH ROW
    EXECUTE FUNCTION check_hydrant_limit();

-- ============================================
-- INITIAL DATA (Optional - for testing)
-- ============================================

-- Insert demo organization (comment out for production)
-- INSERT INTO organizations (name, type, email, subscription_tier, hydrant_limit) 
-- VALUES ('Demo Municipality', 'municipality', 'demo@example.com', 'professional', 500)
-- ON CONFLICT DO NOTHING;

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- View for hydrant compliance status
CREATE OR REPLACE VIEW hydrant_compliance AS
SELECT 
    h.id,
    h.organization_id,
    h.hydrant_id,
    h.address,
    h.last_inspection_date,
    h.last_flow_test_date,
    CASE 
        WHEN h.last_inspection_date IS NULL THEN 'never_inspected'
        WHEN h.last_inspection_date < CURRENT_DATE - INTERVAL '1 year' THEN 'overdue'
        WHEN h.last_inspection_date < CURRENT_DATE - INTERVAL '9 months' THEN 'due_soon'
        ELSE 'compliant'
    END as inspection_status,
    CASE 
        WHEN h.last_flow_test_date IS NULL THEN 'never_tested'
        WHEN h.last_flow_test_date < CURRENT_DATE - INTERVAL '1 year' THEN 'overdue'
        WHEN h.last_flow_test_date < CURRENT_DATE - INTERVAL '9 months' THEN 'due_soon'
        ELSE 'compliant'
    END as flow_test_status
FROM hydrants h
WHERE h.status = 'active';

-- View for maintenance statistics
CREATE OR REPLACE VIEW maintenance_stats AS
SELECT 
    organization_id,
    maintenance_type,
    status,
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (completed_date - scheduled_date))/86400) as avg_days_to_complete
FROM maintenance
WHERE completed_date IS NOT NULL
GROUP BY organization_id, maintenance_type, status;

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_version (
    version VARCHAR(10) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

INSERT INTO schema_version (version, description) 
VALUES ('2.0', 'Unified maintenance system with subscription management')
ON CONFLICT (version) DO NOTHING;