-- Migration: Add tour reminder system settings
-- Description: Configure tour reminder email intervals and enable/disable feature

-- Insert tour reminder settings
INSERT INTO system_settings (setting_key, setting_value, description, category, data_type, is_public, created_at, updated_at)
VALUES 
  (
    'tour_reminder_enabled',
    'true',
    'Enable or disable automatic tour reminder emails',
    'email',
    'boolean',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'tour_reminder_intervals',
    '[72, 24, 3]',
    'Hours before tour start to send reminders (JSON array). Default: 72h (3 days), 24h (1 day), 3h (3 hours)',
    'email',
    'json',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT (setting_key) 
DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- Add comment
COMMENT ON TABLE system_settings IS 'System configuration settings including tour reminder preferences';
