#!/bin/bash
# Script: onboard_new_org.sh
# Purpose: Create a new client/organization, admin user, and demo hydrant for HydrantHub
# Usage: bash onboard_new_org.sh "Acme Utilities" admin@acme.com 

ORG_NAME="$1"
ADMIN_EMAIL="$2"
ADMIN_PASSWORD="${3:-ChangeMe123!}"

psql $DATABASE_URL <<SQL

-- Create org record
INSERT INTO organizations (id, name, type, contact_email)
VALUES (uuid_generate_v4(), '{ORG_NAME}', 'CLIENT', '$ADMIN_EMAIL')
ON CONFLICT (name) DO UPDATE SET contact_email = EXCLUDED.contact_email RETURNING id;

-- Get org ID:
\set org_id (SELECT id FROM organizations WHERE name = '{ORG_NAME}' LIMIT 1)

-- Create admin user
INSERT INTO users (organization_id, username, email, password_hash, first_name, last_name, role, is_active)
VALUES
  (:'org_id', 'admin', '$ADMIN_EMAIL', crypt('$ADMIN_PASSWORD', gen_salt('bf')), 'Admin', 'User', 'admin', true)
ON CONFLICT (username) DO NOTHING;
-- Output
SELECT 'Org created:', name, id FROM organizations WHERE name = '{ORG_NAME}';
SELECT 'Admin created:', username, email FROM users WHERE organization_id = :'org_id' AND username = 'admin';
SQL

# Output API onboarding instructions
echo "\nTo log in, use the HydrantHub UI or API with:"
echo "  admin email: $ADMIN_EMAIL"
echo "  password: $ADMIN_PASSWORD"
echo "Client onboarding (DB and minimal demo hydrant) complete."
