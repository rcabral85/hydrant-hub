-- HydrantHub Database Schema
-- Fire Hydrant Flow Testing & Management Platform
-- Built for water operators and fire departments

-- Enable PostGIS extension for spatial data
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table (municipalities, fire departments, contractors)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('municipality', 'fire_department', 'contractor', 'utility')),
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table with role-based access
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) CHECK (role IN ('admin', 'operator', 'supervisor', 'viewer', 'fire_inspector')),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fire hydrants inventory
CREATE TABLE hydrants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    hydrant_number VARCHAR(50) NOT NULL,
    location GEOMETRY(POINT, 4326),
    address TEXT,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    year_installed INTEGER,
    size_inches DECIMAL(4,2),
    outlet_count INTEGER DEFAULT 2,
    outlet_sizes JSON, -- Array of outlet sizes: [{"size": 2.5, "count": 2}, {"size": 4.5, "count": 1}]
    steamer_size DECIMAL(4,2),
    nfpa_class VARCHAR(2) CHECK (nfpa_class IN ('AA', 'A', 'B', 'C')),
    available_flow_gpm INTEGER,
    static_pressure_psi DECIMAL(6,2),
    residual_pressure_psi DECIMAL(6,2),
    elevation_feet DECIMAL(8,2),
    water_main_size_inches DECIMAL(4,2),
    valve_to_hydrant_feet INTEGER,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'removed', 'out_of_service')),
    notes TEXT,
    qr_code VARCHAR(100), -- QRC code for mobile scanning
    last_tested DATE,
    next_test_due DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, hydrant_number)
);

-- Create spatial index for hydrant locations
CREATE INDEX idx_hydrants_location ON hydrants USING GIST (location);

-- Flow tests (NFPA 291 compliant)
CREATE TABLE flow_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hydrant_id UUID REFERENCES hydrants(id),
    test_number VARCHAR(50),
    test_date DATE NOT NULL,
    test_time TIME,
    tested_by_user_id UUID REFERENCES users(id),
    weather_conditions VARCHAR(100),
    temperature_f INTEGER,
    
    -- Test Configuration
    test_type VARCHAR(20) DEFAULT 'flow' CHECK (test_type IN ('flow', 'static', 'residual')),
    test_method VARCHAR(30) DEFAULT 'pitot_gauge' CHECK (test_method IN ('pitot_gauge', 'flow_meter', 'weir')),
    
    -- Pre-test readings
    static_pressure_psi DECIMAL(6,2) NOT NULL,
    
    -- Flow test data (multiple outlets)
    outlets_data JSON, -- Array: [{"outlet_size": 2.5, "pitot_pressure": 45, "coefficient": 0.9, "flow_gpm": 756}]
    
    -- Calculated results
    total_flow_gpm INTEGER,
    residual_pressure_psi DECIMAL(6,2),
    available_fire_flow_gpm INTEGER, -- At 20 PSI residual
    nfpa_class VARCHAR(2),
    
    -- Test validation
    is_valid BOOLEAN DEFAULT true,
    validation_notes TEXT,
    
    -- Compliance
    meets_nfpa_291 BOOLEAN DEFAULT true,
    compliance_notes TEXT,
    
    -- Quality control
    reviewed_by_user_id UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    approved BOOLEAN DEFAULT false,
    
    -- Additional data
    photos JSON, -- Array of photo URLs/metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visual inspections (separate from flow tests)
CREATE TABLE inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hydrant_id UUID REFERENCES hydrants(id),
    inspection_date DATE NOT NULL,
    inspector_user_id UUID REFERENCES users(id),
    inspection_type VARCHAR(30) DEFAULT 'routine' CHECK (inspection_type IN ('routine', 'annual', 'post_repair', 'complaint')),
    
    -- Physical condition checks
    hydrant_accessibility VARCHAR(20) CHECK (hydrant_accessibility IN ('good', 'fair', 'poor', 'blocked')),
    paint_condition VARCHAR(20) CHECK (paint_condition IN ('good', 'fair', 'poor', 'needs_painting')),
    cap_condition VARCHAR(20) CHECK (cap_condition IN ('good', 'fair', 'poor', 'missing')),
    outlet_condition VARCHAR(20) CHECK (outlet_condition IN ('good', 'fair', 'poor', 'damaged')),
    operating_nut_condition VARCHAR(20) CHECK (operating_nut_condition IN ('good', 'fair', 'poor', 'damaged')),
    
    -- Operational checks
    opens_easily BOOLEAN,
    closes_properly BOOLEAN,
    water_clarity VARCHAR(20) CHECK (water_clarity IN ('clear', 'cloudy', 'rusty', 'dirty')),
    drainage_adequate BOOLEAN,
    
    -- Issues found
    issues_found JSON, -- Array of issue types and descriptions
    maintenance_required BOOLEAN DEFAULT false,
    priority_level VARCHAR(10) CHECK (priority_level IN ('low', 'medium', 'high', 'urgent')),
    
    -- Documentation
    photos JSON, -- Array of inspection photos
    notes TEXT,
    overall_condition VARCHAR(20) CHECK (overall_condition IN ('excellent', 'good', 'fair', 'poor', 'unsafe')),
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    follow_up_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance records
CREATE TABLE maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hydrant_id UUID REFERENCES hydrants(id),
    work_order_number VARCHAR(50),
    maintenance_date DATE NOT NULL,
    performed_by_user_id UUID REFERENCES users(id),
    maintenance_type VARCHAR(30) CHECK (maintenance_type IN ('repair', 'replacement', 'painting', 'lubrication', 'seasonal')),
    
    -- Work performed
    work_description TEXT NOT NULL,
    parts_used JSON, -- Array of parts/materials
    labor_hours DECIMAL(4,2),
    cost DECIMAL(10,2),
    
    -- Before/after photos
    before_photos JSON,
    after_photos JSON,
    
    -- Completion status
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    completion_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports generated from tests and inspections
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    report_type VARCHAR(30) CHECK (report_type IN ('flow_test', 'inspection', 'maintenance', 'summary')),
    title VARCHAR(255) NOT NULL,
    
    -- Content references
    hydrant_ids JSON, -- Array of hydrant UUIDs included
    flow_test_ids JSON, -- Array of flow test UUIDs
    inspection_ids JSON, -- Array of inspection UUIDs
    
    -- Report metadata
    generated_by_user_id UUID REFERENCES users(id),
    date_range_start DATE,
    date_range_end DATE,
    
    -- File storage
    pdf_file_path VARCHAR(500),
    excel_file_path VARCHAR(500),
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'sent', 'archived')),
    sent_to JSON, -- Array of email addresses report was sent to
    sent_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System configuration and settings
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    updated_by_user_id UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, setting_key)
);

-- Indexes for performance
CREATE INDEX idx_hydrants_org_id ON hydrants(organization_id);
CREATE INDEX idx_hydrants_number ON hydrants(hydrant_number);
CREATE INDEX idx_hydrants_status ON hydrants(status);
CREATE INDEX idx_hydrants_next_test ON hydrants(next_test_due);

CREATE INDEX idx_flow_tests_hydrant_id ON flow_tests(hydrant_id);
CREATE INDEX idx_flow_tests_date ON flow_tests(test_date);
CREATE INDEX idx_flow_tests_tested_by ON flow_tests(tested_by_user_id);

CREATE INDEX idx_inspections_hydrant_id ON inspections(hydrant_id);
CREATE INDEX idx_inspections_date ON inspections(inspection_date);

CREATE INDEX idx_users_org_id ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);

-- Insert default organization and admin user
INSERT INTO organizations (id, name, type, contact_email) VALUES
('00000000-0000-0000-0000-000000000001', 'Trident Systems', 'contractor', 'info@tridentsys.ca');

INSERT INTO users (id, organization_id, username, email, password_hash, first_name, last_name, role) VALUES
('00000000-0000-0000-0000-000000000001', 
 '00000000-0000-0000-0000-000000000001', 
 'admin', 
 'admin@tridentsys.ca', 
 '$2b$10$example_hash_change_this', 
 'Admin', 
 'User', 
 'admin');

-- Sample hydrant data for testing (Mississauga area)
INSERT INTO hydrants (id, organization_id, hydrant_number, location, address, outlet_sizes, nfpa_class, available_flow_gpm, status) VALUES
('11111111-1111-1111-1111-111111111111',
 '00000000-0000-0000-0000-000000000001',
 'H-001',
 ST_SetSRID(ST_MakePoint(-79.6441, 43.5890), 4326),
 '123 Main Street, Mississauga, ON',
 '[{"size": 2.5, "count": 2}, {"size": 4.5, "count": 1}]',
 'A',
 1200,
 'active'),
('22222222-2222-2222-2222-222222222222',
 '00000000-0000-0000-0000-000000000001',
 'H-002',
 ST_SetSRID(ST_MakePoint(-79.6500, 43.5920), 4326),
 '456 Oak Avenue, Mississauga, ON',
 '[{"size": 2.5, "count": 2}, {"size": 4.5, "count": 1}]',
 'B',
 850,
 'active');

-- Sample system settings
INSERT INTO system_settings (organization_id, setting_key, setting_value, setting_type, description) VALUES
('00000000-0000-0000-0000-000000000001', 'default_outlet_coefficient', '0.9', 'number', 'Default outlet coefficient for NFPA 291 calculations'),
('00000000-0000-0000-0000-000000000001', 'required_residual_pressure', '20', 'number', 'Required residual pressure for fire flow calculations (PSI)'),
('00000000-0000-0000-0000-000000000001', 'test_frequency_months', '12', 'number', 'Default frequency for hydrant flow testing (months)'),
('00000000-0000-0000-0000-000000000001', 'inspection_frequency_months', '6', 'number', 'Default frequency for hydrant inspections (months)');

-- Add helpful comments
COMMENT ON TABLE hydrants IS 'Fire hydrant inventory with GPS locations and technical specifications';
COMMENT ON TABLE flow_tests IS 'NFPA 291 compliant flow test records with calculations';
COMMENT ON TABLE inspections IS 'Visual and operational hydrant inspections';
COMMENT ON TABLE maintenance_records IS 'Maintenance and repair history for hydrants';
COMMENT ON COLUMN hydrants.location IS 'GPS coordinates in WGS84 (EPSG:4326)';
COMMENT ON COLUMN flow_tests.outlets_data IS 'JSON array of outlet test data with calculations';
COMMENT ON COLUMN hydrants.nfpa_class IS 'NFPA fire flow classification: AA (≥1500 GPM), A (1000-1499), B (500-999), C (<500)';
