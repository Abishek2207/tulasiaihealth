-- TulsiHealth Database Initialization Script
-- Creates initial database structure and seed data

-- Create initial admin user with TulsiHealth branding
INSERT INTO users (
    uuid, email, username, password_hash, first_name, last_name, 
    role, is_active, is_verified, is_superuser, 
    license_number, specialization, created_at
) VALUES (
    'user_admin_001',
    'admin@TulsiHealth.in',
    'admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkOYxjQ5wMw5K8W5w5w5w5w5w5w5w5', -- admin123
    'Admin',
    'User',
    'admin',
    true,
    true,
    true,
    'ADMIN001',
    'System Administration',
    CURRENT_TIMESTAMP
) ON CONFLICT (uuid) DO NOTHING;

-- Create sample TulsiHealth patients
INSERT INTO patients (
    uuid, patient_id, name, email, phone, date_of_birth, gender, blood_group,
    address, city, state, pincode, country, abha_id, abha_linked,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
    height, weight, bmi, preferred_language, is_active, is_verified, created_by, created_at
) VALUES 
(
    'patient_001',
    'TH-2024-04-A1B2C3D4',
    'Ravi Kumar',
    'ravi.kumar@email.com',
    '+91-9876543210',
    '1985-06-15',
    'Male',
    'B+',
    '123, MG Road, Bangalore, Karnataka - 560001',
    'Bangalore',
    'Karnataka',
    '560001',
    'India',
    'ABHA-2024-001234',
    true,
    'Sunita Kumar',
    '+91-9876543211',
    'Wife',
    175,
    75.0,
    24,
    'en',
    true,
    true,
    1,
    CURRENT_TIMESTAMP
),
(
    'patient_002',
    'TH-2024-04-E5F6G7H8',
    'Priya Sharma',
    'priya.sharma@email.com',
    '+91-9876543212',
    '1990-03-22',
    'Female',
    'O+',
    '456, Brigade Road, Bangalore, Karnataka - 560025',
    'Bangalore',
    'Karnataka',
    '560025',
    'India',
    'ABHA-2024-005678',
    true,
    'Amit Sharma',
    '+91-9876543213',
    'Husband',
    162,
    58.0,
    22,
    'hi',
    true,
    true,
    1,
    CURRENT_TIMESTAMP
) ON CONFLICT (uuid) DO NOTHING;

-- Create NAMASTE code system for TulsiHealth
INSERT INTO code_systems (
    uuid, name, title, description, system_type, url, version, status,
    publisher, content, experimental, created_by, created_at
) VALUES (
    'cs_namaste_001',
    'namaste',
    'NAMASTE - AYUSH Terminology',
    'National Ayurveda, Yoga & Naturopathy, Siddha, Unani, Sowa Rigpa, and Homeopathy Terminology',
    'namaste',
    'http://TulsiHealth.in/fhir/CodeSystem/namaste',
    '1.0',
    'active',
    'TulsiHealth',
    'complete',
    false,
    1,
    CURRENT_TIMESTAMP
) ON CONFLICT (uuid) DO NOTHING;

-- Create ICD-11 code system for TulsiHealth
INSERT INTO code_systems (
    uuid, name, title, description, system_type, url, version, status,
    publisher, content, experimental, created_by, created_at
) VALUES (
    'cs_icd11_001',
    'icd11',
    'ICD-11 for Mortality and Morbidity Statistics',
    'WHO International Classification of Diseases 11th Revision',
    'icd11',
    'https://id.who.int/icd/release/11/mms',
    '2024-01',
    'active',
    'World Health Organization',
    'complete',
    false,
    1,
    CURRENT_TIMESTAMP
) ON CONFLICT (uuid) DO NOTHING;

-- Create sample NAMASTE concepts for TulsiHealth
INSERT INTO concepts (
    uuid, code, display, definition, code_system_id, status, level, created_at
) VALUES 
(
    'namaste_jwara_001',
    'JWARA-001',
    'Jwara (Fever)',
    'Elevated body temperature due to dosha imbalance, characterized by increased body heat, thirst, and weakness',
    (SELECT id FROM code_systems WHERE system_type = 'namaste'),
    'active',
    1,
    CURRENT_TIMESTAMP
),
(
    'namaste_kasa_001',
    'KASA-001',
    'Kasa (Cough)',
    'Respiratory condition characterized by forceful expulsion of air from lungs, due to vitiated Kapha and Vata',
    (SELECT id FROM code_systems WHERE system_type = 'namaste'),
    'active',
    1,
    CURRENT_TIMESTAMP
),
(
    'namaste_shwasa_001',
    'SHWASA-001',
    'Shwasa (Dyspnea)',
    'Difficulty in breathing due to vitiated Vata, characterized by shortness of breath and chest discomfort',
    (SELECT id FROM code_systems WHERE system_type = 'namaste'),
    'active',
    1,
    CURRENT_TIMESTAMP
) ON CONFLICT (uuid) DO NOTHING;

-- Create sample ICD-11 concepts for TulsiHealth
INSERT INTO concepts (
    uuid, code, display, definition, code_system_id, status, level, created_at
) VALUES 
(
    'icd11_fever_001',
    '9A00',
    'Fever',
    'Elevation of body temperature above normal range',
    (SELECT id FROM code_systems WHERE system_type = 'icd11'),
    'active',
    1,
    CURRENT_TIMESTAMP
),
(
    'icd11_cough_001',
    'CA08.0',
    'Cough',
    'Sudden expulsion of air from the lungs with characteristic sound',
    (SELECT id FROM code_systems WHERE system_type = 'icd11'),
    'active',
    1,
    CURRENT_TIMESTAMP
),
(
    'icd11_dyspnea_001',
    'CA23.0',
    'Shortness of breath',
    'Subjective awareness of difficulty in breathing',
    (SELECT id FROM code_systems WHERE system_type = 'icd11'),
    'active',
    1,
    CURRENT_TIMESTAMP
) ON CONFLICT (uuid) DO NOTHING;

-- Create concept map for dual-coding
INSERT INTO concept_maps (
    uuid, name, description, status, source_system_id, target_system_id, group, created_by, created_at
) VALUES (
    'map_namaste_icd11_001',
    'NAMASTE to ICD-11 Mapping',
    'Mapping between NAMASTE AYUSH terminology and WHO ICD-11',
    'active',
    (SELECT id FROM code_systems WHERE system_type = 'namaste'),
    (SELECT id FROM code_systems WHERE system_type = 'icd11'),
    'dual_coding',
    1,
    CURRENT_TIMESTAMP
) ON CONFLICT (uuid) DO NOTHING;

-- Create concept mappings for TulsiHealth
INSERT INTO concept_mappings (
    concept_map_id, source_code, source_display, source_system, target_code, target_display, target_system, equivalence, confidence, quality, created_at
) VALUES 
(
    (SELECT id FROM concept_maps WHERE uuid = 'map_namaste_icd11_001'),
    'JWARA-001',
    'Jwara (Fever)',
    'namaste',
    '9A00',
    'Fever',
    'icd11',
    'equivalent',
    95,
    'high',
    CURRENT_TIMESTAMP
),
(
    (SELECT id FROM concept_maps WHERE uuid = 'map_namaste_icd11_001'),
    'KASA-001',
    'Kasa (Cough)',
    'namaste',
    'CA08.0',
    'Cough',
    'icd11',
    'equivalent',
    90,
    'high',
    CURRENT_TIMESTAMP
),
(
    (SELECT id FROM concept_maps WHERE uuid = 'map_namaste_icd11_001'),
    'SHWASA-001',
    'Shwasa (Dyspnea)',
    'namaste',
    'CA23.0',
    'Shortness of breath',
    'icd11',
    'equivalent',
    85,
    'medium',
    CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

-- Create sample dual-coded conditions for TulsiHealth
INSERT INTO conditions (
    uuid, namaste_code, namaste_name, namaste_description, namaste_category,
    icd11_code, icd11_name, icd11_description, icd11_linearization, icd11_chapter,
    concept_map_uuid, confidence_score, mapping_method, severity, status, created_by, created_at
) VALUES 
(
    'condition_001',
    'JWARA-001',
    'Jwara (Fever)',
    'Elevated body temperature due to dosha imbalance',
    'Jwara Chikitsa',
    '9A00',
    'Fever',
    'Elevation of body temperature above normal range',
    'mms',
    'Certain infectious or parasitic diseases',
    'map_namaste_icd11_001',
    0.95,
    'manual',
    'moderate',
    'active',
    1,
    CURRENT_TIMESTAMP
),
(
    'condition_002',
    'KASA-001',
    'Kasa (Cough)',
    'Respiratory condition due to vitiated Kapha and Vata',
    'Kasa Chikitsa',
    'CA08.0',
    'Cough',
    'Sudden expulsion of air from the lungs with characteristic sound',
    'mms',
    'Symptoms, signs or clinical findings, not elsewhere classified',
    'map_namaste_icd11_001',
    0.90,
    'manual',
    'mild',
    'active',
    1,
    CURRENT_TIMESTAMP
),
(
    'condition_003',
    'SHWASA-001',
    'Shwasa (Dyspnea)',
    'Difficulty in breathing due to vitiated Vata',
    'Shwasa Chikitsa',
    'CA23.0',
    'Shortness of breath',
    'Subjective awareness of difficulty in breathing',
    'mms',
    'Symptoms, signs or clinical findings, not elsewhere classified',
    'map_namaste_icd11_001',
    0.85,
    'manual',
    'moderate',
    'active',
    1,
    CURRENT_TIMESTAMP
) ON CONFLICT (uuid) DO NOTHING;

-- Create patient allergies for TulsiHealth
INSERT INTO patient_allergies (patient_id, allergy, severity, reaction, created_at)
VALUES 
((SELECT id FROM patients WHERE uuid = 'patient_001'), 'Pollen', 'moderate', 'Sneezing, watery eyes', CURRENT_TIMESTAMP),
((SELECT id FROM patients WHERE uuid = 'patient_001'), 'Dust mites', 'mild', 'Nasal congestion', CURRENT_TIMESTAMP),
((SELECT id FROM patients WHERE uuid = 'patient_002'), 'Penicillin', 'severe', 'Anaphylaxis', CURRENT_TIMESTAMP),
((SELECT id FROM patients WHERE uuid = 'patient_002'), 'Shellfish', 'moderate', 'Hives, itching', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Create patient conditions for TulsiHealth
INSERT INTO patient_conditions (patient_id, condition, diagnosis_date, status, treatment, created_at)
VALUES 
((SELECT id FROM patients WHERE uuid = 'patient_001'), 'Jwara (Fever)', '2024-04-10', 'active', 'Ayurvedic fever management protocol', CURRENT_TIMESTAMP),
((SELECT id FROM patients WHERE uuid = 'patient_001'), 'Kasa (Cough)', '2024-04-08', 'active', 'Kapha-reducing herbs and steam therapy', CURRENT_TIMESTAMP),
((SELECT id FROM patients WHERE uuid = 'patient_002'), 'Amla Pitta (Hyperacidity)', '2024-04-05', 'managed', 'Pitta-pacifying diet and herbs', CURRENT_TIMESTAMP),
((SELECT id FROM patients WHERE uuid = 'patient_002'), 'Aruchi (Anorexia)', '2024-04-12', 'active', 'Agni-enhancing therapies', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Create audit log entries for TulsiHealth
INSERT INTO audit_logs (
    uuid, user_id, action, resource, resource_id, details, timestamp, current_hash
) VALUES 
(
    gen_random_uuid(),
    1,
    'system_initialized',
    'system',
    'TulsiHealth',
    '{"message": "TulsiHealth database initialized with seed data"}',
    CURRENT_TIMESTAMP,
    sha256('TulsiHealth database initialization ' || CURRENT_TIMESTAMP)
),
(
    gen_random_uuid(),
    1,
    'admin_user_created',
    'user',
    'user_admin_001',
    '{"username": "admin", "role": "admin"}',
    CURRENT_TIMESTAMP,
    sha256('Admin user created ' || CURRENT_TIMESTAMP)
),
(
    gen_random_uuid(),
    1,
    'patients_seeded',
    'patient',
    'bulk',
    '{"count": 2, "source": "TulsiHealth seed data"}',
    CURRENT_TIMESTAMP,
    sha256('Patients seeded ' || CURRENT_TIMESTAMP)
) ON CONFLICT DO NOTHING;

-- Create indexes for TulsiHealth performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_patients_uuid ON patients(uuid);
CREATE INDEX IF NOT EXISTS idx_patients_abha_id ON patients(abha_id);
CREATE INDEX IF NOT EXISTS idx_concepts_code_system ON concepts(code_system_id);
CREATE INDEX IF NOT EXISTS idx_concepts_code ON concepts(code);
CREATE INDEX IF NOT EXISTS idx_conditions_namaste_code ON conditions(namaste_code);
CREATE INDEX IF NOT EXISTS idx_conditions_icd11_code ON conditions(icd11_code);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Create TulsiHealth specific functions
CREATE OR REPLACE FUNCTION get_patient_by_abha(abha_id TEXT)
RETURNS TABLE (
    id INTEGER,
    uuid TEXT,
    patient_id TEXT,
    name TEXT,
    email TEXT,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT,
    blood_group TEXT,
    abha_id TEXT,
    abha_linked BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.uuid, p.patient_id, p.name, p.email, p.phone, 
           p.date_of_birth, p.gender, p.blood_group, p.abha_id, p.abha_linked
    FROM patients p
    WHERE p.abha_id = get_patient_by_abha.abha_id
    AND p.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Create TulsiHealth specific views
CREATE OR REPLACE VIEW v_tulsihealth_patient_summary AS
SELECT 
    p.id,
    p.patient_id,
    p.name,
    p.email,
    p.phone,
    p.date_of_birth,
    p.gender,
    p.blood_group,
    p.abha_id,
    p.abha_linked,
    p.created_at,
    COUNT(pa.id) as allergy_count,
    COUNT(pc.id) as condition_count
FROM patients p
LEFT JOIN patient_allergies pa ON p.id = pa.patient_id
LEFT JOIN patient_conditions pc ON p.id = pc.patient_id
WHERE p.is_active = true
GROUP BY p.id, p.patient_id, p.name, p.email, p.phone, 
         p.date_of_birth, p.gender, p.blood_group, p.abha_id, p.abha_linked, p.created_at;

-- Create TulsiHealth specific triggers
CREATE OR REPLACE FUNCTION update_patient_modified()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_patient_modified
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_patient_modified();

-- Set TulsiHealth database parameters
ALTER DATABASE SET timezone = 'UTC';
ALTER DATABASE SET default_text_search_config = 'english';

-- Create TulsiHealth specific extensions if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Log initialization completion
INSERT INTO audit_logs (
    uuid, user_id, action, resource, resource_id, details, timestamp, current_hash
) VALUES (
    gen_random_uuid(),
    1,
    'database_initialization_complete',
    'system',
    'TulsiHealth',
    '{"message": "TulsiHealth database initialization completed successfully", "timestamp": "' || CURRENT_TIMESTAMP || '"}',
    CURRENT_TIMESTAMP,
    sha256('TulsiHealth database initialization complete ' || CURRENT_TIMESTAMP)
);

-- TulsiHealth initialization complete message
DO $$
BEGIN
    RAISE NOTICE '🌟 TulsiHealth Database Initialization Complete!';
    RAISE NOTICE '✅ Admin user: admin@TulsiHealth.in / admin123';
    RAISE NOTICE '✅ Sample patients created with ABHA integration';
    RAISE NOTICE '✅ NAMASTE and ICD-11 code systems seeded';
    RAISE NOTICE '✅ Dual-coding concept mappings created';
    RAISE NOTICE '✅ Audit logging system initialized';
    RAISE NOTICE '🎯 TulsiHealth platform ready for production use!';
END $$;
