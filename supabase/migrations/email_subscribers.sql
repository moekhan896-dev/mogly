-- Email subscribers table for Mogly
CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  scan_id UUID,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed BOOLEAN DEFAULT false
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_scan_id ON email_subscribers(scan_id);
