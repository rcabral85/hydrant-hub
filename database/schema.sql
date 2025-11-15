-- HydrantHub Base Database Schema
-- Complete schema for fresh installations
-- PostgreSQL 14+ with PostGIS extension required

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Organizations table (multi-tenancy)
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT 'municipality',
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
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
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- Inspections table
CREATE TABLE IF NOT EXISTS inspections (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    hydrant_id INTEGER REFERENCES hydrants(id) ON DELETE CASCADE,
    inspector_id INTEGER REFERENCES users(id),
    inspection_date DATE NOT NULL,
    inspection_type VARCHAR(50) DEFAULT 'visual',
    status VARCHAR(50) DEFAULT 'pass',
    findings TEXT,
    photos JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work orders / Maintenance tracking
CREATE TABLE IF NOT EXISTS work_orders (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    hydrant_id INTEGER REFERENCES hydrants(id) ON DELETE CASCADE,
    work_order_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending',
    assigned_to INTEGER REFERENCES users(id),
    scheduled_date DATE,
    completed_date DATE,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance records
CREATE TABLE IF NOT EXISTS maintenance_records (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    hydrant_id INTEGER REFERENCES hydrants(id) ON DELETE CASCADE,
    work_order_id INTEGER REFERENCES work_orders(id),
    maintenance_type VARCHAR(100),
    performed_by INTEGER REFERENCES users(id),
    performed_date DATE NOT NULL,
    description TEXT,
    parts_used JSON,
    cost DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_hydrants_organization ON hydrants(organization_id);
CREATE INDEX IF NOT EXISTS idx_hydrants_number ON hydrants(hydrant_number);
CREATE INDEX IF NOT EXISTS idx_flow_tests_hydrant ON flow_tests(hydrant_id);
CREATE INDEX IF NOT EXISTS idx_flow_tests_date ON flow_tests(test_date);
CREATE INDEX IF NOT EXISTS idx_inspections_hydrant ON inspections(hydrant_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_hydrant ON work_orders(hydrant_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);

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

CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_records_updated_at BEFORE UPDATE ON maintenance_records
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

-- Insert default/demo organization (optional, for testing)
-- Comment out or remove for production
-- INSERT INTO organizations (name, type, email) 
-- VALUES ('Demo Municipality', 'municipality', 'demo@example.com')
-- ON CONFLICT DO NOTHING;
