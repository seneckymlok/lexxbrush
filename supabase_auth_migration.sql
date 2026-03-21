-- 1. Alter the 'orders' table to link to Auth users
ALTER TABLE orders 
ADD COLUMN user_id UUID REFERENCES auth.users(id) NULL;

-- 2. Create the 'carts' table for synchronization
CREATE TABLE carts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Set up Row Level Security (RLS) for carts
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own cart
CREATE POLICY "Users can view their own cart"
ON carts FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to update their own cart
CREATE POLICY "Users can update their own cart"
ON carts FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to insert their own cart
CREATE POLICY "Users can insert their own cart"
ON carts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own cart
CREATE POLICY "Users can delete their own cart"
ON carts FOR DELETE
USING (auth.uid() = user_id);

-- 4. Update RLS for orders (if RLS is enabled on orders)
-- Allow users to view their own orders
CREATE POLICY "Users can view their own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);
