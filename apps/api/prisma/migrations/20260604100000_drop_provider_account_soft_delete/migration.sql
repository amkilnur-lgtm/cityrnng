-- Hard-delete model for UserProviderAccount: a row exists iff the user
-- has an active Strava link. Disconnect physically removes the row.
--
-- Two things happen here:
--   1. Purge existing tombstone rows (disconnected_at IS NOT NULL) and
--      any related ExternalActivity / EventAttendance still riding on
--      them. Those tombstones currently block reconnects because of the
--      global UNIQUE(provider, provider_user_id) constraint — same
--      Strava athlete can never be linked to anyone again.
--   2. Drop the now-unused disconnected_at column.

-- Step 1: cascade-clean derived data for tombstoned rows.
-- EventAttendance.externalActivityId references ExternalActivity, so
-- attendances must go before activities.
DELETE FROM event_attendances
WHERE external_activity_id IN (
  SELECT ea.id
  FROM external_activities ea
  JOIN user_provider_accounts upa ON upa.id = ea.user_provider_account_id
  WHERE upa.disconnected_at IS NOT NULL
);

DELETE FROM external_activities
WHERE user_provider_account_id IN (
  SELECT id FROM user_provider_accounts WHERE disconnected_at IS NOT NULL
);

DELETE FROM user_provider_accounts
WHERE disconnected_at IS NOT NULL;

-- Step 2: drop the column.
ALTER TABLE user_provider_accounts DROP COLUMN disconnected_at;
