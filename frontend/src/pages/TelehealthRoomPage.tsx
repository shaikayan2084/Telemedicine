import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, IconButton, Typography, Chip, Paper, Alert, CircularProgress, Tooltip,
} from '@mui/material';
import {
  Mic, MicOff, Videocam, VideocamOff, CallEnd, FiberManualRecord,
} from '@mui/icons-material';
import { appointmentsAPI } from '../services/api';
import useWebRTC from '../hooks/useWebRTC';

const TelehealthRoomPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [roomToken, setRoomToken] = useState('');
  const [roomId, setRoomId] = useState('');
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const {
    localStream, remoteStream, connectionState,
    isAudioMuted, isVideoOff, error,
    toggleAudio, toggleVideo, endCall,
  } = useWebRTC({ roomId, roomToken });

  // Fetch room token
  useEffect(() => {
    if (!appointmentId) return;
    appointmentsAPI.getRoomToken(appointmentId)
      .then((res) => {
        setRoomToken(res.data.roomToken);
        setRoomId(res.data.roomId);
      })
      .catch((err) => setFetchError(err.response?.data?.message || 'Failed to access room'))
      .finally(() => setFetching(false));
  }, [appointmentId]);

  // Bind streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  const handleEndCall = () => {
    endCall();
    navigate('/appointments');
  };

  const getConnectionColor = () => {
    if (connectionState === 'connected') return 'success';
    if (connectionState === 'connecting') return 'warning';
    if (connectionState === 'failed' || connectionState === 'disconnected') return 'error';
    return 'default';
  };

  if (fetching) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0a0a0a' }}>
        <CircularProgress sx={{ color: 'white' }} />
        <Typography color="white" sx={{ ml: 2 }}>Securing your consultation room...</Typography>
      </Box>
    );
  }

  if (fetchError) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0a0a0a', p: 3 }}>
        <Alert severity="error" sx={{ maxWidth: 500 }}>{fetchError}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', bgcolor: '#0a0a0a', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Status Bar */}
      <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10, display: 'flex', gap: 1, alignItems: 'center' }}>
        <Chip
          icon={<FiberManualRecord sx={{ fontSize: 10 }} />}
          label={connectionState}
          color={getConnectionColor() as any}
          size="small"
        />
        <Chip label="🔒 End-to-End Encrypted" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }} />
      </Box>

      {error && (
        <Alert severity="error" sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10, maxWidth: 400 }}>
          {error}
        </Alert>
      )}

      {/* Remote Video (main) */}
      <Box sx={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
            <Typography variant="h6">Waiting for the other participant to join...</Typography>
            <Typography variant="body2">The consultation will begin once both parties connect.</Typography>
          </Box>
        )}

        {/* Local Video (PiP) */}
        <Paper
          elevation={8}
          sx={{
            position: 'absolute', bottom: 100, right: 24,
            width: 200, height: 140, overflow: 'hidden', borderRadius: 2,
            border: '2px solid rgba(255,255,255,0.2)',
          }}
        >
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
          {isVideoOff && (
            <Box sx={{ position: 'absolute', inset: 0, bgcolor: '#1a1a1a', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <VideocamOff sx={{ color: 'rgba(255,255,255,0.5)' }} />
            </Box>
          )}
        </Paper>
      </Box>

      {/* Controls */}
      <Box sx={{ bgcolor: 'rgba(0,0,0,0.8)', p: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Tooltip title={isAudioMuted ? 'Unmute' : 'Mute'}>
          <IconButton
            onClick={toggleAudio}
            sx={{
              bgcolor: isAudioMuted ? 'error.main' : 'rgba(255,255,255,0.15)',
              color: 'white',
              '&:hover': { bgcolor: isAudioMuted ? 'error.dark' : 'rgba(255,255,255,0.25)' },
              width: 56, height: 56,
            }}
          >
            {isAudioMuted ? <MicOff /> : <Mic />}
          </IconButton>
        </Tooltip>

        <Tooltip title={isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'}>
          <IconButton
            onClick={toggleVideo}
            sx={{
              bgcolor: isVideoOff ? 'error.main' : 'rgba(255,255,255,0.15)',
              color: 'white',
              '&:hover': { bgcolor: isVideoOff ? 'error.dark' : 'rgba(255,255,255,0.25)' },
              width: 56, height: 56,
            }}
          >
            {isVideoOff ? <VideocamOff /> : <Videocam />}
          </IconButton>
        </Tooltip>

        <Tooltip title="End Call">
          <IconButton
            onClick={handleEndCall}
            sx={{
              bgcolor: 'error.main', color: 'white',
              '&:hover': { bgcolor: 'error.dark' },
              width: 56, height: 56,
            }}
          >
            <CallEnd />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default TelehealthRoomPage;
