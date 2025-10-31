-- IMMEDIATE FIX: Create maintenance_inspections table to resolve login error
-- Run this first to get the app working, then run the full schema later

-- Quick fix: Create minimal maintenance_inspections table
CREATE TABLE IF NOT EXISTS maintenance_inspections (
    id SERIAL PRIMARY KEY,
    hydrant_id INTEGER NOT NULL,
    inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    inspector_name VARCHAR(100) NOT NULL DEFAULT 'Rich Cabral',
    overall_status VARCHAR(20) DEFAULT 'PASS',
    overall_condition VARCHAR(20) DEFAULT 'GOOD',
    inspector_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add sample maintenance inspection data to make the dashboard work
INSERT INTO maintenance_inspections (hydrant_id, inspection_date, inspector_name, overall_status, overall_condition, inspector_notes)
SELECT 
    id,
    CURRENT_DATE - (RANDOM() * 30)::INT,
    'Rich Cabral',
    CASE 
        WHEN RANDOM() < 0.8 THEN 'PASS'
        WHEN RANDOM() < 0.95 THEN 'CONDITIONAL' 
        ELSE 'FAIL'
    END,
    CASE 
        WHEN RANDOM() < 0.4 THEN 'EXCELLENT'
        WHEN RANDOM() < 0.7 THEN 'GOOD'
        WHEN RANDOM() < 0.9 THEN 'FAIR'
        ELSE 'POOR'
    END,
    'Sample inspection data for demonstration'
FROM hydrants 
WHERE id <= 10  -- Only for first 10 hydrants to avoid overwhelming
AND NOT EXISTS (SELECT 1 FROM maintenance_inspections WHERE hydrant_id = hydrants.id);

-- Add work_orders table for work order management
CREATE TABLE IF NOT EXISTS work_orders (
    id SERIAL PRIMARY KEY,
    work_order_number VARCHAR(50) UNIQUE NOT NULL,
    hydrant_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    status VARCHAR(20) DEFAULT 'CREATED',
    target_completion_date DATE,
    estimated_cost DECIMAL(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add sample work orders
INSERT INTO work_orders (work_order_number, hydrant_id, title, priority, status, target_completion_date, estimated_cost)
SELECT 
    'WO-2025-' || LPAD(ROW_NUMBER() OVER (ORDER BY id)::TEXT, 3, '0'),
    id,
    CASE 
        WHEN RANDOM() < 0.3 THEN 'Valve Maintenance Required'
        WHEN RANDOM() < 0.6 THEN 'Paint Touch-up Needed'
        WHEN RANDOM() < 0.8 THEN 'Cap Replacement'
        ELSE 'General Maintenance'
    END,
    CASE 
        WHEN RANDOM() < 0.1 THEN 'CRITICAL'
        WHEN RANDOM() < 0.3 THEN 'HIGH'
        WHEN RANDOM() < 0.7 THEN 'MEDIUM'
        ELSE 'LOW'
    END,
    CASE 
        WHEN RANDOM() < 0.4 THEN 'IN_PROGRESS'
        WHEN RANDOM() < 0.7 THEN 'SCHEDULED'
        ELSE 'CREATED'
    END,
    CURRENT_DATE + (RANDOM() * 60)::INT,
    50 + (RANDOM() * 400)::INT
FROM hydrants 
WHERE id <= 5  -- Create work orders for first 5 hydrants only
AND NOT EXISTS (SELECT 1 FROM work_orders WHERE hydrant_id = hydrants.id);