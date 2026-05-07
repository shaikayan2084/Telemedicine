import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebRTCProps {
  roomId: string;
  roomToken: string;
  signalingUrl?: string;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const useWebRTC = ({ roomId, roomToken, signalingUrl }: UseWebRTCProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // ── Initialize media stream ───────────────────────────────────────────────
  const initMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err: any) {
      setError(`Camera/microphone access denied: ${err.message}`);
      return null;
    }
  }, []);

  // ── Create peer connection ─────────────────────────────────────────────────
  const createPeerConnection = useCallback((peerId: string) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerConnectionRef.current = pc;

    // Add local tracks
    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // Handle remote stream
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    // Send ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', { targetId: peerId, candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      if (pc.connectionState === 'failed') {
        setError('Connection failed. Please try reconnecting.');
      }
    };

    return pc;
  }, []);

  // ── Main connection setup ─────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !roomToken) return;

    const setup = async () => {
      const stream = await initMedia();
      if (!stream) return;

      const url = signalingUrl || process.env.REACT_APP_SIGNALING_URL || 'http://localhost:4000';
      const socket = io(url, { auth: { token: roomToken } });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join-room', { roomId });
      });

      socket.on('connect_error', (err) => {
        setError(`Signaling connection failed: ${err.message}`);
      });

      // Another peer joined — we initiate the offer
      socket.on('peer-joined', async ({ peerId }: { peerId: string }) => {
        const pc = createPeerConnection(peerId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { targetId: peerId, sdp: offer });
      });

      // Receive offer — send answer
      socket.on('offer', async ({ sdp, fromId }: { sdp: RTCSessionDescriptionInit; fromId: string }) => {
        const pc = createPeerConnection(fromId);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { targetId: fromId, sdp: answer });
      });

      // Receive answer
      socket.on('answer', async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
        await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(sdp));
      });

      // ICE candidates
      socket.on('ice-candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
        try {
          await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('ICE candidate error:', err);
        }
      });

      socket.on('peer-left', () => {
        setRemoteStream(null);
        setConnectionState('disconnected');
      });
    };

    setup();

    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerConnectionRef.current?.close();
      socketRef.current?.disconnect();
    };
  }, [roomId, roomToken]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
      setIsAudioMuted((prev) => !prev);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
      setIsVideoOff((prev) => !prev);
    }
  }, []);

  const endCall = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnectionRef.current?.close();
    socketRef.current?.disconnect();
    setLocalStream(null);
    setRemoteStream(null);
  }, []);

  return {
    localStream,
    remoteStream,
    connectionState,
    isAudioMuted,
    isVideoOff,
    error,
    toggleAudio,
    toggleVideo,
    endCall,
  };
};

export default useWebRTC;
