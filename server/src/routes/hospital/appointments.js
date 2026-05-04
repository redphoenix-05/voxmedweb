import { Router } from 'express';
import { supabaseAdmin } from '../../lib/supabase.js';
import { authenticate, authorize, attachHospital } from '../../middleware/auth.js';

const router = Router();
router.use(authenticate, authorize('hospital_admin'), attachHospital);

// Get all appointments for hospital
router.get('/', async (req, res) => {
  try {
    const { doctor_id, date, status, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('appointments')
      .select(`
        *,
        profiles!patient_id(full_name, email, phone),
        doctors!doctor_id(id, profile_id, profiles!profile_id(full_name))
      `, { count: 'exact' })
      .eq('hospital_id', req.hospitalId)
      .order('scheduled_start_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (doctor_id) query = query.eq('doctor_id', doctor_id);
    if (date) query = query.gte('scheduled_start_at', `${date}T00:00:00`).lt('scheduled_start_at', `${date}T23:59:59`);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json({ appointments: data, total: count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Update appointment status
router.patch('/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (notes) updates.notes = notes;

    // Fetch appointment with patient + doctor profile info before updating
    const { data: appt, error: fetchErr } = await supabaseAdmin
      .from('appointments')
      .select(`
        id, patient_id, doctor_id, scheduled_start_at,
        doctors!doctor_id(id, profile_id, profiles!profile_id(full_name)),
        profiles!patient_id(full_name)
      `)
      .eq('id', req.params.id)
      .eq('hospital_id', req.hospitalId)
      .single();
    if (fetchErr) return res.status(400).json({ error: fetchErr.message });

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update(updates)
      .eq('id', req.params.id)
      .eq('hospital_id', req.hospitalId)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });

    // Send notifications on terminal status changes
    if (status === 'completed' || status === 'cancelled') {
      const doctorName = appt.doctors?.profiles?.full_name ?? 'your doctor';
      const patientName = appt.profiles?.full_name ?? 'the patient';
      const apptDate = appt.scheduled_start_at
        ? new Date(appt.scheduled_start_at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
          })
        : 'scheduled date';

      const isCompleted = status === 'completed';
      const notifications = [];

      // Notification for patient
      notifications.push({
        user_id: appt.patient_id,
        type: isCompleted ? 'appointment_completed' : 'appointment_cancelled',
        title: isCompleted ? 'Appointment Completed' : 'Appointment Cancelled',
        body: isCompleted
          ? `Your appointment with Dr. ${doctorName} on ${apptDate} has been marked as completed.`
          : `Your appointment with Dr. ${doctorName} on ${apptDate} has been cancelled.`,
        data: { route: '/appointments', entity_id: appt.id },
        is_read: false,
      });

      // Notification for doctor (doctor's auth profile_id)
      if (appt.doctors?.profile_id) {
        notifications.push({
          user_id: appt.doctors.profile_id,
          type: isCompleted ? 'appointment_completed' : 'appointment_cancelled',
          title: isCompleted ? 'Appointment Completed' : 'Appointment Cancelled',
          body: isCompleted
            ? `Appointment with patient ${patientName} on ${apptDate} has been marked as completed.`
            : `Appointment with patient ${patientName} on ${apptDate} has been cancelled.`,
          data: { route: '/appointments', entity_id: appt.id },
          is_read: false,
        });
      }

      await supabaseAdmin.from('notifications').insert(notifications);
    }

    res.json({ appointment: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

export default router;
