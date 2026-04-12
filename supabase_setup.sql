-- ==========================================
-- AXIS CAP: Supabase True Database Architecture
-- ==========================================

-- 1. Create the central Profiles table (No fake money, purely identity)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable absolute Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Access Policies for Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ( auth.uid() = id );
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR ALL USING ( (SELECT auth.jwt() ->> 'email') = 'arnavsgoyal@gmail.com' );

-- 4. Admin Access to Portfolios & Transactions
-- (Since your previous setup only allowed users to view their own portfolios, we must grant the Admin access to see everyone's assets)
DROP POLICY IF EXISTS "Admins can view all portfolios" ON user_portfolios;
CREATE POLICY "Admins can view all portfolios" ON user_portfolios FOR SELECT USING ( (SELECT auth.jwt() ->> 'email') = 'arnavsgoyal@gmail.com' );

DROP POLICY IF EXISTS "Admins can view all transactions" ON user_transactions;
CREATE POLICY "Admins can view all transactions" ON user_transactions FOR SELECT USING ( (SELECT auth.jwt() ->> 'email') = 'arnavsgoyal@gmail.com' );

-- 5. Create an Automated Database Trigger
-- Captures the user the exact second they sign up.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'user')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the automation trigger to the auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
