-- Create user_registrations table for approval workflow
CREATE TABLE IF NOT EXISTS user_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  requested_role TEXT NOT NULL CHECK (requested_role IN ('tenant', 'landlord', 'property_manager', 'accountant', 'support_staff')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(id)
);

-- Add columns to profiles table for enhanced user management
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disabled_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disabled_reason TEXT;

-- Create permissions table for fine-grained access control
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('admin', 'landlord', 'tenant', 'property_manager', 'accountant', 'support_staff')),
  resource TEXT NOT NULL, -- e.g., 'properties', 'tenants', 'payments', 'expenses'
  can_view BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  can_approve BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, resource)
);

-- Insert default permissions for each role
INSERT INTO role_permissions (role, resource, can_view, can_create, can_edit, can_delete, can_approve) VALUES
-- Admin has full access to everything
('admin', 'properties', true, true, true, true, true),
('admin', 'units', true, true, true, true, true),
('admin', 'tenants', true, true, true, true, true),
('admin', 'landlords', true, true, true, true, true),
('admin', 'payments', true, true, true, true, true),
('admin', 'expenses', true, true, true, true, true),
('admin', 'maintenance', true, true, true, true, true),
('admin', 'financials', true, true, true, true, true),
('admin', 'reports', true, true, true, true, true),
('admin', 'users', true, true, true, true, true),

-- Landlord can view their own properties and related data
('landlord', 'properties', true, false, false, false, false),
('landlord', 'units', true, false, false, false, false),
('landlord', 'tenants', true, false, false, false, false),
('landlord', 'payments', true, false, false, false, false),
('landlord', 'expenses', true, false, false, false, false),
('landlord', 'maintenance', true, false, false, false, false),
('landlord', 'financials', true, false, false, false, false),
('landlord', 'reports', true, false, false, false, false),

-- Tenant can only view their own data
('tenant', 'payments', true, false, false, false, false),
('tenant', 'maintenance', true, true, false, false, false),

-- Property Manager can manage properties and tenants
('property_manager', 'properties', true, true, true, false, false),
('property_manager', 'units', true, true, true, false, false),
('property_manager', 'tenants', true, true, true, false, false),
('property_manager', 'payments', true, true, false, false, false),
('property_manager', 'maintenance', true, true, true, false, false),
('property_manager', 'reports', true, false, false, false, false),

-- Accountant can manage financials
('accountant', 'payments', true, true, true, false, false),
('accountant', 'expenses', true, true, true, false, false),
('accountant', 'financials', true, true, true, false, false),
('accountant', 'reports', true, false, false, false, false),

-- Support Staff has limited access
('support_staff', 'tenants', true, false, false, false, false),
('support_staff', 'maintenance', true, true, false, false, false),
('support_staff', 'payments', true, false, false, false, false)
ON CONFLICT (role, resource) DO NOTHING;

-- Create activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_registrations_status ON user_registrations(status);
CREATE INDEX IF NOT EXISTS idx_user_registrations_email ON user_registrations(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
