import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

// Validation helpers
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone: string) => /^[0-9]{10,15}$/.test(phone.replace(/[\s-]/g, ''));
const validateName = (name: string) => name.length >= 2 && name.length <= 100;

// GET /api/book-trial - Fetch available time slots
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, slot_date, start_time, end_time, is_available
      FROM time_slots
      WHERE is_available = true
        AND slot_date >= CURRENT_DATE
      ORDER BY slot_date, start_time
      LIMIT 50
    `);

    res.json({ slots: result.rows });
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

// POST /api/book-trial - Create a booking
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, phone, email, course, message, slotId } = req.body;

    // Validate required fields
    if (!name || !phone || !email || !course || !slotId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!validateName(name)) {
      return res.status(400).json({ error: 'Invalid name (2-100 characters required)' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({ error: 'Invalid phone number (10-15 digits required)' });
    }

    // Check for recent bookings (rate limiting - 1 booking per email per 24 hours)
    const recentBooking = await pool.query(`
      SELECT id FROM bookings
      WHERE email = $1
        AND created_at > NOW() - INTERVAL '24 hours'
      LIMIT 1
    `, [email]);

    if (recentBooking.rows.length > 0) {
      return res.status(429).json({ 
        error: 'You have already booked a trial class in the last 24 hours. Please try again later.' 
      });
    }

    // Use the book_slot function for atomic booking
    const result = await pool.query(`
      SELECT book_slot($1, $2, $3, $4, $5, $6) as booking_id
    `, [course, email, message || '', name, phone, slotId]);

    const bookingId = result.rows[0]?.booking_id;

    if (!bookingId) {
      return res.status(400).json({ error: 'Failed to create booking. Slot may no longer be available.' });
    }

    // Fetch the booking details
    const booking = await pool.query(`
      SELECT b.*, ts.slot_date, ts.start_time, ts.end_time
      FROM bookings b
      LEFT JOIN time_slots ts ON b.slot_id = ts.id
      WHERE b.id = $1
    `, [bookingId]);

    res.status(201).json({
      success: true,
      message: 'Trial class booked successfully!',
      booking: booking.rows[0],
    });

  } catch (error) {
    console.error('Booking error:', error);
    
    // Handle specific PostgreSQL errors
    if (error instanceof Error && error.message.includes('Slot is no longer available')) {
      return res.status(400).json({ error: 'This time slot is no longer available. Please select another.' });
    }

    res.status(500).json({ error: 'Failed to create booking' });
  }
});

export default router;
