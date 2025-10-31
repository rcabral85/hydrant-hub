-- HydrantHub Sample Hydrant Data for Demonstration
-- Town of Milton, ON - Example Municipal Hydrant Dataset
-- Created: October 31, 2025

-- Use hydrant_management database
\c hydrant_management;

-- Insert sample users first (for audit trail)
INSERT INTO users (id, username, email, first_name, last_name, role, department, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'rcabral', 'rcabral85@gmail.com', 'Rich', 'Cabral', 'WATER_OPERATOR', 'Water Distribution', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'jsmith', 'j.smith@milton.ca', 'John', 'Smith', 'SUPERVISOR', 'Public Works', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'mmaint', 'maintenance@milton.ca', 'Maintenance', 'Team', 'TECHNICIAN', 'Water Operations', NOW())
ON CONFLICT (id) DO NOTHING;

-- Sample hydrant data for Milton, ON area
INSERT INTO hydrants (
    id, hydrant_number, manufacturer, model, installation_date, 
    latitude, longitude, location_address, location_description,
    watermain_size_mm, static_pressure_psi, flow_rate_gpm, 
    nfpa_classification, operational_status, last_inspection_date,
    inspector_notes, created_by, updated_by, created_at, updated_at
) VALUES

-- Milton Fire Station #1 Area
('HYD-MLT-2025-001', 'MLT-001', 'Mueller', 'Super Centurion', '2018-05-15', 
 43.5182, -79.8774, '555 Main Street East, Milton, ON', 'Fire Station #1 - Front entrance',
 200, 74.2, 2347, 'AA', 'OPERATIONAL', '2025-09-15',
 'Excellent condition, recent flow test shows excellent performance', 
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

-- Milton Mall Area
('HYD-MLT-2025-002', 'MLT-002', 'American Flow Control', 'Series 2500', '2019-08-22', 
 43.5195, -79.8892, '55 Ontario Street South, Milton, ON', 'Milton Mall - Northwest parking lot',
 300, 68.7, 1753, 'AA', 'OPERATIONAL', '2025-08-22',
 'Good condition, minor paint touch-up needed', 
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

-- Industrial Boulevard
('HYD-MLT-2025-003', 'MLT-003', 'Waterous', 'Pacer', '2020-03-10', 
 43.5156, -79.8654, '1234 Industrial Boulevard, Milton, ON', 'Industrial Park - Main entrance',
 250, 72.3, 1442, 'A', 'OPERATIONAL', '2025-07-18',
 'Fair condition, valve operation slightly stiff, schedule maintenance', 
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

-- Highway 25 & Steeles Avenue
('HYD-MLT-2025-004', 'MLT-004', 'Mueller', 'Super Centurion', '2017-11-30', 
 43.5234, -79.8445, '2345 Steeles Avenue West, Milton, ON', 'Highway 25 & Steeles intersection - SW corner',
 300, 75.4, 2115, 'AA', 'OPERATIONAL', '2025-06-12',
 'Excellent condition, new installation performing well', 
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

-- Milton GO Station
('HYD-MLT-2025-005', 'MLT-005', 'American Flow Control', 'Series 2500', '2021-04-18', 
 43.5167, -79.8892, '13090 Trafalgar Road, Milton, ON', 'Milton GO Station - Kiss & Ride lot',
 200, 71.8, 1588, 'A', 'OPERATIONAL', '2025-05-28',
 'Good condition, recent installation, all components secure', 
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

-- Residential Area - Maple Avenue
('HYD-MLT-2025-006', 'MLT-006', 'Waterous', 'Pacer', '2016-09-12', 
 43.5201, -79.8567, '1456 Maple Avenue, Milton, ON', 'Residential area - Near elementary school',
 150, 69.2, 945, 'B', 'OPERATIONAL', '2025-04-15',
 'Fair condition, paint fading, chain replacement needed', 
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

-- Commercial Plaza
('HYD-MLT-2025-007', 'MLT-007', 'Mueller', 'Super Centurion', '2019-12-08', 
 43.5178, -79.8723, '789 Commercial Street, Milton, ON', 'Commercial Plaza - Main parking area',
 250, 73.1, 1694, 'A', 'OPERATIONAL', '2025-03-22',
 'Good condition, minor valve adjustment required', 
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

-- Hospital Area
('HYD-MLT-2025-008', 'MLT-008', 'American Flow Control', 'Series 2500', '2022-01-25', 
 43.5089, -79.8856, '725 Main Street West, Milton, ON', 'Milton District Hospital - Emergency entrance',
 300, 76.8, 2234, 'AA', 'OPERATIONAL', '2025-09-30',
 'Excellent condition, new installation, all systems optimal', 
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

-- School Zone - High School
('HYD-MLT-2025-009', 'MLT-009', 'Waterous', 'Pacer', '2018-07-14', 
 43.5123, -79.8634, '555 Education Court, Milton, ON', 'Milton District High School - Front courtyard',
 200, 70.5, 1367, 'A', 'OPERATIONAL', '2025-08-15',
 'Good condition, regular maintenance up to date', 
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

-- Downtown Core
('HYD-MLT-2025-010', 'MLT-010', 'Mueller', 'Super Centurion', '2020-10-05', 
 43.5214, -79.8776, '123 Main Street, Milton, ON', 'Downtown Milton - Heritage district',
 200, 72.9, 1523, 'A', 'OPERATIONAL', '2025-07-30',
 'Good condition, heritage area installation, aesthetic considerations', 
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

-- Problem hydrants for demonstration
('HYD-MLT-2025-011', 'MLT-011', 'Waterous', 'Pacer', '2015-06-20', 
 43.5145, -79.8567, '2468 Old Mill Road, Milton, ON', 'Older residential area - Needs attention',
 150, 45.2, 678, 'C', 'MAINTENANCE_REQUIRED', '2025-02-28',
 'Poor condition: valve binding, paint severely faded, cap chain missing', 
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

-- Out of service hydrant
('HYD-MLT-2025-012', 'MLT-012', 'American Flow Control', 'Series 2500', '2017-03-15', 
 43.5267, -79.8445, '3579 Construction Zone Street, Milton, ON', 'Construction area - Temporarily out of service',
 250, 0.0, 0, 'OUT_OF_SERVICE', 'OUT_OF_SERVICE', '2025-01-15',
 'Out of service due to watermain replacement project, expected return Nov 2025', 
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

-- Recently installed
('HYD-MLT-2025-013', 'MLT-013', 'Mueller', 'Super Centurion', '2025-08-30', 
 43.5198, -79.8723, '4680 New Development Drive, Milton, ON', 'New subdivision - Hawthorne Village',
 200, 74.8, 1890, 'AA', 'OPERATIONAL', '2025-10-15',
 'New installation, initial flow test excellent, all components new', 
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

-- Rural area hydrant
('HYD-MLT-2025-014', 'MLT-014', 'Waterous', 'Pacer', '2019-05-22', 
 43.4978, -79.8934, '5791 Rural Route 25, Milton, ON', 'Rural area - Agricultural zone',
 150, 52.3, 823, 'B', 'OPERATIONAL', '2025-06-20',
 'Fair condition, rural location, seasonal access challenges', 
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

-- Recreation Center
('HYD-MLT-2025-015', 'MLT-015', 'American Flow Control', 'Series 2500', '2021-11-12', 
 43.5145, -79.8812, '1234 Recreation Drive, Milton, ON', 'Milton Sports Center - Main entrance',
 250, 75.1, 1876, 'AA', 'OPERATIONAL', '2025-09-08',
 'Excellent condition, high-traffic area, well maintained', 
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW());

-- Sample Flow Test Data
INSERT INTO flow_tests (
    id, hydrant_id, test_date, operator_name, operator_license,
    static_pressure_psi, residual_pressure_psi, pitot_pressure_psi,
    flow_rate_gpm, coefficient, nfpa_classification, available_flow_20psi,
    temperature_celsius, weather_conditions, test_notes,
    created_by, updated_by, created_at, updated_at
) VALUES

-- Recent flow tests for demonstration
('TRI-2025-001', 'HYD-MLT-2025-001', '2025-09-15 10:15:00', 'Rich Cabral', 'WDO-ON-2019-1234',
 74.2, 52.8, 31.5, 2347, 0.90, 'AA', 2347, 18.5, 'Clear, calm conditions',
 'Excellent flow test results, hydrant performing optimally',
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

('TRI-2025-002', 'HYD-MLT-2025-002', '2025-08-22 14:30:00', 'Rich Cabral', 'WDO-ON-2019-1234',
 68.7, 48.2, 27.8, 1753, 0.88, 'AA', 1753, 22.1, 'Sunny, light breeze',
 'Good flow test, minor paint maintenance recommended',
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

('TRI-2025-003', 'HYD-MLT-2025-003', '2025-07-18 09:45:00', 'Rich Cabral', 'WDO-ON-2019-1234',
 72.3, 51.6, 24.2, 1442, 0.85, 'A', 1442, 25.8, 'Hot, humid conditions',
 'Adequate flow, valve operation needs attention',
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

('TRI-2025-004', 'HYD-MLT-2025-008', '2025-09-30 11:20:00', 'Rich Cabral', 'WDO-ON-2019-1234',
 76.8, 54.1, 32.8, 2234, 0.92, 'AA', 2234, 16.2, 'Cool, overcast',
 'Excellent new installation performance',
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

('TRI-2025-005', 'HYD-MLT-2025-011', '2025-02-28 13:15:00', 'Rich Cabral', 'WDO-ON-2019-1234',
 45.2, 32.1, 18.4, 678, 0.75, 'C', 678, 2.5, 'Cold, icy conditions',
 'Poor performance, multiple issues identified, maintenance required',
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW());

-- Sample Maintenance Inspections
INSERT INTO maintenance_inspections (
    id, hydrant_id, inspection_type_id, inspector_name, inspector_license,
    inspection_date, overall_status, overall_notes, compliance_status,
    photos, created_by, updated_by, created_at, updated_at
) VALUES

('INSP-2025-001', 'HYD-MLT-2025-001', 1, 'Rich Cabral', 'WDO-ON-2019-1234',
 '2025-09-15 10:30:00', 'PASS', 'Excellent condition, all components functioning properly', 'COMPLIANT',
 '["maintenance-001-before.jpg", "maintenance-001-valve.jpg"]',
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

('INSP-2025-002', 'HYD-MLT-2025-011', 1, 'Rich Cabral', 'WDO-ON-2019-1234',
 '2025-02-28 14:00:00', 'FAIL', 'Multiple issues identified requiring immediate attention', 'NON_COMPLIANT',
 '["maintenance-011-paint.jpg", "maintenance-011-valve.jpg", "maintenance-011-chain.jpg"]',
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),

('INSP-2025-003', 'HYD-MLT-2025-006', 1, 'Rich Cabral', 'WDO-ON-2019-1234',
 '2025-04-15 09:15:00', 'CONDITIONAL', 'Generally good condition with minor maintenance needs', 'CONDITIONAL',
 '["maintenance-006-paint.jpg", "maintenance-006-general.jpg"]',
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW());

-- Sample Visual Inspections
INSERT INTO visual_inspections (
    id, maintenance_inspection_id, paint_condition, paint_notes,
    body_condition, body_damage_notes, cap_condition, cap_security,
    chains_present, chains_condition, clearance_adequate, clearance_distance_feet,
    visible_from_road, reflective_markers_present, signage_adequate,
    ground_condition, drainage_adequate, safety_hazards, immediate_action_required
) VALUES

(uuid_generate_v4(), 'INSP-2025-001', 'EXCELLENT', 'Fresh paint, no rust or fading',
 'EXCELLENT', 'No damage, structural integrity perfect', 'EXCELLENT', 'SECURE',
 true, 'EXCELLENT', true, 4.5, true, true, true,
 'STABLE', true, '', false),

(uuid_generate_v4(), 'INSP-2025-002', 'POOR', 'Severe fading, rust spots visible, needs immediate repainting',
 'FAIR', 'Minor surface corrosion, no structural issues', 'POOR', 'LOOSE',
 false, 'MISSING', true, 3.2, true, false, true,
 'STABLE', true, 'Missing chain creates security risk, paint condition affects visibility', true),

(uuid_generate_v4(), 'INSP-2025-003', 'FAIR', 'Some fading, minor rust spots, schedule repainting within 6 months',
 'GOOD', 'Good structural condition, minor surface wear', 'GOOD', 'SECURE',
 true, 'FAIR', true, 3.8, true, true, true,
 'STABLE', true, '', false);

-- Sample Valve Inspections
INSERT INTO valve_inspections (
    id, maintenance_inspection_id, main_valve_operation, main_valve_turns_to_close,
    main_valve_turns_to_open, main_valve_leak_detected, operating_nut_condition,
    static_pressure_psi, valve_exercised, valve_exercise_successful,
    lubrication_applied, repair_recommendations, priority_level
) VALUES

(uuid_generate_v4(), 'INSP-2025-001', 'SMOOTH', 12, 12, false, 'EXCELLENT',
 74.2, true, true, true, '', 'LOW'),

(uuid_generate_v4(), 'INSP-2025-002', 'BINDING', 18, 19, true, 'WORN',
 45.2, false, null, false, 'Valve rebuild required, operating nut replacement, leak repair', 'CRITICAL'),

(uuid_generate_v4(), 'INSP-2025-003', 'STIFF', 14, 14, false, 'GOOD',
 69.2, true, true, true, 'Lubrication helped, monitor operation', 'LOW');

-- Sample Work Orders
INSERT INTO repair_work_orders (
    id, hydrant_id, maintenance_inspection_id, work_order_number, title,
    description, priority, category, created_date, target_completion_date,
    status, estimated_cost, assigned_to, department, created_by, updated_by
) VALUES

(uuid_generate_v4(), 'HYD-MLT-2025-011', 'INSP-2025-002', 'WO-2025-001',
 'Critical Maintenance - MLT-011 Multiple Issues',
 'Comprehensive maintenance required: valve rebuild, paint restoration, chain replacement, operating nut replacement. Safety priority due to binding valve and missing security chain.',
 'CRITICAL', 'SAFETY_HAZARD', '2025-02-28 15:00:00', '2025-03-15 17:00:00',
 'SCHEDULED', 850.00, 'Maintenance Team', 'Water Operations',
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001'),

(uuid_generate_v4(), 'HYD-MLT-2025-006', 'INSP-2025-003', 'WO-2025-002',
 'Paint Maintenance - MLT-006 Fading Paint',
 'Repaint hydrant body and caps with high-visibility yellow paint. Surface preparation and primer application required due to minor rust spots.',
 'MEDIUM', 'PAINT_MAINTENANCE', '2025-04-15 10:30:00', '2025-07-15 17:00:00',
 'IN_PROGRESS', 275.00, 'Rich Cabral', 'Water Operations',
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001'),

(uuid_generate_v4(), 'HYD-MLT-2025-003', null, 'WO-2025-003',
 'Valve Lubrication - MLT-003 Stiff Operation',
 'Apply marine-grade lubricant to valve mechanism. Test operation and document improvement. Schedule follow-up inspection in 6 months.',
 'LOW', 'VALVE_REPAIR', '2025-07-20 08:00:00', '2025-08-20 17:00:00',
 'COMPLETED', 125.00, 'Rich Cabral', 'Water Operations',
 '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001');

-- Sample Compliance Schedule
INSERT INTO compliance_schedule (
    id, hydrant_id, inspection_type_id, due_date, status,
    notification_sent, auto_reschedule_enabled
) VALUES

-- Upcoming inspections
(uuid_generate_v4(), 'HYD-MLT-2025-004', 1, '2025-11-15', 'SCHEDULED', false, true),
(uuid_generate_v4(), 'HYD-MLT-2025-005', 1, '2025-11-28', 'SCHEDULED', false, true),
(uuid_generate_v4(), 'HYD-MLT-2025-007', 1, '2025-12-22', 'SCHEDULED', false, true),
(uuid_generate_v4(), 'HYD-MLT-2025-009', 1, '2025-12-15', 'SCHEDULED', false, true),
(uuid_generate_v4(), 'HYD-MLT-2025-010', 1, '2025-12-30', 'SCHEDULED', false, true),

-- Flow tests due
(uuid_generate_v4(), 'HYD-MLT-2025-013', 2, '2025-11-30', 'SCHEDULED', false, true),
(uuid_generate_v4(), 'HYD-MLT-2025-014', 2, '2025-12-20', 'SCHEDULED', false, true),
(uuid_generate_v4(), 'HYD-MLT-2025-015', 2, '2026-01-08', 'SCHEDULED', false, true),

-- Overdue items for demonstration
(uuid_generate_v4(), 'HYD-MLT-2025-012', 1, '2025-01-15', 'OVERDUE', true, false),
(uuid_generate_v4(), 'HYD-MLT-2025-014', 1, '2025-10-20', 'OVERDUE', true, true);

-- Sample Maintenance History
INSERT INTO maintenance_history (
    id, hydrant_id, action_type, action_description, action_date,
    performed_by, license_number, labor_hours, cost, work_completed,
    success_status, notes, created_by
) VALUES

(uuid_generate_v4(), 'HYD-MLT-2025-001', 'INSPECTION', 'Annual inspection completed', '2025-09-15 10:30:00',
 'Rich Cabral', 'WDO-ON-2019-1234', 0.5, 25.00, true, 'SUCCESS', 'Excellent condition found',
 '550e8400-e29b-41d4-a716-446655440001'),

(uuid_generate_v4(), 'HYD-MLT-2025-001', 'FLOW_TEST', 'NFPA 291 flow test completed', '2025-09-15 10:15:00',
 'Rich Cabral', 'WDO-ON-2019-1234', 0.75, 37.50, true, 'SUCCESS', '2347 GPM - Class AA performance',
 '550e8400-e29b-41d4-a716-446655440001'),

(uuid_generate_v4(), 'HYD-MLT-2025-003', 'VALVE_EXERCISE', 'Quarterly valve exercise and lubrication', '2025-08-20 14:00:00',
 'Rich Cabral', 'WDO-ON-2019-1234', 0.25, 37.50, true, 'SUCCESS', 'Operation improved after lubrication',
 '550e8400-e29b-41d4-a716-446655440001'),

(uuid_generate_v4(), 'HYD-MLT-2025-013', 'INSTALLATION', 'New hydrant installation and commissioning', '2025-08-30 09:00:00',
 'Installation Crew', '', 4.0, 3200.00, true, 'SUCCESS', 'New subdivision hydrant installed per specifications',
 '550e8400-e29b-41d4-a716-446655440002'),

(uuid_generate_v4(), 'HYD-MLT-2025-011', 'EMERGENCY_REPAIR', 'Emergency valve repair attempt', '2025-03-05 11:30:00',
 'Emergency Crew', '', 2.0, 125.00, false, 'PARTIAL', 'Temporary repair only, full rebuild still required',
 '550e8400-e29b-41d4-a716-446655440003');

-- Update statistics for dashboard
UPDATE hydrants SET 
    last_flow_test_date = (
        SELECT MAX(test_date) 
        FROM flow_tests 
        WHERE flow_tests.hydrant_id = hydrants.id
    ),
    last_inspection_date = (
        SELECT MAX(inspection_date) 
        FROM maintenance_inspections 
        WHERE maintenance_inspections.hydrant_id = hydrants.id
    );

-- Create some inspection results for checklist demonstration
INSERT INTO inspection_results (
    id, maintenance_inspection_id, checklist_item_id, result, notes, measured_value, measured_unit
) VALUES
-- Results for INSP-2025-001 (excellent hydrant)
(uuid_generate_v4(), 'INSP-2025-001', 1, 'PASS', 'Body in excellent condition, no damage', null, null),
(uuid_generate_v4(), 'INSP-2025-001', 2, 'PASS', 'Fresh paint, excellent visibility', null, null),
(uuid_generate_v4(), 'INSP-2025-001', 3, 'PASS', 'All caps present and secure', null, null),
(uuid_generate_v4(), 'INSP-2025-001', 4, 'PASS', 'Chains present and in good condition', null, null),
(uuid_generate_v4(), 'INSP-2025-001', 5, 'PASS', 'Valve operates smoothly', 12, 'TURNS'),
(uuid_generate_v4(), 'INSP-2025-001', 6, 'PASS', 'Static pressure within normal range', 74.2, 'PSI'),

-- Results for INSP-2025-002 (problem hydrant)
(uuid_generate_v4(), 'INSP-2025-002', 1, 'CONDITIONAL', 'Minor surface corrosion, structurally sound', null, null),
(uuid_generate_v4(), 'INSP-2025-002', 2, 'FAIL', 'Severe paint fading, visibility compromised', null, null),
(uuid_generate_v4(), 'INSP-2025-002', 3, 'CONDITIONAL', 'Caps present but condition poor', null, null),
(uuid_generate_v4(), 'INSP-2025-002', 4, 'FAIL', 'Chain missing, security compromised', null, null),
(uuid_generate_v4(), 'INSP-2025-002', 5, 'FAIL', 'Valve binding, difficult to operate', 18, 'TURNS'),
(uuid_generate_v4(), 'INSP-2025-002', 6, 'FAIL', 'Low static pressure indicates system issue', 45.2, 'PSI');

-- Create some sample notifications/alerts
-- These would typically be generated by application logic
COMMENT ON TABLE hydrants IS 'Sample hydrant data created for Milton, ON demonstration - 15 hydrants with varied conditions';
COMMENT ON TABLE flow_tests IS 'Sample flow test data showing NFPA 291 compliant testing results';
COMMENT ON TABLE maintenance_inspections IS 'Sample maintenance inspections with pass/fail/conditional results';
COMMENT ON TABLE repair_work_orders IS 'Sample work orders showing various maintenance priorities and categories';

-- Summary of sample data created:
SELECT 
    'Hydrants Created' as item, 
    COUNT(*) as count 
FROM hydrants
UNION ALL
SELECT 
    'Flow Tests Created' as item, 
    COUNT(*) as count 
FROM flow_tests
UNION ALL
SELECT 
    'Maintenance Inspections' as item, 
    COUNT(*) as count 
FROM maintenance_inspections
UNION ALL
SELECT 
    'Work Orders Created' as item, 
    COUNT(*) as count 
FROM repair_work_orders
UNION ALL
SELECT 
    'Compliance Items Scheduled' as item, 
    COUNT(*) as count 
FROM compliance_schedule;

-- Display hydrant status summary
SELECT 
    operational_status,
    nfpa_classification,
    COUNT(*) as hydrant_count,
    ROUND(AVG(static_pressure_psi), 1) as avg_pressure,
    ROUND(AVG(flow_rate_gpm), 0) as avg_flow
FROM hydrants 
GROUP BY operational_status, nfpa_classification
ORDER BY operational_status, nfpa_classification;

PRINT 'Sample hydrant data successfully created for demonstration purposes!';
PRINT 'Data includes: 15 hydrants, 5 flow tests, 3 inspections, 3 work orders';
PRINT 'Located in Milton, ON with realistic municipal data for testing';
PRINT 'Includes examples of excellent, good, fair, and poor condition hydrants';