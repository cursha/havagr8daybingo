-- Grant admin role to the project owner (Curt) and the developer (Michael)
-- so they can manage teams, deeds, members, and game config from the admin
-- panel. Team creation and other admin endpoints require role = 'admin'.
UPDATE users
SET role = 'admin'
WHERE email = 'curt.skene@curtskene.com'
   OR player_number = 10026;
