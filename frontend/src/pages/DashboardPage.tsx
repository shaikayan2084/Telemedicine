import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button,
  Chip, Avatar, Divider, CircularProgress,
} from '@mui/material';
import {
  CalendarMonth, MedicalServices, VideoCall, Description,
  TrendingUp, AccessTime,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../hooks/useAuthStore';
import { appointmentsAPI, medicalRecordsAPI, prescriptionsAPI } from '../services/api';
import NavLayout from '../components/shared/NavLayout';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <Card>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Avatar sx={{ bgcolor: color, width: 52, height: 52 }}>{icon}</Avatar>
      <Box>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        <Typography variant="h5" fontWeight={700}>{value}</Typography>
      </Box>
    </CardContent>
  </Card>
);

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appointmentsAPI.getAll({ status: 'confirmed' })
      .then((r) => setAppointments(r.data.appointments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const upcoming = appointments.filter((a) => new Date(a.startTime) > new Date());

  return (
    <NavLayout>
      <Box sx={{ p: 3 }}>
        {/* Welcome */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4">
            Welcome back, {user?.firstName} 👋
          </Typography>
          <Typography color="text.secondary">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Upcoming Appointments" value={upcoming.length} icon={<CalendarMonth />} color="#0d47a1" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Consultations" value={appointments.length} icon={<VideoCall />} color="#00897b" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Medical Records" value="—" icon={<MedicalServices />} color="#6a1b9a" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Prescriptions" value="—" icon={<Description />} color="#e65100" />
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Quick Actions</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="contained" startIcon={<CalendarMonth />} onClick={() => navigate('/appointments')}>
                {user?.role === 'patient' ? 'Book Appointment' : 'View Schedule'}
              </Button>
              <Button variant="outlined" startIcon={<MedicalServices />} onClick={() => navigate('/ehr')}>
                Medical Records
              </Button>
              <Button variant="outlined" startIcon={<Description />} onClick={() => navigate('/prescriptions')}>
                Prescriptions
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Upcoming Appointments</Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : upcoming.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>No upcoming appointments.</Typography>
            ) : (
              upcoming.slice(0, 5).map((appt, i) => {
                const other = user?.role === 'patient' ? appt.doctor : appt.patient;
                const name = other ? `${other.firstName} ${other.lastName}` : 'Unknown';
                return (
                  <Box key={appt._id}>
                    {i > 0 && <Divider sx={{ my: 1.5 }} />}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.light' }}>
                          {user?.role === 'patient' ? '👨‍⚕️' : '🧑‍💼'}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={600}>{name}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {new Date(appt.startTime).toLocaleString('en-IN')}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip label={appt.consultationType} size="small" color="primary" variant="outlined" />
                        {appt.consultationType === 'video' && (
                          <Button size="small" variant="contained" startIcon={<VideoCall />}
                            onClick={() => navigate(`/room/${appt._id}`)}>
                            Join
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })
            )}
          </CardContent>
        </Card>
      </Box>
    </NavLayout>
  );
};

export default DashboardPage;
