-- ============================================================
--  database/seed.sql
--  Seed demo agents and LGA reference data
--  Run AFTER schema.sql: psql -d ekiti_election -f database/seed.sql
-- ============================================================

-- Demo agents (PINs are bcrypt hashes — original PINs in .env.example)
INSERT INTO agents (id, name, party, lga, town, unit_code, ward, pin_hash) VALUES
  ('EK-APC-AD-0001', 'Taiwo Adeyemi',    'APC',  'Ado Ekiti',  'Ado Central',  'EKS/AD/0001', 'Adebayo',      '$2b$12$demo_hash_replace_in_prod'),
  ('EK-PDP-EE-0002', 'Funmi Olaoluwa',   'PDP',  'Ekiti East', 'Ikere Town',   'EKS/EE/0072', 'Ikere Ward 1', '$2b$12$demo_hash_replace_in_prod'),
  ('EK-LP-IK-0003',  'Kehinde Adesanya', 'LP',   'Ikere',      'Ikere Central','EKS/IK/0387', 'Ikere Ward 2', '$2b$12$demo_hash_replace_in_prod'),
  ('EK-NNPP-IJ-0004','Bola Ogunleye',    'NNPP', 'Ijero',      'Ijero-Ekiti',  'EKS/IJ/0511', 'Ijero Ward 1', '$2b$12$demo_hash_replace_in_prod')
ON CONFLICT (id) DO NOTHING;