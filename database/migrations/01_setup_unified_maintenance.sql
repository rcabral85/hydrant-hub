-- Migration: Setup Unified Maintenance System
-- Description: Creates the unified 'maintenance' table and sets up triggers to sync data from legacy tables.
-- This ensures backward compatibility with existing backend code while enabling new dashboard features.

BEGIN;

-- 1. Create the unified maintenance table (if not exists)
CREATE TABLE IF NOT EXISTS maintenance (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER, -- Will be populated from hydrants
    hydrant_id INTEGER REFERENCES hydrants(id) ON DELETE CASCADE,
    work_order_number VARCHAR(50),
    maintenance_type VARCHAR(50) NOT NULL CHECK (maintenance_type IN ('inspection', 'repair', 'painting', 'lubrication', 'winterization', 'flow_test', 'other')),
    title VARCHAR(255),
    description TEXT,
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'scheduled',
    assigned_to INTEGER REFERENCES users(id),
    inspector_id INTEGER REFERENCES users(id),
    scheduled_date DATE,
    completed_date DATE,
    inspection_result VARCHAR(50),
    findings TEXT,
    photos JSON,
    parts_used JSON,
    cost DECIMAL(10, 2),
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    legacy_inspection_id INTEGER, -- Reference to legacy maintenance_inspections
    legacy_work_order_id INTEGER  -- Reference to legacy repair_work_orders
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_maintenance_hydrant ON maintenance(hydrant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_type ON maintenance(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_legacy_inspection ON maintenance(legacy_inspection_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_legacy_work_order ON maintenance(legacy_work_order_id);

-- 2. Function to sync maintenance_inspections to maintenance
CREATE OR REPLACE FUNCTION sync_maintenance_inspection()
RETURNS TRIGGER AS $$
DECLARE
    org_id INTEGER;
    hydrant_addr TEXT;
BEGIN
    -- Get organization_id from hydrant
    SELECT organization_id, address INTO org_id, hydrant_addr FROM hydrants WHERE id = NEW.hydrant_id;

    IF (TG_OP = 'DELETE') THEN
        DELETE FROM maintenance WHERE legacy_inspection_id = OLD.id;
        RETURN OLD;
    END IF;

    -- Map status (inspections are usually 'completed' if they exist, or 'scheduled' if future)
    -- Assuming existing inspections are completed
    
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO maintenance (
            organization_id,
            hydrant_id,
            maintenance_type,
            title,
            description,
            status,
            inspector_id,
            completed_date,
            created_by,
            created_at,
            legacy_inspection_id
        ) VALUES (
            org_id,
            NEW.hydrant_id,
            'inspection',
            'Inspection - ' || COALESCE(NEW.inspection_type, 'General'),
            'Legacy inspection record',
            'completed',
            NEW.inspector_id,
            NEW.inspection_date,
            NEW.created_by,
            NEW.created_at,
            NEW.id
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE maintenance SET
            hydrant_id = NEW.hydrant_id,
            title = 'Inspection - ' || COALESCE(NEW.inspection_type, 'General'),
            inspector_id = NEW.inspector_id,
            completed_date = NEW.inspection_date,
            updated_at = CURRENT_TIMESTAMP
        WHERE legacy_inspection_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Function to sync repair_work_orders to maintenance
CREATE OR REPLACE FUNCTION sync_repair_work_order()
RETURNS TRIGGER AS $$
DECLARE
    org_id INTEGER;
BEGIN
    -- Get organization_id from hydrant
    SELECT organization_id INTO org_id FROM hydrants WHERE id = NEW.hydrant_id;

    IF (TG_OP = 'DELETE') THEN
        DELETE FROM maintenance WHERE legacy_work_order_id = OLD.id;
        RETURN OLD;
    END IF;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO maintenance (
            organization_id,
            hydrant_id,
            work_order_number,
            maintenance_type,
            title,
            description,
            priority,
            status,
            assigned_to,
            scheduled_date,
            completed_date,
            notes,
            cost,
            created_by,
            created_at,
            legacy_work_order_id
        ) VALUES (
            org_id,
            NEW.hydrant_id,
            NEW.work_order_number,
            'repair', -- Default to repair, could be refined based on title
            NEW.title,
            NEW.description,
            NEW.priority,
            NEW.status,
            NEW.assigned_to,
            NEW.target_date,
            NEW.actual_completion_date,
            NEW.completion_notes,
            NEW.actual_cost,
            NEW.created_by,
            NEW.created_at,
            NEW.id
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE maintenance SET
            hydrant_id = NEW.hydrant_id,
            work_order_number = NEW.work_order_number,
            title = NEW.title,
            description = NEW.description,
            priority = NEW.priority,
            status = NEW.status,
            assigned_to = NEW.assigned_to,
            scheduled_date = NEW.target_date,
            completed_date = NEW.actual_completion_date,
            notes = NEW.completion_notes,
            cost = NEW.actual_cost,
            updated_at = CURRENT_TIMESTAMP
        WHERE legacy_work_order_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create Triggers (Check if table exists first to avoid errors if running on fresh DB)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'maintenance_inspections') THEN
        DROP TRIGGER IF EXISTS trigger_sync_maintenance_inspection ON maintenance_inspections;
        CREATE TRIGGER trigger_sync_maintenance_inspection
        AFTER INSERT OR UPDATE OR DELETE ON maintenance_inspections
        FOR EACH ROW EXECUTE FUNCTION sync_maintenance_inspection();
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'repair_work_orders') THEN
        DROP TRIGGER IF EXISTS trigger_sync_repair_work_order ON repair_work_orders;
        CREATE TRIGGER trigger_sync_repair_work_order
        AFTER INSERT OR UPDATE OR DELETE ON repair_work_orders
        FOR EACH ROW EXECUTE FUNCTION sync_repair_work_order();
    END IF;
END $$;

-- 5. Initial Data Migration (Idempotent)
-- Migrate Inspections
INSERT INTO maintenance (
    organization_id, hydrant_id, maintenance_type, title, description, status, 
    inspector_id, completed_date, created_by, created_at, legacy_inspection_id
)
SELECT 
    h.organization_id,
    mi.hydrant_id,
    'inspection',
    'Inspection - ' || COALESCE(mi.inspection_type, 'General'),
    'Legacy inspection record',
    'completed',
    mi.inspector_id,
    mi.inspection_date,
    mi.created_by,
    mi.created_at,
    mi.id
FROM maintenance_inspections mi
JOIN hydrants h ON mi.hydrant_id = h.id
WHERE NOT EXISTS (SELECT 1 FROM maintenance WHERE legacy_inspection_id = mi.id);

-- Migrate Work Orders
INSERT INTO maintenance (
    organization_id, hydrant_id, work_order_number, maintenance_type, title, description, 
    priority, status, assigned_to, scheduled_date, completed_date, notes, cost, 
    created_by, created_at, legacy_work_order_id
)
SELECT 
    h.organization_id,
    rwo.hydrant_id,
    rwo.work_order_number,
    'repair',
    rwo.title,
    rwo.description,
    rwo.priority,
    rwo.status,
    rwo.assigned_to,
    rwo.target_date,
    rwo.actual_completion_date,
    rwo.completion_notes,
    rwo.actual_cost,
    rwo.created_by,
    rwo.created_at,
    rwo.id
FROM repair_work_orders rwo
JOIN hydrants h ON rwo.hydrant_id = h.id
WHERE NOT EXISTS (SELECT 1 FROM maintenance WHERE legacy_work_order_id = rwo.id);

COMMIT;
