import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, MenuItem, Select, FormControl, InputLabel, CircularProgress, Link, Grid,
} from '@mui/material';
import { LocalHospital } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import useAuthStore from '../hooks/useAuthStore';
import { SPECIALTY_OPTIONS } from '../utils/specialties';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    confirmPassword: '', role: 'patient', specialty: '', licenseNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.register(form);
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0d47a1 0%, #00897b 100%)', p: 2,
    }}>
      <Card sx={{ width: '100%', maxWidth: 520 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LocalHospital sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={700} color="primary">Create Account</Typography>
            <Typography variant="body2" color="text.secondary">Secure Healthcare Portal</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select name="role" value={form.role} label="Role" onChange={handleChange}>
                <MenuItem value="patient">Patient</MenuItem>
                <MenuItem value="doctor">Doctor</MenuItem>
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField fullWidth label="First Name" name="firstName" value={form.firstName} onChange={handleChange} required />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} required />
              </Grid>
            </Grid>

            <TextField fullWidth label="Email" name="email" type="email" sx={{ mt: 2 }} value={form.email} onChange={handleChange} required />
            <TextField fullWidth label="Password" name="password" type="password" sx={{ mt: 2 }} value={form.password} onChange={handleChange} required helperText="Min 8 chars with uppercase, lowercase, number, special char" />
            <TextField fullWidth label="Confirm Password" name="confirmPassword" type="password" sx={{ mt: 2 }} value={form.confirmPassword} onChange={handleChange} required />

            {form.role === 'doctor' && (
              <>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Specialty</InputLabel>
                  <Select name="specialty" value={form.specialty} label="Specialty" onChange={handleChange} required>
                    {SPECIALTY_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField fullWidth label="License Number" name="licenseNumber" sx={{ mt: 2 }} value={form.licenseNumber} onChange={handleChange} required />
              </>
            )}

            <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}>
              {loading ? 'Creating account...' : 'Register'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2">
                Already have an account? <Link href="/login" underline="hover">Sign In</Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterPage;
