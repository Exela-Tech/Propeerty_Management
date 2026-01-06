-- Drop the existing team_members_role_check constraint and create a new one
-- that allows the correct role values

ALTER TABLE team_members 
DROP CONSTRAINT IF EXISTS team_members_role_check;

ALTER TABLE team_members
ADD CONSTRAINT team_members_role_check 
CHECK (role IN ('admin', 'property_manager', 'accountant', 'support_staff'));
