-- Insert Trident Systems organization
INSERT INTO organizations (id, name, type, contact_email, phone, address, city, province, postal_code, country) 
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Trident Systems', 
  'fire_testing', 
  'info@tridentsys.ca', 
  '905-555-0123', 
  '123 Fire Lane', 
  'Mississauga', 
  'Ontario', 
  'L5B 3C4', 
  'Canada'
) ON CONFLICT (name) DO NOTHING;

-- Insert admin user
INSERT INTO users (
  id, organization_id, username, email, password_hash,
  first_name, last_name, role, phone, is_active
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'admin',
  'admin@tridentsys.ca',
  '$2b$12$ywMF6E/nOYS6yirlkeahtejbltg8QZAXLVtPPSx/P4AQeX2bdrFYy',
  'Rich',
  'Cabral',
  'admin',
  '905-555-0124',
  true
) ON CONFLICT (username) DO NOTHING;

-- Insert operator user
INSERT INTO users (
  id, organization_id, username, email, password_hash,
  first_name, last_name, role, phone, is_active
) VALUES (
  '33333333-3333-3333-3333-333333333333', 
  '11111111-1111-1111-1111-111111111111',
  'operator',
  'operator@tridentsys.ca',
  '$2b$12$ywXiXdVtKBhy8aUfKRShSebIedNrNcbycyT30MqcYEKRirvEl5bte',
  'Test',
  'Operator', 
  'operator',
  '905-555-0125',
  true
) ON CONFLICT (username) DO NOTHING;

-- Insert sample hydrant data
INSERT INTO hydrants (hydrant_number, latitude, longitude, location_address, operational_status) VALUES
('HYD-001', 43.5890, -79.6441, '123 Main St, Mississauga ON', 'OPERATIONAL'),
('HYD-002', 43.5900, -79.6450, '456 Oak Ave, Mississauga ON', 'OPERATIONAL'),
('HYD-003', 43.5880, -79.6430, '789 Elm St, Mississauga ON', 'MAINTENANCE_REQUIRED')
ON CONFLICT (hydrant_number) DO NOTHING;
