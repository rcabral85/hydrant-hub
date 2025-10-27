-- Flow tests table
CREATE TABLE IF NOT EXISTS public."flow_tests" (
  id SERIAL PRIMARY KEY,
  hydrant_id INTEGER NOT NULL REFERENCES public."hydrants"(id) ON DELETE CASCADE,
  static_psi NUMERIC NOT NULL,
  residual_psi NUMERIC NOT NULL,
  total_flow_gpm NUMERIC NOT NULL,
  calc_at_20psi_gpm NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
