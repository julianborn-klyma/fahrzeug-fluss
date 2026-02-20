import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date().toISOString().split("T")[0];

    // Find recurring jobs where next_due_date <= today
    const { data: dueJobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, title, order_type_id, next_due_date, recurrence_interval")
      .eq("is_recurring", true)
      .lte("next_due_date", today);

    if (jobsError) throw jobsError;

    const results: string[] = [];

    for (const job of dueJobs || []) {
      // Check if there's already an appointment created for this due date (avoid duplicates)
      const { data: existingAppts } = await supabase
        .from("job_appointments")
        .select("id")
        .eq("job_id", job.id)
        .eq("status", "neu")
        .gte("created_at", today + "T00:00:00Z");

      if (existingAppts && existingAppts.length > 0) {
        continue; // Already created today
      }

      // Get the first appointment type from the order type
      let appointmentTypeId: string | null = null;
      if (job.order_type_id) {
        const { data: otApptTypes } = await supabase
          .from("order_type_appointment_types")
          .select("appointment_type_id")
          .eq("order_type_id", job.order_type_id)
          .order("display_order")
          .limit(1);

        if (otApptTypes && otApptTypes.length > 0) {
          appointmentTypeId = otApptTypes[0].appointment_type_id;
        }
      }

      // Fallback: get any active appointment type
      if (!appointmentTypeId) {
        const { data: anyApptType } = await supabase
          .from("appointment_types")
          .select("id")
          .eq("is_active", true)
          .limit(1);
        if (anyApptType && anyApptType.length > 0) {
          appointmentTypeId = anyApptType[0].id;
        }
      }

      if (!appointmentTypeId) continue;

      // Create a draft appointment
      const { error: insertError } = await supabase
        .from("job_appointments")
        .insert({
          job_id: job.id,
          appointment_type_id: appointmentTypeId,
          status: "neu",
          notes: `Automatisch erstellt – Wiederkehrender Termin fällig am ${new Date(job.next_due_date!).toLocaleDateString("de-DE")}`,
        });

      if (insertError) {
        console.error(`Error creating appointment for job ${job.id}:`, insertError);
        continue;
      }

      // Calculate next due date
      const currentDue = new Date(job.next_due_date!);
      let nextDue: Date;
      switch (job.recurrence_interval) {
        case "monthly":
          nextDue = new Date(currentDue);
          nextDue.setMonth(nextDue.getMonth() + 1);
          break;
        case "yearly":
          nextDue = new Date(currentDue);
          nextDue.setFullYear(nextDue.getFullYear() + 1);
          break;
        case "biennial":
          nextDue = new Date(currentDue);
          nextDue.setFullYear(nextDue.getFullYear() + 2);
          break;
        default:
          nextDue = new Date(currentDue);
          nextDue.setFullYear(nextDue.getFullYear() + 1);
      }

      // Update next_due_date
      await supabase
        .from("jobs")
        .update({ next_due_date: nextDue.toISOString().split("T")[0] })
        .eq("id", job.id);

      results.push(`Job ${job.title} (${job.id}): Termin erstellt, nächste Fälligkeit ${nextDue.toISOString().split("T")[0]}`);
    }

    return new Response(
      JSON.stringify({ processed: results.length, details: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
