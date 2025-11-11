-- Multi-Tenancy Migration for HydrantHub: Organization Isolation
-- Adds organization_id to all core data tables and links data to organizations

-- 1. Add organization_id to hydrants
do $$
begin
  if not exists (
    select 1 from information_schema.columns where table_name='hydrants' and column_name='organization_id'
  ) then
    ALTER TABLE hydrants ADD COLUMN organization_id UUID REFERENCES organizations(id);
    CREATE INDEX IF NOT EXISTS idx_hydrants_organization_id ON hydrants(organization_id);
  end if;
end $$;

-- 2. Add organization_id to major maintenance/inspection/work order/test tables
do $$
begin
  if not exists (
    select 1 from information_schema.columns where table_name='maintenance_inspections' and column_name='organization_id'
  ) then
    ALTER TABLE maintenance_inspections ADD COLUMN organization_id UUID REFERENCES organizations(id);
    CREATE INDEX IF NOT EXISTS idx_maintenance_inspections_org ON maintenance_inspections(organization_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns where table_name='visual_inspections' and column_name='organization_id'
  ) then
    ALTER TABLE visual_inspections ADD COLUMN organization_id UUID REFERENCES organizations(id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns where table_name='valve_inspections' and column_name='organization_id'
  ) then
    ALTER TABLE valve_inspections ADD COLUMN organization_id UUID REFERENCES organizations(id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns where table_name='repair_work_orders' and column_name='organization_id'
  ) then
    ALTER TABLE repair_work_orders ADD COLUMN organization_id UUID REFERENCES organizations(id);
    CREATE INDEX IF NOT EXISTS idx_repair_work_orders_org ON repair_work_orders(organization_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns where table_name='compliance_schedule' and column_name='organization_id'
  ) then
    ALTER TABLE compliance_schedule ADD COLUMN organization_id UUID REFERENCES organizations(id);
    CREATE INDEX IF NOT EXISTS idx_compliance_schedule_org ON compliance_schedule(organization_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns where table_name='maintenance_history' and column_name='organization_id'
  ) then
    ALTER TABLE maintenance_history ADD COLUMN organization_id UUID REFERENCES organizations(id);
    CREATE INDEX IF NOT EXISTS idx_maintenance_history_org ON maintenance_history(organization_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns where table_name='flow_tests' and column_name='organization_id'
  ) then
    ALTER TABLE flow_tests ADD COLUMN organization_id UUID REFERENCES organizations(id);
    CREATE INDEX IF NOT EXISTS idx_flow_tests_org ON flow_tests(organization_id);
  end if;
end $$;

-- 3. Update all legacy/demo data to use existing org
UPDATE hydrants SET organization_id = (SELECT id FROM organizations WHERE name = 'Trident Systems' LIMIT 1) WHERE organization_id IS NULL;
UPDATE maintenance_inspections SET organization_id = (SELECT id FROM organizations WHERE name = 'Trident Systems' LIMIT 1) WHERE organization_id IS NULL;
UPDATE visual_inspections SET organization_id = (SELECT id FROM organizations WHERE name = 'Trident Systems' LIMIT 1) WHERE organization_id IS NULL;
UPDATE valve_inspections SET organization_id = (SELECT id FROM organizations WHERE name = 'Trident Systems' LIMIT 1) WHERE organization_id IS NULL;
UPDATE repair_work_orders SET organization_id = (SELECT id FROM organizations WHERE name = 'Trident Systems' LIMIT 1) WHERE organization_id IS NULL;
UPDATE compliance_schedule SET organization_id = (SELECT id FROM organizations WHERE name = 'Trident Systems' LIMIT 1) WHERE organization_id IS NULL;
UPDATE maintenance_history SET organization_id = (SELECT id FROM organizations WHERE name = 'Trident Systems' LIMIT 1) WHERE organization_id IS NULL;
UPDATE flow_tests SET organization_id = (SELECT id FROM organizations WHERE name = 'Trident Systems' LIMIT 1) WHERE organization_id IS NULL;

-- 4. Enforce data integrity (set NOT NULL if all data migrated)
-- Example (run after validation):
-- ALTER TABLE hydrants ALTER COLUMN organization_id SET NOT NULL;
-- Repeat for each core table after migration sanity check.

-- 5. Grant SELECT and INSERT rights for maintenance operators per organization as needed.

-- END OF MULTI-TENANCY MIGRATION SCRIPT
