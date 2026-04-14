"""Initial migration for TulsiHealth

Revision ID: 001_initial
Revises: 
Create Date: 2024-04-12 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """Create initial TulsiHealth database schema"""
    
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('uuid', sa.String(length=36), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('date_of_birth', sa.DateTime(), nullable=True),
        sa.Column('gender', sa.String(length=10), nullable=True),
        sa.Column('blood_group', sa.String(length=10), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('state', sa.String(length=100), nullable=True),
        sa.Column('pincode', sa.String(length=10), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('abha_id', sa.String(length=36), nullable=True),
        sa.Column('abha_linked', sa.Boolean(), nullable=True),
        sa.Column('abha_number', sa.String(length=20), nullable=True),
        sa.Column('emergency_contact_name', sa.String(length=255), nullable=True),
        sa.Column('emergency_contact_phone', sa.String(length=20), nullable=True),
        sa.Column('emergency_contact_relation', sa.String(length=100), nullable=True),
        sa.Column('license_number', sa.String(length=100), nullable=True),
        sa.Column('specialization', sa.String(length=200), nullable=True),
        sa.Column('experience_years', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=True),
        sa.Column('is_superuser', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('uuid'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username'),
        sa.UniqueConstraint('abha_id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    op.create_index(op.f('ix_users_role'), 'users', ['role'])
    
    # Create patients table
    op.create_table('patients',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('uuid', sa.String(length=36), nullable=False),
        sa.Column('patient_id', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('gender', sa.String(length=10), nullable=True),
        sa.Column('blood_group', sa.String(length=10), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('state', sa.String(length=100), nullable=True),
        sa.Column('pincode', sa.String(length=10), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('abha_id', sa.String(length=36), nullable=True),
        sa.Column('abha_linked', sa.Boolean(), nullable=True),
        sa.Column('abha_number', sa.String(length=20), nullable=True),
        sa.Column('emergency_contact_name', sa.String(length=255), nullable=True),
        sa.Column('emergency_contact_phone', sa.String(length=20), nullable=True),
        sa.Column('emergency_contact_relation', sa.String(length=100), nullable=True),
        sa.Column('height', sa.Integer(), nullable=True),
        sa.Column('weight', sa.Float(), nullable=True),
        sa.Column('bmi', sa.Integer(), nullable=True),
        sa.Column('preferred_language', sa.String(length=10), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_visit', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('profile_picture_url', sa.String(length=500), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('uuid'),
        sa.UniqueConstraint('patient_id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('abha_id'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    )
    op.create_index(op.f('ix_patients_uuid'), 'patients', ['uuid'], unique=True)
    op.create_index(op.f('ix_patients_abha_id'), 'patients', ['abha_id'])
    op.create_index(op.f('ix_patients_created_by'), 'patients', ['created_by'])
    
    # Create code_systems table
    op.create_table('code_systems',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('uuid', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('system_type', sa.String(length=50), nullable=False),
        sa.Column('url', sa.String(length=500), nullable=True),
        sa.Column('version', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('publisher', sa.String(length=255), nullable=True),
        sa.Column('content', sa.String(length=50), nullable=True),
        sa.Column('experimental', sa.Boolean(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_reviewed', sa.DateTime(timezone=True), nullable=True),
        sa.Column('effective_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('total_concepts', sa.Integer(), nullable=True),
        sa.Column('active_concepts', sa.Integer(), nullable=True),
        sa.Column('retired_concepts', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('uuid'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    )
    op.create_index(op.f('ix_code_systems_system_type'), 'code_systems', ['system_type'])
    
    # Create concepts table
    op.create_table('concepts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('uuid', sa.String(length=36), nullable=False),
        sa.Column('code', sa.String(length=100), nullable=False),
        sa.Column('display', sa.String(length=255), nullable=False),
        sa.Column('definition', sa.Text(), nullable=True),
        sa.Column('code_system_id', sa.Integer(), nullable=False),
        sa.Column('parent_concept_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('level', sa.Integer(), nullable=True),
        sa.Column('hierarchy', sa.Text(), nullable=True),
        sa.Column('designation', sa.String(length=255), nullable=True),
        sa.Column('comments', sa.Text(), nullable=True),
        sa.Column('examples', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('effective_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('effective_end', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('uuid'),
        sa.ForeignKeyConstraint(['code_system_id'], ['code_systems.id'], ),
        sa.ForeignKeyConstraint(['parent_concept_id'], ['concepts.id'], ),
    )
    op.create_index(op.f('ix_concepts_code_system_id'), 'concepts', ['code_system_id'])
    op.create_index(op.f('ix_concepts_code'), 'concepts', ['code'])
    
    # Create concept_maps table
    op.create_table('concept_maps',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('uuid', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('source_system_id', sa.Integer(), nullable=False),
        sa.Column('target_system_id', sa.Integer(), nullable=False),
        sa.Column('group', sa.String(length=100), nullable=True),
        sa.Column('unmapped', sa.Boolean(), nullable=True),
        sa.Column('relationship', sa.String(length=50), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_reviewed', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('uuid'),
        sa.ForeignKeyConstraint(['source_system_id'], ['code_systems.id'], ),
        sa.ForeignKeyConstraint(['target_system_id'], ['code_systems.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    )
    op.create_index(op.f('ix_concept_maps_source_system_id'), 'concept_maps', ['source_system_id'])
    op.create_index(op.f('ix_concept_maps_target_system_id'), 'concept_maps', ['target_system_id'])
    
    # Create concept_mappings table
    op.create_table('concept_mappings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('concept_map_id', sa.Integer(), nullable=False),
        sa.Column('source_code', sa.String(length=100), nullable=False),
        sa.Column('source_display', sa.String(length=255), nullable=True),
        sa.Column('source_system', sa.String(length=100), nullable=False),
        sa.Column('target_code', sa.String(length=100), nullable=False),
        sa.Column('target_display', sa.String(length=255), nullable=True),
        sa.Column('target_system', sa.String(length=100), nullable=False),
        sa.Column('equivalence', sa.String(length=50), nullable=True),
        sa.Column('relationship', sa.String(length=50), nullable=True),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('depends_on', sa.Text(), nullable=True),
        sa.Column('product', sa.Text(), nullable=True),
        sa.Column('confidence', sa.Integer(), nullable=True),
        sa.Column('quality', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['concept_map_id'], ['concept_maps.id'], ),
    )
    op.create_index(op.f('ix_concept_mappings_concept_map_id'), 'concept_mappings', ['concept_map_id'])
    op.create_index(op.f('ix_concept_mappings_source_code'), 'concept_mappings', ['source_code'])
    
    # Create conditions table
    op.create_table('conditions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('uuid', sa.String(length=36), nullable=False),
        sa.Column('namaste_code', sa.String(length=50), nullable=False),
        sa.Column('namaste_name', sa.String(length=255), nullable=False),
        sa.Column('namaste_description', sa.Text(), nullable=True),
        sa.Column('namaste_category', sa.String(length=100), nullable=True),
        sa.Column('icd11_code', sa.String(length=50), nullable=True),
        sa.Column('icd11_name', sa.String(length=255), nullable=True),
        sa.Column('icd11_description', sa.Text(), nullable=True),
        sa.Column('icd11_linearization', sa.String(length=20), nullable=True),
        sa.Column('icd11_chapter', sa.String(length=100), nullable=True),
        sa.Column('concept_map_uuid', sa.String(length=36), nullable=True),
        sa.Column('confidence_score', sa.Float(), nullable=True),
        sa.Column('mapping_method', sa.String(length=50), nullable=True),
        sa.Column('severity', sa.String(length=20), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('onset_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolution_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('snomed_ct_code', sa.String(length=50), nullable=True),
        sa.Column('loinc_code', sa.String(length=50), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('clinical_notes', sa.Text(), nullable=True),
        sa.Column('coding_notes', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('uuid'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
    )
    op.create_index(op.f('ix_conditions_namaste_code'), 'conditions', ['namaste_code'])
    op.create_index(op.f('ix_conditions_icd11_code'), 'conditions', ['icd11_code'])
    
    # Create patient_allergies table
    op.create_table('patient_allergies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('allergy', sa.String(length=255), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=True),
        sa.Column('reaction', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
    )
    op.create_index(op.f('ix_patient_allergies_patient_id'), 'patient_allergies', ['patient_id'])
    
    # Create patient_conditions table
    op.create_table('patient_conditions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('condition', sa.String(length=255), nullable=False),
        sa.Column('diagnosis_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('treatment', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
    )
    op.create_index(op.f('ix_patient_conditions_patient_id'), 'patient_conditions', ['patient_id'])
    
    # Create audit_logs table
    op.create_table('audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('uuid', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('resource', sa.String(length=100), nullable=False),
        sa.Column('resource_id', sa.String(length=100), nullable=True),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('previous_hash', sa.String(length=64), nullable=True),
        sa.Column('current_hash', sa.String(length=64), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('uuid'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    )
    op.create_index(op.f('ix_audit_logs_user_id'), 'audit_logs', ['user_id'])
    op.create_index(op.f('ix_audit_logs_timestamp'), 'audit_logs', ['timestamp'])
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'])
    
    # Insert TulsiHealth initial data
    op.execute("""
        INSERT INTO users (uuid, email, username, password_hash, first_name, last_name, role, is_active, is_verified, is_superuser, license_number, specialization, created_at)
        VALUES ('user_admin_001', 'admin@TulsiHealth.in', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkOYxjQ5wMw5K8W5w5w5w5w5w5w5w5', 'Admin', 'User', 'admin', true, true, true, 'ADMIN001', 'System Administration', now())
        ON CONFLICT (uuid) DO NOTHING;
    """)
    
    op.execute("""
        INSERT INTO code_systems (uuid, name, title, description, system_type, url, version, status, publisher, content, experimental, created_by, created_at)
        VALUES 
        ('cs_namaste_001', 'namaste', 'NAMASTE - AYUSH Terminology', 'National Ayurveda, Yoga & Naturopathy, Siddha, Unani, Sowa Rigpa, and Homeopathy Terminology', 'namaste', 'http://TulsiHealth.in/fhir/CodeSystem/namaste', '1.0', 'active', 'TulsiHealth', 'complete', false, 1, now()),
        ('cs_icd11_001', 'icd11', 'ICD-11 for Mortality and Morbidity Statistics', 'WHO International Classification of Diseases 11th Revision', 'icd11', 'https://id.who.int/icd/release/11/mms', '2024-01', 'active', 'World Health Organization', 'complete', false, 1, now())
        ON CONFLICT (uuid) DO NOTHING;
    """)


def downgrade():
    """Drop TulsiHealth database schema"""
    
    # Drop tables in reverse order of creation
    op.drop_table('audit_logs')
    op.drop_table('patient_conditions')
    op.drop_table('patient_allergies')
    op.drop_table('conditions')
    op.drop_table('concept_mappings')
    op.drop_table('concept_maps')
    op.drop_table('concepts')
    op.drop_table('code_systems')
    op.drop_table('patients')
    op.drop_table('users')
