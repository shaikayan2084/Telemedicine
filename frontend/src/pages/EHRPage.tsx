import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel,
  Alert, CircularProgress, Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import { Add, ExpandMore, Lock } from '@mui/icons-material';
import { medicalRecordsAPI, patientsAPI } from '../services/api';
import useAuthStore from '../hooks/useAuthStore';
import NavLayout from '../components/shared/NavLayout';

const EHRPage: React.FC = () => {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    patient: '', diagnosis: '', symptoms: '', treatmentPlan: '',
    clinicalNotes: '', recordType: 'consultation',
    vitalSigns: { bloodPressure: '', heartRate: '', temperature: '', oxygenSaturation: '', weight: '', height: '' },
  });

  const fetchRecords = () => {
    if (!user) return;
    setLoading(true);
    const patientId = user.role === 'patient' ? user.id : form.patient;
    if (!patientId) { setLoading(false); return; }
    medicalRecordsAPI.getByPatient(patientId)
      .then((r) => setRecords(r.data.records || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRecords(); }, [user]);

  const handleCreate = async () => {
    setError('');
    try {
      await medicalRecordsAPI.create({
        ...form,
        patient: user?.role === 'patient' ? user.id : form.patient,
        vitalSigns: {
          ...form.vitalSigns,
          heartRate: form.vitalSigns.heartRate ? Number(form.vitalSigns.heartRate) : undefined,
          temperature: form.vitalSigns.temperature ? Number(form.vitalSigns.temperature) : undefined,
          weight: form.vitalSigns.weight ? Number(form.vitalSigns.weight) : undefined,
          height: form.vitalSigns.height ? Number(form.vitalSigns.height) : undefined,
        },
      });
      setSuccess('Medical record created');
      setCreateOpen(false);
      fetchRecords();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create record');
    }
  };

  return (
    <NavLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4">Electronic Health Records</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Lock sx={{ fontSize: 14, color: 'success.main' }} />
              <Typography variant="caption" color="success.main">All PHI encrypted with AES-256</Typography>
            </Box>
          </Box>
          {user?.role === 'doctor' && (
            <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
              New Record
            </Button>
          )}
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
        ) : records.length === 0 ? (
          <Card><CardContent><Typography color="text.secondary" align="center" sx={{ py: 4 }}>No medical records found.</Typography></CardContent></Card>
        ) : (
          records.map((record) => (
            <Accordion key={record._id} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Chip label={record.recordType} size="small" color="primary" variant="outlined" />
                  <Typography fontWeight={600}>{record.diagnosis}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                    {new Date(record.createdAt).toLocaleDateString('en-IN')}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    {record.symptoms && <Typography variant="body2"><strong>Symptoms:</strong> {record.symptoms}</Typography>}
                    {record.treatmentPlan && <Typography variant="body2" sx={{ mt: 1 }}><strong>Treatment:</strong> {record.treatmentPlan}</Typography>}
                    {record.clinicalNotes && <Typography variant="body2" sx={{ mt: 1 }}><strong>Notes:</strong> {record.clinicalNotes}</Typography>}
                    <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                      <strong>Doctor:</strong> Dr. {record.doctor?.firstName} {record.doctor?.lastName}
                    </Typography>
                  </Grid>
                  {record.vitalSigns && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Vital Signs</Typography>
                      {record.vitalSigns.bloodPressure && <Typography variant="body2">🩺 BP: {record.vitalSigns.bloodPressure}</Typography>}
                      {record.vitalSigns.heartRate && <Typography variant="body2">❤️ Heart Rate: {record.vitalSigns.heartRate} bpm</Typography>}
                      {record.vitalSigns.temperature && <Typography variant="body2">🌡️ Temp: {record.vitalSigns.temperature}°C</Typography>}
                      {record.vitalSigns.oxygenSaturation && <Typography variant="body2">💨 SpO2: {record.vitalSigns.oxygenSaturation}%</Typography>}
                      {record.vitalSigns.weight && <Typography variant="body2">⚖️ Weight: {record.vitalSigns.weight} kg</Typography>}
                    </Grid>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))
        )}

        {/* Create Record Dialog */}
        <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create Medical Record</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Patient ID" value={form.patient}
                  onChange={(e) => setForm({ ...form, patient: e.target.value })} required />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Record Type</InputLabel>
                  <Select value={form.recordType} label="Record Type"
                    onChange={(e) => setForm({ ...form, recordType: e.target.value })}>
                    {['consultation', 'lab_result', 'imaging', 'vaccination', 'surgery'].map((t) => (
                      <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Diagnosis" value={form.diagnosis}
                  onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} required />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={2} label="Symptoms" value={form.symptoms}
                  onChange={(e) => setForm({ ...form, symptoms: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={2} label="Treatment Plan" value={form.treatmentPlan}
                  onChange={(e) => setForm({ ...form, treatmentPlan: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={2} label="Clinical Notes" value={form.clinicalNotes}
                  onChange={(e) => setForm({ ...form, clinicalNotes: e.target.value })} />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField fullWidth label="Blood Pressure" placeholder="120/80"
                  value={form.vitalSigns.bloodPressure}
                  onChange={(e) => setForm({ ...form, vitalSigns: { ...form.vitalSigns, bloodPressure: e.target.value } })} />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField fullWidth label="Heart Rate (bpm)" type="number"
                  value={form.vitalSigns.heartRate}
                  onChange={(e) => setForm({ ...form, vitalSigns: { ...form.vitalSigns, heartRate: e.target.value } })} />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField fullWidth label="Temperature (°C)" type="number"
                  value={form.vitalSigns.temperature}
                  onChange={(e) => setForm({ ...form, vitalSigns: { ...form.vitalSigns, temperature: e.target.value } })} />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField fullWidth label="SpO2 (%)" type="number"
                  value={form.vitalSigns.oxygenSaturation}
                  onChange={(e) => setForm({ ...form, vitalSigns: { ...form.vitalSigns, oxygenSaturation: e.target.value } })} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreate}>Save Record</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </NavLayout>
  );
};

export default EHRPage;
