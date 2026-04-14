-- TulsiHealth Database Initialization Script
-- This script creates the database schema and initial data

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance
-- These will be created automatically by SQLAlchemy but we can optimize them here

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_abha_id ON users(abha_id);
CREATE INDEX IF NOT EXISTS idx_users_abha_number ON users(abha_number);

-- Patients table indexes
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_uuid ON patients(uuid);
CREATE INDEX IF NOT EXISTS idx_patients_abha_number ON patients(abha_number);
CREATE INDEX IF NOT EXISTS idx_patients_abha_id ON patients(abha_id);
CREATE INDEX IF NOT EXISTS idx_patients_consent_token ON patients(consent_token);
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON patients(created_by);

-- Patient identifiers indexes
CREATE INDEX IF NOT EXISTS idx_patient_identifiers_patient_id ON patient_identifiers(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_identifiers_system ON patient_identifiers(system);
CREATE INDEX IF NOT EXISTS idx_patient_identifiers_value ON patient_identifiers(value);

-- Encounters table indexes
CREATE INDEX IF NOT EXISTS idx_encounters_patient_id ON encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_provider_id ON encounters(provider_id);
CREATE INDEX IF NOT EXISTS idx_encounters_status ON encounters(status);
CREATE INDEX IF NOT EXISTS idx_encounters_period_start ON encounters(period_start);

-- Conditions table indexes
CREATE INDEX IF NOT EXISTS idx_conditions_patient_id ON conditions(patient_id);
CREATE INDEX IF NOT EXISTS idx_conditions_encounter_id ON conditions(encounter_id);
CREATE INDEX IF NOT EXISTS idx_conditions_ayush_code ON conditions(ayush_code);
CREATE INDEX IF NOT EXISTS idx_conditions_icd11_code ON conditions(icd11_code);
CREATE INDEX IF NOT EXISTS idx_conditions_clinical_status ON conditions(clinical_status);

-- CodeSystems table indexes
CREATE INDEX IF NOT EXISTS idx_codesystems_url ON codesystems(url);
CREATE INDEX IF NOT EXISTS idx_codesystems_name ON codesystems(name);
CREATE INDEX IF NOT EXISTS idx_codesystems_status ON codesystems(status);

-- Concepts table indexes
CREATE INDEX IF NOT EXISTS idx_concepts_codesystem_id ON concepts(codesystem_id);
CREATE INDEX IF NOT EXISTS idx_concepts_code ON concepts(code);
CREATE INDEX IF NOT EXISTS idx_concepts_status ON concepts(status);
CREATE INDEX IF NOT EXISTS idx_concepts_parent_code ON concepts(parent_code);
CREATE INDEX IF NOT EXISTS idx_concepts_category ON concepts(category);

-- Audit events table indexes
CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_patient_id ON audit_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource_type ON audit_events(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON audit_events(action);
CREATE INDEX IF NOT EXISTS idx_audit_events_recorded ON audit_events(recorded);
CREATE INDEX IF NOT EXISTS idx_audit_events_current_hash ON audit_events(current_hash);

-- Consents table indexes
CREATE INDEX IF NOT EXISTS idx_consents_patient_id ON consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_consents_grantee_id ON consents(grantee_id);
CREATE INDEX IF NOT EXISTS idx_consents_status ON consents(status);

-- Full-text search indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_concepts_search ON concepts USING gin(to_tsvector('english', display || ' ' || definition || ' ' || coalesce(english_name, '') || ' ' || coalesce(tamil_name, '') || ' ' || coalesce(hindi_name, '')));

-- Insert initial sample data
-- This will be handled by the application initialization, but we can add some basic data here

-- Create sample users (passwords will be hashed by the application)
-- Note: These are placeholder records - actual user creation should go through the API

-- Create sample admin user (will be hashed by application)
-- INSERT INTO users (username, email, hashed_password, full_name, role, is_active, is_verified)
-- VALUES ('admin', 'admin@tulsihealth.in', '$2b$12$placeholder_hash', 'System Administrator', 'admin', true, true);

-- Create sample doctor user
-- INSERT INTO users (username, email, hashed_password, full_name, role, qualifications, is_active, is_verified)
-- VALUES ('dr.ramesh', 'ramesh@tulsihealth.in', '$2b$12$placeholder_hash', 'Dr. Ramesh Kumar', 'doctor', ARRAY['BAMS', 'MD Ayurveda'], true, true);

-- Create sample clinician user  
-- INSERT INTO users (username, email, hashed_password, full_name, role, is_active, is_verified)
-- VALUES ('priya', 'priya@tulsihealth.in', '$2b$12$placeholder_hash', 'Priya Sharma', 'clinician', true, true);

-- Create sample patient user
-- INSERT INTO users (username, email, hashed_password, full_name, role, is_active, is_verified)
-- VALUES ('rajan', 'rajan@tulsihealth.in', '$2b$12$placeholder_hash', 'Rajan Kumar', 'patient', true, true);

-- Database version tracking
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_version (version, description) 
VALUES (1, 'Initial TulsiHealth database schema') 
ON CONFLICT (version) DO NOTHING;

-- Enable row-level security for patient data (optional, for additional security)
-- This can be implemented based on specific security requirements

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts for TulsiHealth system';
COMMENT ON TABLE patients IS 'Patient records with ABHA integration';
COMMENT ON TABLE encounters IS 'Clinical encounters and visits';
COMMENT ON TABLE conditions IS 'Medical conditions with dual coding (AYUSH + ICD-11)';
COMMENT ON TABLE codesystems IS 'FHIR CodeSystems for terminology';
COMMENT ON TABLE concepts IS 'Concepts within CodeSystems';
COMMENT ON TABLE audit_events IS 'Immutable audit trail with hash chain';
COMMENT ON TABLE consents IS 'Patient consent records';

-- Set up database configuration
-- These settings optimize performance for the TulsiHealth workload

-- Increase shared buffers for better performance
-- ALTER SYSTEM SET shared_buffers = '256MB';
-- ALTER SYSTEM SET effective_cache_size = '1GB';
-- ALTER SYSTEM SET maintenance_work_mem = '64MB';
-- ALTER SYSTEM SET checkpoint_completion_target = 0.9;
-- ALTER SYSTEM SET wal_buffers = '16MB';
-- ALTER SYSTEM SET default_statistics_target = 100;

-- Reload configuration
-- SELECT pg_reload_conf();

-- Grant permissions (adjust based on your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tulsi_admin;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tulsi_admin;
