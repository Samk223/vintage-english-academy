import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingRequest {
  name: string;
  email: string;
  phone: string;
  course: string;
  message?: string;
  slotId: string;
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s+\-()]{10,}$/;
  return phoneRegex.test(phone);
};

const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 100;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === "GET") {
      // Fetch available slots
      const { data: slots, error } = await supabase
        .from("time_slots")
        .select("*")
        .eq("is_available", true)
        .gte("slot_date", new Date().toISOString().split("T")[0])
        .order("slot_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching slots:", error);
        throw error;
      }

      return new Response(JSON.stringify({ slots }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (req.method === "POST") {
      const body: BookingRequest = await req.json();
      const { name, email, phone, course, message, slotId } = body;

      console.log("Booking request received:", { name, email, phone, course, slotId });

      // Validate inputs
      if (!validateName(name)) {
        return new Response(
          JSON.stringify({ error: "Invalid name. Must be 2-100 characters." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!validateEmail(email)) {
        return new Response(
          JSON.stringify({ error: "Invalid email address." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!validatePhone(phone)) {
        return new Response(
          JSON.stringify({ error: "Invalid phone number. Must be at least 10 digits." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!course) {
        return new Response(
          JSON.stringify({ error: "Please select a course." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!slotId) {
        return new Response(
          JSON.stringify({ error: "Please select a time slot." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check 24-hour restriction
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentBooking, error: checkError } = await supabase
        .from("bookings")
        .select("id, created_at")
        .eq("email", email.toLowerCase().trim())
        .gte("created_at", twentyFourHoursAgo)
        .limit(1);

      if (checkError) {
        console.error("Error checking recent bookings:", checkError);
        throw checkError;
      }

      if (recentBooking && recentBooking.length > 0) {
        const lastBookingTime = new Date(recentBooking[0].created_at);
        const nextAvailable = new Date(lastBookingTime.getTime() + 24 * 60 * 60 * 1000);
        return new Response(
          JSON.stringify({ 
            error: `You have already booked a trial within the last 24 hours. You can book again after ${nextAvailable.toLocaleString()}.`,
            canBookAgain: false,
            nextAvailableTime: nextAvailable.toISOString()
          }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Use the transaction-safe book_slot function
      const { data: bookingId, error: bookingError } = await supabase
        .rpc("book_slot", {
          p_slot_id: slotId,
          p_name: name.trim(),
          p_email: email.toLowerCase().trim(),
          p_phone: phone.trim(),
          p_course: course,
          p_message: message?.trim() || null,
        });

      if (bookingError) {
        console.error("Booking error:", bookingError);
        if (bookingError.message.includes("no longer available")) {
          return new Response(
            JSON.stringify({ error: "This slot is no longer available. Please select another time." }),
            { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        throw bookingError;
      }

      // Fetch the slot details for confirmation
      const { data: slotDetails } = await supabase
        .from("time_slots")
        .select("slot_date, start_time, end_time")
        .eq("id", slotId)
        .single();

      console.log("Booking successful:", bookingId);

      return new Response(
        JSON.stringify({
          success: true,
          bookingId,
          message: "Your free trial has been booked successfully!",
          slot: slotDetails,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in book-trial function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
