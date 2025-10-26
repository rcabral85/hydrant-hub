-- HydrantHub Database Schema
-- PostgreSQL 14+ with PostGIS extension required

-- Enable PostGIS for spatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users and Organizations
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'municipality', 'fire_department', 'contractor', 'engineering_firm'
  address TEXT,
  city VARCHAR(100),
  province VARCHAR(50),
  postal_code VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL, -- 'admin', 'manager', 'operator', 'viewer'
  phone VARCHAR(50),
  certification_number VARCHAR(100), -- Water operator or tester certification
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hydrant Inventory
CREATE TABLE hydrants (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  hydrant_number VARCHAR(100) NOT NULL, -- Municipal ID number
  location GEOGRAPHY(POINT, 4326) NOT NULL, -- Latitude/Longitude
  address TEXT,
  street VARCHAR(255),
  cross_street VARCHAR(255),
  -- Physical specifications
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  hydrant_type VARCHAR(50), -- 'dry_barrel', 'wet_barrel'
  main_valve_size DECIMAL(4,2), -- inches
  installation_date DATE,
  -- Outlet specifications
  outlet_count INTEGER DEFAULT 2,
  outlet_2_5_inch_count INTEGER DEFAULT 0,
  outlet_4_5_inch_count INTEGER DEFAULT 0,
  outlet_6_inch_count INTEGER DEFAULT 0,
  steamer_connection BOOLEAN DEFAULT FALSE,
  -- Operational status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'out_of_service', 'needs_repair', 'retired'
  pressure_zone VARCHAR(100),
  watermain_size DECIMAL(4,2), -- inches
  -- Flow classification (updated after flow tests)
  nfpa_class VARCHAR(10), -- 'AA', 'A', 'B', 'C'
  available_flow_gpm INTEGER, -- Calculated available fire flow at 20 PSI
  last_flow_test_date DATE,
  last_inspection_date DATE,
  -- Additional info
  notes TEXT,
  qr_code VARCHAR(255), -- QR code identifier
  photo_url TEXT, -- Primary photo
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  CONSTRAINT unique_org_hydrant UNIQUE(organization_id, hydrant_number)
);

-- Spatial index for geographic queries
CREATE INDEX idx_hydrants_location ON hydrants USING GIST(location);
CREATE INDEX idx_hydrants_org ON hydrants(organization_id);
CREATE INDEX idx_hydrants_status ON hydrants(status);

-- Flow Tests (NFPA 291)
CREATE TABLE flow_tests (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  test_date DATE NOT NULL,
  test_time TIME NOT NULL,
  tester_id INTEGER REFERENCES users(id),
  weather_conditions TEXT,
  temperature_celsius DECIMAL(4,1),
  -- Test hydrant (static/residual readings)
  test_hydrant_id INTEGER REFERENCES hydrants(id) ON DELETE CASCADE NOT NULL,
  static_pressure_psi DECIMAL(6,2) NOT NULL,
  residual_pressure_psi DECIMAL(6,2) NOT NULL,
  -- Calculated results
  total_flow_gpm DECIMAL(8,2) NOT NULL, -- Sum of all flow hydrants
  available_flow_20psi_gpm DECIMAL(8,2) NOT NULL, -- Calculated Q_R
  nfpa_classification VARCHAR(10), -- 'AA', 'A', 'B', 'C'
  -- Test notes
  notes TEXT,
  report_pdf_url TEXT, -- Generated PDF report
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flow_tests_org ON flow_tests(organization_id);
CREATE INDEX idx_flow_tests_hydrant ON flow_tests(test_hydrant_id);
CREATE INDEX idx_flow_tests_date ON flow_tests(test_date);

-- Flow hydrants (outlets flowed during test)
CREATE TABLE flow_test_outlets (
  id SERIAL PRIMARY KEY,
  flow_test_id INTEGER REFERENCES flow_tests(id) ON DELETE CASCADE NOT NULL,
  flow_hydrant_id INTEGER REFERENCES hydrants(id) NOT NULL,
  outlet_diameter_inches DECIMAL(4,2) NOT NULL, -- 2.5, 4.5, 6.0
  coefficient_discharge DECIMAL(3,2) DEFAULT 0.90, -- 0.70, 0.80, 0.90
  pitot_pressure_psi DECIMAL(6,2) NOT NULL,
  calculated_flow_gpm DECIMAL(8,2) NOT NULL, -- Q = 29.83 × c × d² × √P
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flow_outlets_test ON flow_test_outlets(flow_test_id);

-- Inspections (Annual)
CREATE TABLE inspections (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  hydrant_id INTEGER REFERENCES hydrants(id) ON DELETE CASCADE NOT NULL,
  inspection_date DATE NOT NULL,
  inspector_id INTEGER REFERENCES users(id),
  -- Visual checks
  overall_condition VARCHAR(50), -- 'excellent', 'good', 'fair', 'poor'
  paint_condition VARCHAR(50),
  caps_present BOOLEAN,
  caps_condition VARCHAR(50),
  operating_nut_condition VARCHAR(50),
  -- Operational checks
  valve_operation VARCHAR(50), -- 'smooth', 'stiff', 'seized'
  opens_fully BOOLEAN,
  closes_fully BOOLEAN,
  leaks_detected BOOLEAN,
  leak_description TEXT,
  drainage_adequate BOOLEAN,
  -- Accessibility
  obstructions_present BOOLEAN,
  obstruction_description TEXT,
  height_above_ground_inches DECIMAL(5,2),
  -- Results
  status VARCHAR(50), -- 'pass', 'fail', 'needs_maintenance'
  repairs_required TEXT,
  notes TEXT,
  -- Photos
  photo_urls TEXT[], -- Array of photo URLs
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inspections_org ON inspections(organization_id);
CREATE INDEX idx_inspections_hydrant ON inspections(hydrant_id);
CREATE INDEX idx_inspections_date ON inspections(inspection_date);

-- Maintenance logs
CREATE TABLE maintenance_logs (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  hydrant_id INTEGER REFERENCES hydrants(id) ON DELETE CASCADE NOT NULL,
  maintenance_date DATE NOT NULL,
  performed_by INTEGER REFERENCES users(id),
  maintenance_type VARCHAR(100) NOT NULL, -- 'repair', 'replacement', 'painting', 'lubrication', 'flushing'
  description TEXT NOT NULL,
  parts_replaced TEXT,
  labor_hours DECIMAL(5,2),
  cost_cad DECIMAL(10,2),
  before_photo_url TEXT,
  after_photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_maintenance_org ON maintenance_logs(organization_id);
CREATE INDEX idx_maintenance_hydrant ON maintenance_logs(hydrant_id);

-- Schedules and reminders
CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  hydrant_id INTEGER REFERENCES hydrants(id) ON DELETE CASCADE,
  schedule_type VARCHAR(50) NOT NULL, -- 'flow_test', 'inspection', 'maintenance'
  due_date DATE NOT NULL,
  completed_date DATE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'overdue'
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schedules_org ON schedules(organization_id);
CREATE INDEX idx_schedules_hydrant ON schedules(hydrant_id);
CREATE INDEX idx_schedules_due_date ON schedules(due_date);
CREATE INDEX idx_schedules_status ON schedules(status);

-- Comments/Notes
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  hydrant_id INTEGER REFERENCES hydrants(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for changes
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  table_name VARCHAR(100) NOT NULL,
  record_id INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_org ON audit_log(organization_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_date ON audit_log(created_at);

-- Views for common queries
CREATE VIEW hydrants_due_for_flow_test AS
SELECT h.*,
  COALESCE(h.last_flow_test_date + INTERVAL '5 years', h.installation_date + INTERVAL '1 year') AS next_flow_test_due
FROM hydrants h
WHERE h.status = 'active'
  AND COALESCE(h.last_flow_test_date, h.installation_date) + INTERVAL '5 years' < CURRENT_DATE + INTERVAL '90 days';

CREATE VIEW hydrants_due_for_inspection AS
SELECT h.*,
  COALESCE(h.last_inspection_date + INTERVAL '1 year', h.installation_date + INTERVAL '6 months') AS next_inspection_due
FROM hydrants h
WHERE h.status = 'active'
  AND COALESCE(h.last_inspection_date, h.installation_date) + INTERVAL '1 year' < CURRENT_DATE + INTERVAL '30 days';

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hydrants_updated_at BEFORE UPDATE ON hydrants
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data insert function
CREATE OR REPLACE FUNCTION insert_sample_data() RETURNS void AS $$
BEGIN
  -- Insert sample organization
  INSERT INTO organizations (name, type, city, province)
  VALUES ('Town of Milton', 'municipality', 'Milton', 'Ontario');

  -- Insert sample user (password: 'demo123' hashed with bcrypt)
  INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role)
  VALUES (1, 'demo@milton.ca', '$2b$10$abcdefghijklmnopqrstuvwxyz123456789', 'Richard', 'Cabral', 'admin');
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE hydrants IS 'Fire hydrant inventory with location and specifications';
COMMENT ON TABLE flow_tests IS 'NFPA 291 compliant flow test records';
COMMENT ON TABLE inspections IS 'Annual visual and operational inspections';
COMMENT ON TABLE maintenance_logs IS 'Repair and maintenance history';
COMMENT ON TABLE schedules IS 'Automated scheduling for tests and inspections';
