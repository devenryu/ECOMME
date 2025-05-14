-- Add profiles table if not exists
CREATE TABLE IF NOT EXISTS "profiles" (
  "id" uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  "full_name" text,
  "phone" text,
  "bio" text,
  "avatar_url" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Add seller_settings table
CREATE TABLE IF NOT EXISTS "seller_settings" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  "store_name" text,
  "description" text,
  "contact_email" text,
  "support_phone" text,
  "address" text,
  "logo_url" text,
  "currency" text DEFAULT 'USD',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Add notification_settings table
CREATE TABLE IF NOT EXISTS "notification_settings" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  "email_notifications" boolean DEFAULT true,
  "order_updates" boolean DEFAULT true,
  "marketing_emails" boolean DEFAULT false,
  "new_sales" boolean DEFAULT true,
  "low_stock_alerts" boolean DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Add appearance_settings table
CREATE TABLE IF NOT EXISTS "appearance_settings" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  "theme" text DEFAULT 'light',
  "reduced_animations" boolean DEFAULT false,
  "compact_mode" boolean DEFAULT false,
  "high_contrast_mode" boolean DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Create unique constraints for user_id in settings tables
ALTER TABLE "seller_settings" ADD CONSTRAINT "seller_settings_user_id_key" UNIQUE ("user_id");
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_key" UNIQUE ("user_id");
ALTER TABLE "appearance_settings" ADD CONSTRAINT "appearance_settings_user_id_key" UNIQUE ("user_id");

-- Add Row Level Security (RLS) policies
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "seller_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notification_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "appearance_settings" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create RLS policies for seller_settings
CREATE POLICY "Users can view their own seller settings" 
ON seller_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own seller settings" 
ON seller_settings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own seller settings" 
ON seller_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for notification_settings
CREATE POLICY "Users can view their own notification settings" 
ON notification_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" 
ON notification_settings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" 
ON notification_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for appearance_settings
CREATE POLICY "Users can view their own appearance settings" 
ON appearance_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own appearance settings" 
ON appearance_settings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appearance settings" 
ON appearance_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create default settings for existing users
INSERT INTO profiles (id, full_name, created_at, updated_at)
SELECT id, email, now(), now()
FROM auth.users
ON CONFLICT (id) DO NOTHING; 