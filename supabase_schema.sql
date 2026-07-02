-- Supabase Schema for Alfaruq Café

-- 1. Categories
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- 2. Menu Items
CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  available BOOLEAN DEFAULT true,
  is_extra BOOLEAN DEFAULT false,
  image_url TEXT
);

-- 3. Orders
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  table_number INTEGER NOT NULL,
  customer_name VARCHAR(255),
  customer_id UUID REFERENCES auth.users(id),
  note TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, preparing, ready, delivered, cancelled
  total_price DECIMAL(10, 2) NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Order Items
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  is_paid BOOLEAN DEFAULT false
);

-- 5. Events
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- open, closed, seminar, public_viewing, other
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(255) NOT NULL,
  description TEXT,
  max_participants INTEGER,
  registration_required BOOLEAN DEFAULT false
);

-- 6. Event Registrations
CREATE TABLE event_registrations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Bookings
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  package VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  guests INTEGER,
  purpose TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Profiles (for Auth roles)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role VARCHAR(50) DEFAULT 'staff', -- admin, staff
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Mock Data
INSERT INTO categories (name, sort_order) VALUES 
('Heißgetränke', 1),
('Tee', 2),
('Erfrischungsgetränke', 3),
('Snacks', 4);

-- Insert some mock menu items
INSERT INTO menu_items (category_id, name, description, price, available, is_extra) VALUES 
(1, 'Espresso', 'Klassischer italienischer Espresso', 2.50, true, false),
(1, 'Cappuccino', 'Espresso mit aufgeschäumter Milch', 3.20, true, false),
(2, 'Minz-Tee', 'Frischer Pfefferminztee', 2.50, true, false),
(3, 'Blue Wave', 'Blaue Limonade mit Minze', 3.99, true, false),
(4, 'Nachos & Dip', 'Knusprige Nachos mit Salsa', 4.50, true, false),
(4, 'Extra Sirup', 'Vanille, Karamell oder Haselnuss', 0.50, true, true);

-- Enable RLS (Row Level Security) - Basic setup for now
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow read access to all for categories, menu_items, events
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);

-- Scoped policies for orders: Customers see own, Staff/Admin/Cashier see all
CREATE POLICY "Customers read own orders" ON orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Staff/Admin/Cashier read all orders" ON orders FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin', 'cashier')));
CREATE POLICY "Insert own orders" ON orders FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Staff/Admin/Cashier update orders" ON orders FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin', 'cashier')));

-- Scoped policies for order_items
CREATE POLICY "Public insert order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Read order_items of own or staff/admin/cashier orders" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders o WHERE o.id = order_items.order_id
    AND (
      o.customer_id = auth.uid()
      OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin', 'cashier'))
    )
  )
);
CREATE POLICY "Staff/Admin/Cashier update order_items" ON order_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM orders o WHERE o.id = order_items.order_id
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin', 'cashier'))
  )
);

CREATE POLICY "Public insert event_registrations" ON event_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert bookings" ON bookings FOR INSERT WITH CHECK (true);

-- Allow full access for staff/admin on everything (needs auth integration)
-- (Simplification: you can add more strict RLS later, for now we will mostly rely on application logic for MVP)
