import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Missing Supabase Service Role Key" }, { status: 500 });
  }

  // Use service role to bypass RLS and Auth restrictions
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // 1. CLEAR EXISTING DATA
    await supabase.from("appointments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("patients").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    
    // 2. SEED DOCTORS
    const doctorData = [
      { email: "doctor1@meddash.com", name: "Arjun Sharma", specialty: "Cardiology" },
      { email: "doctor2@meddash.com", name: "Priya Nair", specialty: "Pediatrics" },
      { email: "doctor3@meddash.com", name: "Rajesh Kumar", specialty: "Orthopedics" },
      { email: "doctor4@meddash.com", name: "Sunita Reddy", specialty: "Neurology" },
      { email: "doctor5@meddash.com", name: "Vikram Mehta", specialty: "General Surgery" },
    ];

    const doctorIds = [];

    for (const doc of doctorData) {
      // Check if user exists
      let { data: existingUser } = await supabase.auth.admin.getUserById(doc.email).catch(() => ({ data: null })); // Quick hack, better to just try create and catch
      
      const { data: user, error } = await supabase.auth.admin.createUser({
        email: doc.email,
        password: "doctor123",
        email_confirm: true,
      });

      if (error && error.message.toLowerCase().includes("already")) {
        const { data: users } = await supabase.auth.admin.listUsers();
        const found = users.users.find(u => u.email === doc.email);
        if (found) {
           await supabase.auth.admin.updateUserById(found.id, { password: "doctor123" });
           doctorIds.push({ id: found.id, name: doc.name });
           
           // Force update profile
           await supabase.from("profiles").upsert({
             id: found.id,
             email: doc.email,
             full_name: doc.name,
             role: "doctor",
             is_approved: true,
             specialty: doc.specialty,
           });
        }
      } else if (user && user.user) {
        doctorIds.push({ id: user.user.id, name: doc.name });
        
        await supabase.from("profiles").upsert({
          id: user.user.id,
          email: doc.email,
          full_name: doc.name,
          role: "doctor",
          is_approved: true,
          specialty: doc.specialty,
        });
      }
    }

    // 3. SEED STAFF
    const staffData = [
      { email: "staff1@meddash.com", name: "Amit Patel" },
      { email: "staff2@meddash.com", name: "Neha Singh" },
      { email: "staff3@meddash.com", name: "Ravi Desai" },
    ];

    for (const staff of staffData) {
      const { data: user, error } = await supabase.auth.admin.createUser({
        email: staff.email,
        password: "staff123",
        email_confirm: true,
      });

      if (error && error.message.toLowerCase().includes("already")) {
        const { data: users } = await supabase.auth.admin.listUsers();
        const found = users.users.find(u => u.email === staff.email);
        if (found) {
           await supabase.auth.admin.updateUserById(found.id, { password: "staff123" });
           
           await supabase.from("profiles").upsert({
             id: found.id,
             email: staff.email,
             full_name: staff.name,
             role: "staff",
             is_approved: true,
           });
        }
      } else if (user && user.user) {
        await supabase.from("profiles").upsert({
          id: user.user.id,
          email: staff.email,
          full_name: staff.name,
          role: "staff",
          is_approved: true,
        });
      }
    }

    // 4. SEED PATIENTS
    const patientData = [
      { name: "Rahul Verma", age: 45, gender: "male", admission: "Outpatient" },
      { name: "Kavita Rao", age: 32, gender: "female", admission: "Inpatient (Room)" },
      { name: "Anand Gupta", age: 60, gender: "male", admission: "ICU" },
      { name: "Meera Krishnan", age: 28, gender: "female", admission: "Outpatient" },
      { name: "Suresh Pillai", age: 55, gender: "male", admission: "Emergency" },
      { name: "Pooja Das", age: 40, gender: "female", admission: "Inpatient (Room)" },
      { name: "Vikash Jain", age: 35, gender: "male", admission: "Outpatient" },
      { name: "Sneha Kapoor", age: 25, gender: "female", admission: "Outpatient" },
      { name: "Manoj Tiwari", age: 50, gender: "male", admission: "Inpatient (Room)" },
      { name: "Geeta Sen", age: 65, gender: "female", admission: "ICU" },
    ];

    const generatedPatients = [];
    
    for (let i = 0; i < patientData.length; i++) {
      const p = patientData[i];
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - p.age);
      
      const assignedDoc = doctorIds[Math.floor(Math.random() * doctorIds.length)];

      const { data } = await supabase.from("patients").insert({
        full_name: p.name,
        email: `patient${i+1}@example.com`,
        phone: `+91987654321${i}`,
        date_of_birth: dob.toISOString(),
        gender: p.gender,
        address: "Sample Address, City",
        medical_record_number: `MRN-${Math.floor(Math.random() * 90000) + 10000}`,
        status: p.admission === "ICU" ? "critical" : "active",
        admission_type: p.admission,
        assigned_doctor: `Dr. ${assignedDoc.name}`,
      }).select().single();
      
      if (data) {
        generatedPatients.push(data);
      }
    }

    // 5. SEED APPOINTMENTS
    // Generate 2-5 appointments daily from today until next week (7 days)
    for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + dayOffset);
      
      const numAppointments = Math.floor(Math.random() * 4) + 2; // 2 to 5 appointments
      
      for (let i = 0; i < numAppointments; i++) {
        const p = generatedPatients[Math.floor(Math.random() * generatedPatients.length)];
        const d = doctorIds[Math.floor(Math.random() * doctorIds.length)];
        
        // Random start time between 9:00 and 16:00
        const startHour = 9 + Math.floor(Math.random() * 8);
        const startTimeStr = `${startHour.toString().padStart(2, '0')}:00:00`;
        const endHour = startHour + 1;
        const endTimeStr = `${endHour.toString().padStart(2, '0')}:00:00`;
        
        // Date formatting: YYYY-MM-DD
        const dateStr = targetDate.toISOString().split('T')[0];

        const statuses = ["scheduled", "completed", "cancelled", "no-show"];
        const status = dayOffset < 0 ? statuses[Math.floor(Math.random() * 3) + 1] : "scheduled";

        const { error: insertError } = await supabase.from("appointments").insert({
          patient_id: p.id,
          provider_name: `Dr. ${d.name}`,
          appointment_date: dateStr,
          start_time: startTimeStr,
          end_time: endTimeStr,
          status: status,
          type: p.admission_type === "Outpatient" ? "checkup" : "follow-up",
          notes: "Auto-generated seeded appointment.",
        });
        if (insertError) {
          console.error("Appointment Insert Error:", insertError);
          throw new Error(insertError.message);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Database seeded successfully!" });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
