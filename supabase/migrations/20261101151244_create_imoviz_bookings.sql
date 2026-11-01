/*
# Create iMoviz bookings table

1. New Tables
- `bookings`
- `id` (uuid, primary key): unique booking identifier.
- `user_id` (uuid): signed-in customer who owns the booking.
- `movie_title` (text): film booked.
- `show_date` (date): screening date.
- `show_time` (text): screening start time.
- `seats` (jsonb): selected seat labels.
- `snacks` (jsonb): optional concession items and quantities.
- `total` (numeric): total booking price.
- `status` (text): booking status, defaulting to confirmed.
- `created_at` (timestamptz): time the booking was created.

2. Security
- Enable row level security on `bookings`.
- Grant authenticated users CRUD access to their own bookings only.
- Add separate policies for select, insert, update, and delete ownership checks.

3. Important Notes
- Bookings are scoped to the authenticated customer through `auth.uid()`.
- The browser does not need to provide `user_id`; the database fills it from the active session.
*/

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_title text NOT NULL,
  show_date date NOT NULL,
  show_time text NOT NULL,
  seats jsonb NOT NULL DEFAULT '[]'::jsonb,
  snacks jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
CREATE POLICY "Users can create own bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can update own bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bookings" ON public.bookings;
CREATE POLICY "Users can delete own bookings"
  ON public.bookings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
