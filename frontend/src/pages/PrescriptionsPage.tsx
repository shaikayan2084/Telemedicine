import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, CircularProgress, IconButton, Divider,
} from '@mui/material';
import { Add, Download, DeleteOutline } from '@mui/icons-material';
import { prescriptionsAPI } from '../services/api';
import useAuthStore from '../hooks/useAuthStore';
import NavLayout from '../components/shared/NavLayout';

const emptyMed = { name: '', dosage: '', frequency: '', duration: '', route: 'oral', instructions: '' };

const PrescriptionsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    patientId: '', diagnosis: '', notes: '', medications: [{ ...emptyMed }],
  });

  useEffect(() => {
    prescriptionsAPI.getAll()
      .then((r) => setPrescriptions(r.data.prescriptions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addMedication = () => setForm({ ...form, medications: [...form.medications, { ...emptyMed }] });
  const removeMedication = (i: number) => setForm({ ...form, medications: form.medications.filter((_, idx) => idx !== i) });
  const updateMed = (i: number, field: string, value: string) => {
    const meds = [...form.medications];
    meds[i] = { ...meds[i], [field]: value };
    setForm({ ...form, medications: meds });
  };

  const handleCreate = async () => {
    setError('');
    try {
      await prescriptionsAPI.create(form);
      setSuccess('Prescription issued successfully');
      setCreateOpen(false);
      const r = await prescriptionsAPI.getAll();
      setPrescriptions(r.data.prescriptions || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create prescription');
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const r = await prescriptionsAPI.downloadPDF(id);
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download PDF');
    }
  };

  return (
    <NavLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Prescriptions</Typography>
          {user?.role === 'doctor' && (
            <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
              Issue Prescription
            </Button>
          )}
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
        ) : prescriptions.length === 0 ? (
          <Card><CardContent><Typography color="text.secondary" align="center" sx={{ py: 4 }}>No prescriptions found.</Typography></CardContent></Card>
        ) : (
          <Grid container spacing={2}>
            {prescriptions.map((p) => (
              <Grid item xs={12} md={6} key={p._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography fontWeight={700}>{p.diagnosis}</Typography>
                      <Chip label={p.isRevoked ? 'Revoked' : 'Active'} size="small"
                        color={p.isRevoked ? 'error' : 'success'} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Issued: {new Date(p.issuedAt).toLocaleDateString('en-IN')} | Expires: {new Date(p.expiresAt).toLocaleDateString('en-IN')}
                    </Typography>
                    <Divider sx={{ my: 1.5 }} />
                    {p.medications.map((m: any, i: number) => (
                      <Box key={i} sx={{ mb: 0.5 }}>
                        <Typography variant="body2">
                          💊 <strong>{m.name}</strong> {m.dosage} — {m.frequency} for {m.duration}
                        </Typography>
                      </Box>
                    ))}
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button size="small" variant="outlined" startIcon={<Download />}
                        onClick={() => handleDownload(p._id)}>
                        Download PDF
                      </Button>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      🔒 Hash: {p.integrityHash?.slice(0, 20)}...
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Create Dialog */}
        <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Issue Prescription</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField fullWidth label="Patient ID" sx={{ mb: 2 }} value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })} />
            <TextField fullWidth label="Diagnosis" sx={{ mb: 2 }} value={form.diagnosis}
              onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />

            <Typography fontWeight={600} sx={{ mb: 1 }}>Medications</Typography>
            {form.medications.map((med, i) => (
              <Box key={i} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>Medication {i + 1}</Typography>
                  {form.medications.length > 1 && (
                    <IconButton size="small" onClick={() => removeMedication(i)}><DeleteOutline fontSize="small" /></IconButton>
                  )}
                </Box>
                <Grid container spacing={1}>
                  <Grid item xs={6}><TextField fullWidth size="small" label="Drug Name" value={med.name} onChange={(e) => updateMed(i, 'name', e.target.value)} /></Grid>
                  <Grid item xs={6}><TextField fullWidth size="small" label="Dosage" value={med.dosage} onChange={(e) => updateMed(i, 'dosage', e.target.value)} /></Grid>
                  <Grid item xs={6}><TextField fullWidth size="small" label="Frequency" value={med.frequency} onChange={(e) => updateMed(i, 'frequency', e.target.value)} /></Grid>
                  <Grid item xs={6}><TextField fullWidth size="small" label="Duration" value={med.duration} onChange={(e) => updateMed(i, 'duration', e.target.value)} /></Grid>
                  <Grid item xs={12}><TextField fullWidth size="small" label="Instructions" value={med.instructions} onChange={(e) => updateMed(i, 'instructions', e.target.value)} /></Grid>
                </Grid>
              </Box>
            ))}
            <Button startIcon={<Add />} onClick={addMedication} size="small">Add Medication</Button>

            <TextField fullWidth multiline rows={2} label="Additional Notes" sx={{ mt: 2 }}
              value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreate}>Issue Prescription</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </NavLayout>
  );
};

export default PrescriptionsPage;
