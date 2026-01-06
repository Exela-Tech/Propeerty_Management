ALTER TABLE team_members
DROP CONSTRAINT team_members_status_check;

ALTER TABLE team_members
ADD CONSTRAINT team_members_status_check
CHECK (status IN ('pending', 'active', 'inactive'));
