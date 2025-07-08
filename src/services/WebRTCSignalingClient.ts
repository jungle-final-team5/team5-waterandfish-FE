import { EventEmitter } from '@/utils/EventEmitter';

export interface SignalingMessage {
  type: 'join' | 'offer' | 'answer' | 'ice-candidate' | 'video-frame' | 'leave' | 'new-peer' | 'joined' | 'peer-disconnected' | 'classification-result';
  data?: any;
  room_id?: string;
  peer_id?: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  frame?: string;
}

export class WebRTCSignalingClient extends EventEmitter {
  private websocket: WebSocket | null = null;
  private url: string;
  private roomId: string;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;

  constructor(url: string, roomId: string = 'default') {
    super();
    this.url = url;
    this.roomId = roomId;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(this.url);

        this.websocket.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          
          // 방 참가 메시지 전송
          this.sendMessage({
            type: 'join',
            room_id: this.roomId
          });
          
          resolve();
        };

        this.websocket.onclose = (event) => {
          this.isConnected = false;
          this.emit('disconnected', event);
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.websocket.onerror = (error) => {
          this.emit('error', error);
          reject(error);
        };

        this.websocket.onmessage = (event) => {
          try {
            const message: SignalingMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('메시지 파싱 실패:', error);
          }
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(message: SignalingMessage): void {
    switch (message.type) {
      case 'joined':
        this.emit('joined', message);
        break;
      case 'new-peer':
        this.emit('new-peer', message);
        break;
      case 'offer':
        this.emit('offer', message);
        break;
      case 'answer':
        this.emit('answer', message);
        break;
      case 'ice-candidate':
        this.emit('ice-candidate', message);
        break;
      case 'peer-disconnected':
        this.emit('peer-disconnected', message);
        break;
      case 'classification-result':
        this.emit('classification-result', message);
        break;
      default:
        console.warn('알 수 없는 메시지 타입:', message.type);
    }
  }

  sendMessage(message: SignalingMessage): boolean {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  sendOffer(offer: RTCSessionDescriptionInit, peerId: string): boolean {
    return this.sendMessage({
      type: 'offer',
      offer,
      peer_id: peerId
    });
  }

  sendAnswer(answer: RTCSessionDescriptionInit, peerId: string): boolean {
    return this.sendMessage({
      type: 'answer',
      answer,
      peer_id: peerId
    });
  }

  sendIceCandidate(candidate: RTCIceCandidateInit, peerId: string): boolean {
    return this.sendMessage({
      type: 'ice-candidate',
      candidate,
      peer_id: peerId
    });
  }

  sendVideoFrame(frame: string): boolean {
    return this.sendMessage({
      type: 'video-frame',
      frame
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    this.reconnectTimeout = setTimeout(() => {
      this.emit('reconnecting', this.reconnectAttempts);
      this.connect().catch(error => {
        console.error('재연결 실패:', error);
      });
    }, delay) as unknown as number;
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.websocket) {
      this.sendMessage({ type: 'leave' });
      this.websocket.close();
      this.websocket = null;
    }

    this.isConnected = false;
    this.emit('disconnected');
  }

  isConnectionActive(): boolean {
    return this.isConnected && this.websocket?.readyState === WebSocket.OPEN;
  }

  destroy(): void {
    this.disconnect();
    this.removeAllListeners();
  }
}

export default WebRTCSignalingClient; 