import React, { useState } from 'react';
import {
  Box, Drawer, List, ListItem, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem,
  Divider, useTheme, useMediaQuery,
} from '@mui/material';
import {
  Dashboard, CalendarMonth, MedicalServices, VideoCall,
  Description, Person, AdminPanelSettings, Logout, Menu as MenuIcon,
  LocalHospital,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../hooks/useAuthStore';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard', roles: ['patient', 'doctor', 'admin'] },
  { label: 'Appointments', icon: <CalendarMonth />, path: '/appointments', roles: ['patient', 'doctor'] },
  { label: 'Health Records', icon: <MedicalServices />, path: '/ehr', roles: ['patient', 'doctor'] },
  { label: 'Prescriptions', icon: <Description />, path: '/prescriptions', roles: ['patient', 'doctor'] },
  { label: 'Admin Panel', icon: <AdminPanelSettings />, path: '/admin', roles: ['admin'] },
  { label: 'Profile', icon: <Person />, path: '/profile', roles: ['patient', 'doctor', 'admin'] },
];

const NavLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const filteredNav = navItems.filter((item) => user && item.roles.includes(user.role));

  const DrawerContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <LocalHospital color="primary" />
        <Typography variant="h6" fontWeight={700} color="primary">MediCare</Typography>
      </Box>
      <Divider />
      <List sx={{ flex: 1, pt: 1 }}>
        {filteredNav.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItem
              key={item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              sx={{
                cursor: 'pointer', borderRadius: 2, mx: 1, mb: 0.5,
                bgcolor: active ? 'primary.main' : 'transparent',
                color: active ? 'white' : 'text.primary',
                '&:hover': { bgcolor: active ? 'primary.dark' : 'action.hover' },
                transition: 'all 0.2s',
              }}
            >
              <ListItemIcon sx={{ color: active ? 'white' : 'text.secondary', minWidth: 36 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: active ? 600 : 400, fontSize: 14 }} />
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">🔒 HIPAA-Compliant Platform</Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      {!isMobile && (
        <Drawer variant="permanent" sx={{
          width: DRAWER_WIDTH,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none', boxShadow: '2px 0 8px rgba(0,0,0,0.06)' },
        }}>
          <DrawerContent />
        </Drawer>
      )}

      {/* Mobile Drawer */}
      <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
        <DrawerContent />
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar position="sticky" color="inherit" elevation={0}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
          <Toolbar>
            {isMobile && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
              {filteredNav.find((n) => n.path === location.pathname)?.label || 'Telemedicine'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </Avatar>
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, bgcolor: 'background.default', overflow: 'auto' }}>
          {children}
        </Box>
      </Box>

      {/* User Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }}>
          <Person sx={{ mr: 1, fontSize: 20 }} /> Profile
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { logout(); navigate('/login'); }} sx={{ color: 'error.main' }}>
          <Logout sx={{ mr: 1, fontSize: 20 }} /> Sign Out
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default NavLayout;
