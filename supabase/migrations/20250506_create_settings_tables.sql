-- Add bio and phone fields to existing profiles table (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'bio'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN bio text;
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN phone text;
    END IF;
END
$$;

-- Create the seller_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.seller_settings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    store_name text,
    description text,
    contact_email text,
    support_phone text,
    address text,
    logo_url text,
    currency text DEFAULT 'USD',
    created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
    UNIQUE (user_id)
);

-- Create the notification_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    email_notifications boolean DEFAULT true,
    order_updates boolean DEFAULT true,
    marketing_emails boolean DEFAULT false,
    new_sales boolean DEFAULT true,
    low_stock_alerts boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
    UNIQUE (user_id)
);

-- Create the appearance_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.appearance_settings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    theme text DEFAULT 'light',
    reduced_animations boolean DEFAULT false,
    compact_mode boolean DEFAULT false,
    high_contrast_mode boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
    UNIQUE (user_id)
);

-- Add Row Level Security (RLS) to protect tables
ALTER TABLE public.seller_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appearance_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Seller Settings: users can only view, insert, and update their own settings
CREATE POLICY "Users can view their own seller settings" 
    ON public.seller_settings FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own seller settings" 
    ON public.seller_settings FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own seller settings" 
    ON public.seller_settings FOR UPDATE 
    USING (auth.uid() = user_id);

-- Notification Settings: users can only view, insert, and update their own settings
CREATE POLICY "Users can view their own notification settings" 
    ON public.notification_settings FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" 
    ON public.notification_settings FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" 
    ON public.notification_settings FOR UPDATE 
    USING (auth.uid() = user_id);

-- Appearance Settings: users can only view, insert, and update their own settings
CREATE POLICY "Users can view their own appearance settings" 
    ON public.appearance_settings FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appearance settings" 
    ON public.appearance_settings FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appearance settings" 
    ON public.appearance_settings FOR UPDATE 
    USING (auth.uid() = user_id); 