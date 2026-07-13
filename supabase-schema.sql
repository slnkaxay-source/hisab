-- Hisab Database Schema
-- Run this in Supabase SQL Editor

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. CONTACTS TABLE
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_registered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email)
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contacts"
  ON contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts"
  ON contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
  ON contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
  ON contacts FOR DELETE
  USING (auth.uid() = user_id);

-- 3. DEBT REQUESTS TABLE
CREATE TABLE IF NOT EXISTS debt_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_email TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  note TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  is_registered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE debt_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sent requests"
  ON debt_requests FOR SELECT
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can view own received requests"
  ON debt_requests FOR SELECT
  USING (auth.uid() = receiver_id);

CREATE POLICY "Users can insert debt requests"
  ON debt_requests FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own received requests"
  ON debt_requests FOR UPDATE
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- 4. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_request', 'accepted', 'rejected', 'invitation_joined', 'reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  debt_request_id UUID REFERENCES debt_requests(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_debt_requests_sender ON debt_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_debt_requests_receiver ON debt_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_debt_requests_receiver_email ON debt_requests(receiver_email);
CREATE INDEX IF NOT EXISTS idx_debt_requests_status ON debt_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);

-- AUTO-UPDATE FUNCTIONS
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_timestamp
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_contacts_timestamp
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_debt_requests_timestamp
  BEFORE UPDATE ON debt_requests
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- NOTIFICATION AUTO-CREATION
CREATE OR REPLACE FUNCTION notify_debt_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' AND NEW.is_registered = TRUE THEN
    INSERT INTO notifications (user_id, type, title, message, debt_request_id)
    VALUES (
      NEW.receiver_id,
      'new_request',
      'New Debt Request',
      (SELECT full_name FROM profiles WHERE id = NEW.sender_id) || ' sent you a debt request of ₹' || NEW.amount || ' for ' || NEW.reason,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_debt_request_insert
  AFTER INSERT ON debt_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_debt_request();

CREATE OR REPLACE FUNCTION notify_debt_response()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, title, message, debt_request_id)
    VALUES (
      NEW.sender_id,
      'accepted',
      'Request Accepted',
      (SELECT full_name FROM profiles WHERE id = NEW.receiver_id) || ' accepted your debt request of ₹' || NEW.amount,
      NEW.id
    );
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, title, message, debt_request_id)
    VALUES (
      NEW.sender_id,
      'rejected',
      'Request Rejected',
      (SELECT full_name FROM profiles WHERE id = NEW.receiver_id) || ' rejected your debt request of ₹' || NEW.amount || ' for ' || NEW.reason,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_debt_request_update
  AFTER UPDATE OF status ON debt_requests
  FOR EACH ROW
  WHEN (NEW.status IN ('accepted', 'rejected') AND OLD.status = 'pending')
  EXECUTE FUNCTION notify_debt_response();
