-- Migration: Enhanced Role-Based Access Control
-- Issue #11: Simplify roles to admin/operator and add superadmin flag
-- Date: 2025-11-13

-- 1. Update users table to add superadmin flag and simplify roles
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN DEFAULT false;

-- Update role constraint to only allow 'admin' and 'operator'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'operator'));

-- 2. Migrate existing roles to new simplified structure
-- supervisor, fire_inspector, and viewer all become 'admin'
UPDATE users 
SET role = 'admin' 
WHERE role IN ('supervisor', 'fire_inspector', 'viewer', 'admin');

-- Any other roles default to 'operator'
UPDATE users 
SET role = 'operator' 
WHERE role NOT IN ('admin', 'operator');

-- 3. Set rcabral85 as superadmin
UPDATE users 
SET is_superadmin = true, role = 'admin'
WHERE email = 'rcabral85@gmail.com' OR username = 'rcabral85';

-- 4. Add comments for documentation
COMMENT ON COLUMN users.role IS 'User role: admin (full access) or operator (limited to inspections and data entry)';
COMMENT ON COLUMN users.is_superadmin IS 'Superadmin flag grants full system access including user management';

-- 5. Create hydrant_imports table for bulk import tracking
CREATE TABLE IF NOT EXISTS hydrant_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  uploaded_by_user_id UUID REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  total_records INTEGER,
  successful_imports INTEGER DEFAULT 0,
  failed_imports INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_log JSON,
  import_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_hydrant_imports_org ON hydrant_imports(organization_id);
CREATE INDEX idx_hydrant_imports_user ON hydrant_imports(uploaded_by_user_id);
CREATE INDEX idx_hydrant_imports_status ON hydrant_imports(status);

COMMENT ON TABLE hydrant_imports IS 'Tracks bulk hydrant imports from CSV/Excel files';

-- Migration complete
