-- ============================================
-- English Academy - PostgreSQL Database Schema
-- ============================================
-- This file sets up the local PostgreSQL database
-- Run with: psql -d english_academy -f supabase/local-schema.sql
-- ============================================

-- Create database (run separately if needed)
-- CREATE DATABASE english_academy;

-- ============================================
-- TABLES
-- ============================================

-- Time Slots Table
CREATE TABLE IF NOT EXISTS time_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(slot_date, start_time)
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    course TEXT NOT NULL,
    message TEXT,
    slot_id UUID REFERENCES time_slots(id),
    status TEXT NOT NULL DEFAULT 'BOOKED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Test Attempts Table
CREATE TABLE IF NOT EXISTS test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_type TEXT NOT NULL,
    user_name TEXT,
    user_email TEXT,
    answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    score_percentage NUMERIC,
    cefr_level TEXT,
    recommended_course TEXT,
    ai_evaluation JSONB,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_time_slots_date ON time_slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_time_slots_available ON time_slots(is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_test_attempts_email ON test_attempts(user_email);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to book a slot atomically
CREATE OR REPLACE FUNCTION book_slot(
    p_course TEXT,
    p_email TEXT,
    p_message TEXT,
    p_name TEXT,
    p_phone TEXT,
    p_slot_id UUID
) RETURNS UUID AS $$
DECLARE
    v_booking_id UUID;
    v_slot_available BOOLEAN;
BEGIN
    -- Check if slot is available
    SELECT is_available INTO v_slot_available
    FROM time_slots
    WHERE id = p_slot_id
    FOR UPDATE;

    IF v_slot_available IS NULL THEN
        RAISE EXCEPTION 'Slot not found';
    END IF;

    IF NOT v_slot_available THEN
        RAISE EXCEPTION 'Slot is no longer available';
    END IF;

    -- Mark slot as unavailable
    UPDATE time_slots
    SET is_available = false
    WHERE id = p_slot_id;

    -- Create booking
    INSERT INTO bookings (name, phone, email, course, message, slot_id, status)
    VALUES (p_name, p_phone, p_email, p_course, p_message, p_slot_id, 'BOOKED')
    RETURNING id INTO v_booking_id;

    RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate weekly time slots
CREATE OR REPLACE FUNCTION generate_weekly_slots() RETURNS void AS $$
DECLARE
    v_date DATE;
    v_start_time TIME;
    v_times TIME[] := ARRAY['09:00'::TIME, '10:00'::TIME, '11:00'::TIME, 
                            '14:00'::TIME, '15:00'::TIME, '16:00'::TIME, '17:00'::TIME];
    v_time TIME;
BEGIN
    -- Generate slots for the next 14 days
    FOR i IN 0..13 LOOP
        v_date := CURRENT_DATE + i;
        
        -- Skip Sundays (0 = Sunday in PostgreSQL)
        IF EXTRACT(DOW FROM v_date) = 0 THEN
            CONTINUE;
        END IF;

        FOREACH v_time IN ARRAY v_times LOOP
            INSERT INTO time_slots (slot_date, start_time, end_time, is_available)
            VALUES (v_date, v_time, v_time + INTERVAL '1 hour', true)
            ON CONFLICT (slot_date, start_time) DO NOTHING;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA
-- ============================================

-- Generate initial time slots
SELECT generate_weekly_slots();

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify tables were created
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup complete!';
    RAISE NOTICE 'Tables created: time_slots, bookings, test_attempts';
    RAISE NOTICE 'Functions created: book_slot, generate_weekly_slots';
END $$;
