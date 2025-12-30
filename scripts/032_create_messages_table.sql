CREATE TABLE IF NOT EXISTS team_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for group messages
  channel text, -- 'general', 'announcements', etc. for group messages
  message text NOT NULL,
  attachment_url text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON team_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON team_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel ON team_messages(channel);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON team_messages(is_read);
