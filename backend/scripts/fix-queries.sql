-- Fix for hydrants.js query issues (line 120 area)
-- The issue is alias usage in subqueries - they need to be consistent

-- This file documents the query fixes needed in the route files:
-- File: backend/routes/hydrants.js around line 120
-- Change FROM: ft.test_date 
-- Change TO: test_date (no alias needed in subquery)

-- File: backend/routes/flow-tests.js around line 196  
-- Change FROM: ft.tested_by_user_id
-- Change TO: tested_by_user_id (no alias needed in subquery)

-- The actual fixes need to be applied to the JavaScript route files, not SQL.
-- This file serves as documentation of the required changes.

-- Test query to verify flow_tests table structure:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'flow_tests' 
ORDER BY ordinal_position;

-- Test query to verify hydrants table structure:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'hydrants' 
ORDER BY ordinal_position;