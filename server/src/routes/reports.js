import { Router } from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../lib/supabase.js';
import { authenticate, authorize, attachHospital } from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate, authorize('lab_staff', 'hospital_admin'), attachHospital);

// Upload report
router.post('/upload', upload.single('report'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { patient_id, record_id } = req.body;
    if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });

    const fileName = `${req.hospitalId}/${patient_id}/${Date.now()}-${req.file.originalname}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('reports')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) return res.status(400).json({ error: uploadError.message });

    const { data: { publicUrl } } = supabaseAdmin.storage.from('reports').getPublicUrl(fileName);

    // Update medical record if record_id provided
    if (record_id) {
      await supabaseAdmin
        .from('medical_records')
        .update({ report_url: publicUrl, report_name: req.file.originalname })
        .eq('id', record_id);
    } else {
      // Create new record
      await supabaseAdmin.from('medical_records').insert({
        patient_id,
        hospital_id: req.hospitalId,
        report_url: publicUrl,
        report_name: req.file.originalname,
        uploaded_by: req.user.id,
      });
    }

    res.json({ url: publicUrl, message: 'Report uploaded successfully' });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload report' });
  }
});

export default router;
