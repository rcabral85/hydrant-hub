-- Temporary maintenance schema setup (without PostGIS dependencies)
-- This creates the legacy tables that the backend expects

-- maintenance_inspections table
CREATE TABLE IF NOT EXISTS maintenance_inspections (
    id SERIAL PRIMARY KEY,
    hydrant_id INTEGER NOT NULL REFERENCES hydrants(id) ON DELETE CASCADE,
    inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    inspector_name VARCHAR(100),
    inspector_id INTEGER REFERENCES users(id),
    inspection_type VARCHAR(50),
    overall_condition VARCHAR(20),
    overall_status VARCHAR(20) DEFAULT 'PASS',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- repair_work_orders table
CREATE TABLE IF NOT EXISTS repair_work_orders (
    id SERIAL PRIMARY KEY,
    hydrant_id INTEGER NOT NULL REFERENCES hydrants(id) ON DELETE CASCADE,
    maintenance_inspection_id INTEGER REFERENCES maintenance_inspections(id),
    work_order_number VARCHAR(50) UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    status VARCHAR(20) DEFAULT 'CREATED',
    assigned_to INTEGER REFERENCES users(id),
    target_date DATE,
    actual_completion_date DATE,
    completion_notes TEXT,
    actual_cost DECIMAL(10,2),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_inspections_hydrant_id ON maintenance_inspections(hydrant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_inspections_date ON maintenance_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_repair_work_orders_hydrant_id ON repair_work_orders(hydrant_id);
CREATE INDEX IF NOT EXISTS idx_repair_work_orders_status ON repair_work_orders(status);
