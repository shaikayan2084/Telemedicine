import React from 'react';
import { Box, Typography } from '@mui/material';
import NavLayout from '../components/shared/NavLayout';

export const ProfilePage: React.FC = () => (
  <NavLayout>
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">My Profile</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>Profile management — update your personal and medical information.</Typography>
    </Box>
  </NavLayout>
);

export const AdminPage: React.FC = () => (
  <NavLayout>
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Admin Panel</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>Audit logs, compliance reports, and system management.</Typography>
    </Box>
  </NavLayout>
);

export const VerifyPrescriptionPage: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: 2 }}>
    <Typography variant="h4">Prescription Verification</Typography>
    <Typography color="text.secondary">Verifying prescription authenticity via SHA-256 hash...</Typography>
  </Box>
);
