-- Grandfather every player who already existed before email verification went
-- live. Curt's 20260611000000_add_email_verification.sql defaults the new
-- email_verified column to FALSE for ALL rows, and the login flow now blocks
-- anyone who is not verified. Without this backfill, every existing player
-- (e.g. the ~21 current accounts) would be permanently locked out, because
-- they never received a verification email.
--
-- Email verification was never live before this deploy, so no real account
-- could legitimately be "unverified" yet. We therefore mark all current users
-- as verified here. New signups after this point still go through the normal
-- verify-email flow (register sets email_verified = false + issues a token).
UPDATE users
SET email_verified = true
WHERE email_verified = false;
