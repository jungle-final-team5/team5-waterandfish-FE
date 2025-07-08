import { EventEmitter } from '@/utils/EventEmitter';

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  maxBitrate: number;
  maxFramerate: number;
  videoCodec: string;
}

export interface WebRTCStats {
  bytesReceived: number;
  bytesSent: number;
  packetsReceived: number;
  packetsSent: number;
  framesReceived: number;
  framesSent: number;
  framesDropped: number;
  roundTripTime: number;
  timestamp: number;
}

export interface WebRTCMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'classification-result' | 'error';
  data: any;
  timestamp: number;
}

export class WebRTCService extends EventEmitter {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private config: WebRTCConfig;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private statsInterval: number | null = null;

  constructor(config: Partial<WebRTCConfig> = {}) {
    super();
    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      maxBitrate: 1000000, // 1Mbps
      maxFramerate: 30,
      videoCodec: 'H264',
      ...config
    };
  }

  async initialize(stream: MediaStream): Promise<void> {
    try {
      this.localStream = stream;
      
      // RTCPeerConnection 생성
      this.peerConnection = new RTCPeerConnection({
        iceServers: this.config.iceServers,
        iceCandidatePoolSize: 10
      });

      // 로컬 스트림 추가
      stream.getTracks().forEach(track => {
        if (this.peerConnection) {
          this.peerConnection.addTrack(track, stream);
        }
      });

      // 이벤트 리스너 설정
      this.setupEventListeners();

      this.emit('initialized');
    } catch (error) {
      this.emit('error', `WebRTC 초기화 실패: ${error}`);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.peerConnection) return;

    // ICE 후보 이벤트
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit('ice-candidate', event.candidate);
      }
    };

    // 연결 상태 변경
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      this.emit('connection-state-change', state);
      
      if (state === 'connected') {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
        this.startStatsMonitoring();
      } else if (state === 'disconnected' || state === 'failed') {
        this.isConnected = false;
        this.emit('disconnected');
        this.handleReconnection();
      }
    };

    // ICE 연결 상태 변경
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      this.emit('ice-connection-state-change', state);
    };

    // 원격 스트림 수신
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.emit('remote-stream', this.remoteStream);
    };

    // 데이터 채널 이벤트
    this.peerConnection.ondatachannel = (event) => {
      this.setupDataChannel(event.channel);
    };
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    this.dataChannel = channel;
    
    channel.onopen = () => {
      this.emit('data-channel-open');
    };

    channel.onclose = () => {
      this.emit('data-channel-close');
    };

    channel.onmessage = (event) => {
      try {
        const message: WebRTCMessage = JSON.parse(event.data);
        this.emit('message', message);
      } catch (error) {
        console.error('데이터 채널 메시지 파싱 실패:', error);
      }
    };

    channel.onerror = (error) => {
      this.emit('data-channel-error', error);
    };
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('WebRTC 연결이 초기화되지 않았습니다.');
    }

    try {
      // 비디오 트랙 설정 최적화
      const videoTrack = this.localStream?.getVideoTracks()[0];
      if (videoTrack) {
        const sender = this.peerConnection.getSenders().find(s => 
          s.track?.kind === 'video'
        );
        
        if (sender) {
          const params = sender.getParameters();
          if (params.encodings && params.encodings.length > 0) {
            params.encodings[0].maxBitrate = this.config.maxBitrate;
            await sender.setParameters(params);
          }
        }
      }

      const offer = await this.peerConnection.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: false
      });

      await this.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      this.emit('error', `Offer 생성 실패: ${error}`);
      throw error;
    }
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('WebRTC 연결이 초기화되지 않았습니다.');
    }

    try {
      await this.peerConnection.setRemoteDescription(answer);
    } catch (error) {
      this.emit('error', `Answer 처리 실패: ${error}`);
      throw error;
    }
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('WebRTC 연결이 초기화되지 않았습니다.');
    }

    try {
      await this.peerConnection.addIceCandidate(candidate);
    } catch (error) {
      this.emit('error', `ICE 후보 추가 실패: ${error}`);
      throw error;
    }
  }

  sendMessage(message: WebRTCMessage): boolean {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      setTimeout(() => {
        this.emit('reconnecting', this.reconnectAttempts);
        // 재연결 로직 구현
      }, delay);
    } else {
      this.emit('reconnection-failed');
    }
  }

  private startStatsMonitoring(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }

    this.statsInterval = setInterval(async () => {
      if (this.peerConnection && this.isConnected) {
        try {
          const stats = await this.peerConnection.getStats();
          const webRTCStats = this.processStats(stats);
          this.emit('stats', webRTCStats);
        } catch (error) {
          console.error('통계 수집 실패:', error);
        }
      }
    }, 1000) as unknown as number;
  }

  private processStats(stats: RTCStatsReport): WebRTCStats {
    let bytesReceived = 0;
    let bytesSent = 0;
    let packetsReceived = 0;
    let packetsSent = 0;
    let framesReceived = 0;
    let framesSent = 0;
    let framesDropped = 0;
    let roundTripTime = 0;

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
        bytesReceived += report.bytesReceived || 0;
        packetsReceived += report.packetsReceived || 0;
        framesReceived += report.framesReceived || 0;
        framesDropped += report.framesDropped || 0;
      } else if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
        bytesSent += report.bytesSent || 0;
        packetsSent += report.packetsSent || 0;
        framesSent += report.framesSent || 0;
      } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        roundTripTime = report.currentRoundTripTime || 0;
      }
    });

    return {
      bytesReceived,
      bytesSent,
      packetsReceived,
      packetsSent,
      framesReceived,
      framesSent,
      framesDropped,
      roundTripTime,
      timestamp: Date.now()
    };
  }

  getConnectionState(): RTCPeerConnectionState | null {
    return this.peerConnection?.connectionState || null;
  }

  getIceConnectionState(): RTCIceConnectionState | null {
    return this.peerConnection?.iceConnectionState || null;
  }

  isConnectionActive(): boolean {
    return this.isConnected && this.peerConnection?.connectionState === 'connected';
  }

  disconnect(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.isConnected = false;
    this.emit('disconnected');
  }

  destroy(): void {
    this.disconnect();
    this.removeAllListeners();
  }
}

export default WebRTCService; 