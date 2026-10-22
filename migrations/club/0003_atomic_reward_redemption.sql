-- Atomic reward redemption guardrails.
-- Apply after 0001 and 0002. The insert + trigger effects are one SQLite statement/transaction.
CREATE INDEX IF NOT EXISTS idx_club_points_balance
  ON club_point_ledger(user_id, status, created_at);

CREATE TRIGGER IF NOT EXISTS club_redemption_validate
BEFORE INSERT ON club_reward_redemptions
BEGIN
  SELECT CASE
    WHEN COALESCE((SELECT setting_value FROM club_settings WHERE setting_key = 'club_enabled'), 'false') <> 'true'
      OR COALESCE((SELECT setting_value FROM club_settings WHERE setting_key = 'rewards_enabled'), 'false') <> 'true'
    THEN RAISE(ABORT, 'club_rewards_disabled')
  END;
  SELECT CASE
    WHEN NEW.cost_points <= 0
    THEN RAISE(ABORT, 'club_reward_cost_must_be_positive')
  END;
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM club_rewards r
      WHERE r.id = NEW.reward_id
        AND r.is_active = 1
        AND (r.starts_at IS NULL OR r.starts_at <= CURRENT_TIMESTAMP)
        AND (r.ends_at IS NULL OR r.ends_at > CURRENT_TIMESTAMP)
        AND r.cost_points = NEW.cost_points
        AND (r.stock_remaining IS NULL OR r.stock_remaining > 0)
    )
    THEN RAISE(ABORT, 'club_reward_unavailable')
  END;
  SELECT CASE
    WHEN COALESCE((
      SELECT SUM(delta) FROM club_point_ledger
      WHERE user_id = NEW.user_id AND status = 'posted'
    ), 0) < NEW.cost_points
    THEN RAISE(ABORT, 'club_insufficient_points')
  END;
  SELECT CASE
    WHEN (
      SELECT max_per_user FROM club_rewards WHERE id = NEW.reward_id
    ) IS NOT NULL
    AND (
      SELECT COUNT(*) FROM club_reward_redemptions
      WHERE user_id = NEW.user_id AND reward_id = NEW.reward_id
        AND status IN ('pending','fulfilled')
    ) >= (
      SELECT max_per_user FROM club_rewards WHERE id = NEW.reward_id
    )
    THEN RAISE(ABORT, 'club_reward_user_limit')
  END;
END;

CREATE TRIGGER IF NOT EXISTS club_redemption_apply
AFTER INSERT ON club_reward_redemptions
BEGIN
  UPDATE club_rewards
  SET stock_remaining = stock_remaining - 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.reward_id AND stock_remaining IS NOT NULL;

  INSERT INTO club_point_ledger
    (user_id, delta, source_type, source_id, idempotency_key, status, metadata_json, created_by)
  VALUES
    (NEW.user_id, -NEW.cost_points, 'reward_redemption', NEW.id,
     'club-reward-redemption:' || NEW.id, 'posted',
     json_object('reward_id', NEW.reward_id), 'system');

  INSERT INTO club_audit_logs
    (id, actor_user_id, action, target_type, target_id, metadata_json)
  VALUES
    ('redemption:' || NEW.id, NEW.user_id, 'club.reward.redeem',
     'club_reward_redemption', NEW.id,
     json_object('reward_id', NEW.reward_id, 'cost_points', NEW.cost_points));
END;
