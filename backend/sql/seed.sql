# Sample seed data for demo

INSERT INTO organizations (name) VALUES ('Trident Systems');

-- demo user: demo@tridentsys.ca / Demo123!
INSERT INTO users (org_id, email, password_hash, role)
VALUES (
  1,
  'demo@tridentsys.ca',
  '$2b$10$Qm9ndXNJbmZlcmVkSGFzaEJ5Q3RydUlTZWQwMDAwMDAwMDAwMDAu', -- placeholder, replace on first run
  'admin'
);

-- demo hydrants (Milton area coords approx)
INSERT INTO hydrants (org_id, asset_id, location, street, city, status, outlet_diameter_in, outlet_coefficient)
VALUES
(1, 'HYD-1001', ST_GeogFromText('POINT(-79.877 43.518)'), 'Main St E', 'Milton', 'active', 2.50, 0.90),
(1, 'HYD-1002', ST_GeogFromText('POINT(-79.882 43.511)'), 'Thompson Rd', 'Milton', 'active', 2.50, 0.90);

-- demo flow tests
INSERT INTO flow_tests (org_id, hydrant_id, static_psi, residual_psi, pitot_psi, total_flow_gpm, flow_at_20psi_gpm, nfpa_class, tester_id, notes)
VALUES
(1, 1, 72.3, 48.6, 27.0, 1550, 1210, nfpa_class_from_gpm(1210), 1, 'Baseline test'),
(1, 2, 68.7, 45.1, 24.5, 1380, 1005, nfpa_class_from_gpm(1005), 1, 'Secondary test');
