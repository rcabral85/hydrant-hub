# Database schema for HydrantHub (MVP)

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Organizations (tenancy)
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator', -- operator | supervisor | fire | admin
  created_at TIMESTAMP DEFAULT NOW()
);

-- Hydrants
CREATE TABLE IF NOT EXISTS hydrants (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id TEXT,
  location GEOGRAPHY(POINT, 4326),
  street TEXT,
  city TEXT,
  status TEXT DEFAULT 'active',
  outlet_diameter_in NUMERIC(4,2) DEFAULT 2.50,
  outlet_coefficient NUMERIC(4,2) DEFAULT 0.90,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Flow tests
CREATE TABLE IF NOT EXISTS flow_tests (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  hydrant_id INTEGER REFERENCES hydrants(id) ON DELETE CASCADE,
  static_psi NUMERIC(6,2) NOT NULL,
  residual_psi NUMERIC(6,2) NOT NULL,
  pitot_psi NUMERIC(6,2) NOT NULL,
  total_flow_gpm NUMERIC(8,2),
  flow_at_20psi_gpm NUMERIC(8,2),
  nfpa_class TEXT, -- AA, A, B, C
  tested_at TIMESTAMP DEFAULT NOW(),
  tester_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT
);

-- Simple function to compute NFPA class (stored as helper for reporting)
CREATE OR REPLACE FUNCTION nfpa_class_from_gpm(gpm NUMERIC)
RETURNS TEXT AS $$
BEGIN
  IF gpm >= 1500 THEN RETURN 'AA';
  ELSIF gpm >= 1000 THEN RETURN 'A';
  ELSIF gpm >= 500 THEN RETURN 'B';
  ELSE RETURN 'C';
  END IF;
END; $$ LANGUAGE plpgsql;
