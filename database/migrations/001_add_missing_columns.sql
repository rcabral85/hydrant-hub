-- Add missing columns to hydrants table
ALTER TABLE hydrants ADD COLUMN IF NOT EXISTS operational_status VARCHAR(50) DEFAULT 'OPERATIONAL';
ALTER TABLE hydrants ADD COLUMN IF NOT EXISTS nfpa_classification VARCHAR(10);
ALTER TABLE hydrants ADD COLUMN IF NOT EXISTS location_address TEXT;
ALTER TABLE hydrants ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(100);
ALTER TABLE hydrants ADD COLUMN IF NOT EXISTS model VARCHAR(100);
ALTER TABLE hydrants ADD COLUMN IF NOT EXISTS watermain_size_mm INTEGER DEFAULT 200;
ALTER TABLE hydrants ADD COLUMN IF NOT EXISTS inspector_notes TEXT;
ALTER TABLE hydrants ADD COLUMN IF NOT EXISTS qr_code VARCHAR(100);
ALTER TABLE hydrants ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE hydrants ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);
ALTER TABLE hydrants ADD COLUMN IF NOT EXISTS total_flow_gpm INTEGER;
ALTER TABLE hydrants ADD COLUMN IF NOT EXISTS static_pressure_psi INTEGER;
ALTER TABLE hydrants ADD COLUMN IF NOT EXISTS residual_pressure_psi INTEGER;
ALTER TABLE hydrants ADD COLUMN IF NOT EXISTS nfpa_class VARCHAR(10);

-- Add missing columns to flow_tests table
ALTER TABLE flow_tests ADD COLUMN IF NOT EXISTS total_flow_gpm INTEGER;
ALTER TABLE flow_tests ADD COLUMN IF NOT EXISTS static_pressure_psi INTEGER;
ALTER TABLE flow_tests ADD COLUMN IF NOT EXISTS residual_pressure_psi INTEGER;
ALTER TABLE flow_tests ADD COLUMN IF NOT EXISTS nfpa_class VARCHAR(10);
ALTER TABLE flow_tests ADD COLUMN IF NOT EXISTS test_number VARCHAR(50);
ALTER TABLE flow_tests ADD COLUMN IF NOT EXISTS operator_name VARCHAR(100);

-- Create maintenance_inspections table
CREATE TABLE IF NOT EXISTS maintenance_inspections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hydrant_id uuid REFERENCES hydrants(id),
  organization_id uuid REFERENCES organizations(id),
  inspection_date date,
  inspector_name varchar(100),
  inspection_type varchar(50),
  overall_status varchar(50),
  overall_condition varchar(50),
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
