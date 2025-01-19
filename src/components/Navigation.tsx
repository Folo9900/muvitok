import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { Home, Person } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box
      sx={{
        position: 'absolute',
        right: 16,
        top: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        zIndex: 1000
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <IconButton
          onClick={() => navigate('/')}
          sx={{
            color: 'white',
            backgroundColor: location.pathname === '/' ? 'rgba(255,255,255,0.2)' : 'transparent'
          }}
        >
          <Home />
        </IconButton>
        <Typography variant="caption" sx={{ color: 'white', fontSize: '0.7rem' }}>
          Лента
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <IconButton
          onClick={() => navigate('/profile')}
          sx={{
            color: 'white',
            backgroundColor: location.pathname === '/profile' ? 'rgba(255,255,255,0.2)' : 'transparent'
          }}
        >
          <Person />
        </IconButton>
        <Typography variant="caption" sx={{ color: 'white', fontSize: '0.7rem' }}>
          Профиль
        </Typography>
      </Box>
    </Box>
  );
};

export default Navigation;
