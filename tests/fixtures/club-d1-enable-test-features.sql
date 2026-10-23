-- Test-only local D1 flags. Never apply to production.
UPDATE club_settings SET setting_value='true' WHERE setting_key IN ('club_enabled','earning_enabled','rewards_enabled');
UPDATE club_settings SET setting_value='100' WHERE setting_key='daily_points_cap';
UPDATE club_settings SET setting_value='250' WHERE setting_key='daily_xp_cap';
INSERT INTO club_settings(setting_key,setting_value) VALUES ('club_enabled','true'),('earning_enabled','true'),('rewards_enabled','true'),('daily_visit_reward_points','2') ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value;
DELETE FROM club_daily_visits WHERE user_id=101;
DELETE FROM club_point_ledger WHERE idempotency_key LIKE 'club-daily-visit:101:%';
INSERT INTO club_missions(id,title_fa,description_fa,cadence,event_type,target_value,reward_points,reward_xp,is_active,created_by)
VALUES ('fixture-claim-mission','مأموریت آزمون','Fixture mission','once','listen',1,10,5,1,'integration-test');
INSERT INTO club_user_missions(user_id,mission_id,period_key,progress_value,status,completed_at)
VALUES (101,'fixture-claim-mission','once',1,'completed',CURRENT_TIMESTAMP);
INSERT INTO club_point_ledger(user_id,delta,source_type,idempotency_key,status)
VALUES (101,50,'fixture','club-fixture-credit','posted');
INSERT INTO club_rewards(id,title_fa,description_fa,reward_type,cost_points,stock_remaining,max_per_user,is_active,created_by)
VALUES ('fixture-cancel-reward','پاداش لغو آزمایشی','Fixture reward','coupon',10,3,5,1,'integration-test');
INSERT INTO club_reward_redemptions(id,user_id,reward_id,cost_points,idempotency_key,status)
VALUES ('fixture-cancel-redemption',101,'fixture-cancel-reward',10,'club-fixture-redemption-cancel','pending');
INSERT INTO club_reward_redemptions(id,user_id,reward_id,cost_points,idempotency_key,status)
VALUES ('fixture-fulfill-redemption',101,'fixture-cancel-reward',10,'club-fixture-redemption-fulfill','pending');
