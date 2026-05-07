import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel,
  Alert, CircularProgress, Avatar, Divider,
} from '@mui/material';
import { Add, VideoCall, Cancel, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { appointmentsAPI, doctorsAPI } from '../services/api';
import useAuthStore from '../hooks/useAuthStore';
import NavLayout from '../components/shared/NavLayout';

const statusColor: Record<string, any> = {
  pending: 'warning', confirmed: 'success', cancelled: 'error',
  completed: 'default', no_show: 'error',
};

const AppointmentsPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookOpen, setBookOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    doctor: '', startTime: '', endTime: '',
    chiefComplaint: '', consultationType: 'video',
  });

  const fetchAppointments = () => {
    setLoading(true);
    appointmentsAPI.getAll()
      .then((r) => setAppointments(r.data.appointments || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
    if (user?.role === 'patient') {
      doctorsAPI.getAll().then((r) => setDoctors(r.data.doctors || []));
    }
  }, []);

  const handleBook = async () => {
    setError('');
    try {
      await appointmentsAPI.book(form);
      setSuccess('Appointment booked successfully!');
      setBookOpen(false);
      fetchAppointments();
      setForm({ doctor: '', startTime: '', endTime: '', chiefComplaint: '', consultationType: 'video' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Booking failed');
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await appointmentsAPI.updateStatus(id, { status });
      fetchAppointments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <NavLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Appointments</Typography>
          {user?.role === 'patient' && (
            <Button variant="contained" startIcon={<Add />} onClick={() => setBookOpen(true)}>
              Book Appointment
            </Button>
          )}
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
        ) : appointments.length === 0 ? (
          <Card><CardContent><Typography color="text.secondary" align="center" sx={{ py: 4 }}>No appointments found.</Typography></CardContent></Card>
        ) : (
          <Grid container spacing={2}>
            {appointments.map((appt) => {
              const other = user?.role === 'patient' ? appt.doctor : appt.patient;
              const name = other ? `${other.firstName} ${other.lastName}` : 'Unknown';
              const isUpcoming = new Date(appt.startTime) > new Date();
              return (
                <Grid item xs={12} md={6} key={appt._id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 16 }}>
                            {name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography fontWeight={600}>{name}</Typography>
                            {user?.role === 'patient' && other?.specialty && (
                              <Typography variant="caption" color="text.secondary">{other.specialty}</Typography>
                            )}
                          </Box>
                        </Box>
                        <Chip label={appt.status} color={statusColor[appt.status]} size="small" />
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        📅 {new Date(appt.startTime).toLocaleString('en-IN')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ⏱ {new Date(appt.endTime).toLocaleString('en-IN')}
                      </Typography>
                      {appt.chiefComplaint && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          🩺 {appt.chiefComplaint}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                        {appt.consultationType === 'video' && appt.status === 'confirmed' && isUpcoming && (
                          <Button size="small" variant="contained" startIcon={<VideoCall />}
                            onClick={() => navigate(`/room/${appt._id}`)}>
                            Join Call
                          </Button>
                        )}
                        {user?.role === 'doctor' && appt.status === 'pending' && (
                          <Button size="small" variant="outlined" color="success" startIcon={<CheckCircle />}
                            onClick={() => handleStatusUpdate(appt._id, 'confirmed')}>
                            Confirm
                          </Button>
                        )}
                        {isUpcoming && appt.status !== 'cancelled' && (
                          <Button size="small" variant="outlined" color="error" startIcon={<Cancel />}
                            onClick={() => handleStatusUpdate(appt._id, 'cancelled')}>
                            Cancel
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Book Dialog */}
        <Dialog open={bookOpen} onClose={() => setBookOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Book New Appointment</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <FormControl fullWidth>
              <InputLabel>Select Doctor</InputLabel>
              <Select value={form.doctor} label="Select Doctor"
                onChange={(e) => setForm({ ...form, doctor: e.target.value })}>
                {doctors.map((d) => (
                  <MenuItem key={d._id} value={d._id}>
                    Dr. {d.firstName} {d.lastName} — {d.specialty}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Start Time" type="datetime-local" value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="End Time" type="datetime-local" value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              InputLabelProps={{ shrink: true }} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select value={form.consultationType} label="Type"
                onChange={(e) => setForm({ ...form, consultationType: e.target.value })}>
                <MenuItem value="video">Video Consultation</MenuItem>
                <MenuItem value="in_person">In Person</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Chief Complaint" multiline rows={3} value={form.chiefComplaint}
              onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })} fullWidth />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setBookOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleBook}>Confirm Booking</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </NavLayout>
  );
};

export default AppointmentsPage;
