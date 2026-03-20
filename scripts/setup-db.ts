// Run this script to set up the Supabase database tables
// Usage: npx tsx scripts/setup-db.ts

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setup() {
  console.log("Setting up database tables...\n");

  // Create products table
  const { error: productsError } = await supabase.rpc("exec_sql", {
    sql: `
      CREATE TABLE IF NOT EXISTS products (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        slug text UNIQUE NOT NULL,
        name_en text NOT NULL,
        name_sk text NOT NULL,
        description_en text NOT NULL DEFAULT '',
        description_sk text NOT NULL DEFAULT '',
        price integer NOT NULL,
        images text[] NOT NULL DEFAULT '{}',
        category text NOT NULL DEFAULT 'tees',
        sizes text[] DEFAULT NULL,
        is_one_of_a_kind boolean NOT NULL DEFAULT true,
        is_sold boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `,
  });

  if (productsError) {
    console.log("Note: products table may already exist or exec_sql not available.");
    console.log("Please create tables manually in the Supabase SQL editor.");
    console.log("Error:", productsError.message);
  } else {
    console.log("✓ Products table created");
  }

  // Create orders table
  const { error: ordersError } = await supabase.rpc("exec_sql", {
    sql: `
      CREATE TABLE IF NOT EXISTS orders (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        stripe_session_id text,
        stripe_payment_intent text,
        customer_email text,
        items jsonb NOT NULL DEFAULT '[]',
        total integer NOT NULL DEFAULT 0,
        status text NOT NULL DEFAULT 'pending',
        shipping_address jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `,
  });

  if (ordersError) {
    console.log("Note: orders table error:", ordersError.message);
  } else {
    console.log("✓ Orders table created");
  }

  // Create custom_orders table
  const { error: customOrdersError } = await supabase.rpc("exec_sql", {
    sql: `
      CREATE TABLE IF NOT EXISTS custom_orders (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        name text NOT NULL,
        email text NOT NULL,
        garment text NOT NULL DEFAULT '',
        description text NOT NULL DEFAULT '',
        budget text DEFAULT '',
        status text NOT NULL DEFAULT 'new',
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `,
  });

  if (customOrdersError) {
    console.log("Note: custom_orders table error:", customOrdersError.message);
  } else {
    console.log("✓ Custom orders table created");
  }

  console.log("\nDone! If any errors occurred above, use the SQL below in the Supabase SQL editor.\n");

  // Print the SQL for manual execution
  console.log(`
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/nfvocdkvtaittmvbmaoq/sql)

CREATE TABLE IF NOT EXISTS products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name_en text NOT NULL,
  name_sk text NOT NULL,
  description_en text NOT NULL DEFAULT '',
  description_sk text NOT NULL DEFAULT '',
  price integer NOT NULL,
  images text[] NOT NULL DEFAULT '{}',
  category text NOT NULL DEFAULT 'tees',
  sizes text[] DEFAULT NULL,
  is_one_of_a_kind boolean NOT NULL DEFAULT true,
  is_sold boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id text,
  stripe_payment_intent text,
  customer_email text,
  items jsonb NOT NULL DEFAULT '[]',
  total integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  shipping_address jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  garment text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  budget text DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;

-- Public read for products
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);

-- Service role has full access (admin panel uses service role key)
-- No additional policies needed — service role bypasses RLS

-- Allow anonymous inserts for custom orders (from the public form)
CREATE POLICY "Anyone can submit custom orders" ON custom_orders FOR INSERT WITH CHECK (true);
  `);
}

setup();
