-- Create time slots table for weekly availability
CREATE TABLE public.time_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(slot_date, start_time)
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  course TEXT NOT NULL,
  message TEXT,
  slot_id UUID REFERENCES public.time_slots(id),
  status TEXT NOT NULL DEFAULT 'BOOKED',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Public read access for available slots
CREATE POLICY "Anyone can view available slots" 
ON public.time_slots 
FOR SELECT 
USING (is_available = true);

-- Public insert for bookings (validated by edge function)
CREATE POLICY "Anyone can create bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (true);

-- Public read for own bookings by email
CREATE POLICY "Anyone can view bookings" 
ON public.bookings 
FOR SELECT 
USING (true);

-- Function to update slot availability
CREATE OR REPLACE FUNCTION public.book_slot(
  p_slot_id UUID,
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_course TEXT,
  p_message TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id UUID;
  v_slot_available BOOLEAN;
BEGIN
  -- Lock the slot row to prevent race conditions
  SELECT is_available INTO v_slot_available
  FROM time_slots
  WHERE id = p_slot_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot not found';
  END IF;
  
  IF NOT v_slot_available THEN
    RAISE EXCEPTION 'Slot is no longer available';
  END IF;
  
  -- Mark slot as unavailable
  UPDATE time_slots SET is_available = false WHERE id = p_slot_id;
  
  -- Create booking
  INSERT INTO bookings (name, email, phone, course, message, slot_id, status)
  VALUES (p_name, p_email, p_phone, p_course, p_message, p_slot_id, 'BOOKED')
  RETURNING id INTO v_booking_id;
  
  RETURN v_booking_id;
END;
$$;

-- Function to generate weekly slots
CREATE OR REPLACE FUNCTION public.generate_weekly_slots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date DATE;
  v_hour INTEGER;
BEGIN
  -- Generate slots for the next 7 days
  FOR i IN 0..6 LOOP
    v_date := CURRENT_DATE + i;
    -- Create 4 slots per day (12 PM, 2 PM, 4 PM, 6 PM)
    FOR v_hour IN 12..18 BY 2 LOOP
      INSERT INTO time_slots (slot_date, start_time, end_time)
      VALUES (v_date, (v_hour || ':00')::TIME, ((v_hour + 1) || ':00')::TIME)
      ON CONFLICT (slot_date, start_time) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;

-- Generate initial slots
SELECT public.generate_weekly_slots();