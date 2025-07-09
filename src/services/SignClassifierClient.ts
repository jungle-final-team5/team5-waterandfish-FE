export interface ClassificationResult {
  prediction: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface VideoChunkMessage {
  type: 'video_chunk';
  data: string; // base64 encoded image
  timestamp: number;
}

export interface ClassificationResultMessage {
  type: 'classification_result';
  data: ClassificationResult;
  timestamp: number;
}

export interface PingMessage {
  type: 'ping';
}

export interface PongMessage {
  type: 'pong';
}

export type WebSocketMessage = VideoChunkMessage | ClassificationResultMessage | PingMessage | PongMessage;

export class SignClassifierClient {
  private websocket: WebSocket | null = null;
  private serverUrl: string;
  private isConnected: boolean = false;
  private onResultCallback: ((result: ClassificationResult) => void) | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000; // 2초

  constructor(serverUrl: string = '') {
    // 운영 환경에서는 wss://, 개발 환경에서는 ws:// 사용
    if (!serverUrl) {
      const protocol = window?.location?.protocol === 'https:' ? 'wss' : 'ws';
      const host = window?.location?.host || 'localhost:8765';
      // 포트는 필요에 따라 수정
      this.serverUrl = `${protocol}://${host}/ws/9002/`;
    } else {
      // 만약 ws://로 시작하는 주소가 들어오면, https 환경에서는 wss://로 변환
      if (window?.location?.protocol === 'https:' && serverUrl.startsWith('ws://')) {
        this.serverUrl = serverUrl.replace('ws://', 'wss://');
      } else {
        this.serverUrl = serverUrl;
      }
    }
  }

  async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        console.log(`🔌 분류 서버에 연결 시도: ${this.serverUrl}`);
        
        this.websocket = new WebSocket(this.serverUrl);
        
        this.websocket.onopen = () => {
          console.log('✅ 분류 서버에 연결됨');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve(true);
        };
        
        this.websocket.onmessage = (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            
            if (data.type === 'classification_result') {
              if (this.onResultCallback) {
                this.onResultCallback(data.data);
              }
            } else if (data.type === 'pong') {
              console.log('🏓 Pong received');
            }
          } catch (error) {
            console.error('❌ 메시지 파싱 실패:', error);
          }
        };
        
        this.websocket.onclose = (event) => {
          console.log(`🔴 분류 서버 연결 종료: ${event.code} - ${event.reason}`);
          this.isConnected = false;
          
          // 자동 재연결 시도
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
            setTimeout(() => {
              this.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
          } else {
            console.error('❌ 최대 재연결 시도 횟수 초과');
          }
        };
        
        this.websocket.onerror = (error) => {
          console.error('❌ WebSocket 오류:', error);
          this.isConnected = false;
          resolve(false);
        };
        
      } catch (error) {
        console.error('❌ 연결 실패:', error);
        this.isConnected = false;
        resolve(false);
      }
    });
  }

  sendVideoChunk(videoBlob: Blob): boolean {
    if (!this.isConnected || !this.websocket) {
      console.warn('⚠️ 서버에 연결되지 않음');
      return false;
    }

    // 비디오 데이터를 base64로 인코딩
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1]; // data:image/jpeg;base64, 제거
      
      const message: VideoChunkMessage = {
        type: 'video_chunk',
        data: base64Data,
        timestamp: Date.now()
      };
      
      try {
        this.websocket!.send(JSON.stringify(message));
      } catch (error) {
        console.error('❌ 비디오 청크 전송 실패:', error);
      }
    };
    
    reader.readAsDataURL(videoBlob);
    return true;
  }

  sendPing(): boolean {
    if (!this.isConnected || !this.websocket) {
      return false;
    }

    const message: PingMessage = {
      type: 'ping'
    };

    try {
      this.websocket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('❌ Ping 전송 실패:', error);
      return false;
    }
  }

  onResult(callback: (result: ClassificationResult) => void): void {
    this.onResultCallback = callback;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.isConnected = false;
    this.onResultCallback = null;
    console.log('🔌 분류 서버 연결 해제');
  }
}

// 싱글톤 인스턴스
export const signClassifierClient = new SignClassifierClient(); 