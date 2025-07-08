import { EventEmitter } from '@/utils/EventEmitter';
import { logger } from '@/utils/logger';

export interface SharedMemoryConfig {
  serverId: string;
  sharedMemoryDir: string;
  frameWidth: number;
  frameHeight: number;
  quality: number;
  fps: number;
}

export interface SharedMemoryFrame {
  width: number;
  height: number;
  data: Uint8Array;
  timestamp: number;
}

export interface SharedMemoryResult {
  prediction: string;
  confidence: number;
  probabilities: Record<string, number>;
  timestamp: number;
}

export class SharedMemoryVideoClient extends EventEmitter {
  private config: SharedMemoryConfig;
  private isConnected: boolean = false;
  private isStreaming: boolean = false;
  private clientId: string;
  private sharedMemoryHandle: any = null;
  private wasmModule: any = null;
  private streamInterval: number | null = null;
  private resultInterval: number | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: number | null = null;

  constructor(config: SharedMemoryConfig) {
    super();
    this.config = config;
    this.clientId = this.generateClientId();
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async initialize(): Promise<boolean> {
    try {
      // WebAssembly 모듈 로드
      await this.loadWasmModule();
      
      // 서버에 클라이언트 등록
      await this.registerWithServer();
      
      // 공유 메모리 초기화
      await this.initializeSharedMemory();
      
      this.isConnected = true;
      this.emit('connected');
      
      logger.info(`✅ 공유 메모리 클라이언트 초기화 완료: ${this.clientId}`);
      return true;
      
    } catch (error) {
      logger.error(`❌ 공유 메모리 클라이언트 초기화 실패: ${error}`);
      this.emit('error', error);
      return false;
    }
  }

  private async registerWithServer(): Promise<void> {
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`서버 등록 실패: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        logger.info(`✅ 서버 등록 완료: ${this.clientId}`);
      } else {
        throw new Error(`서버 등록 실패: ${data.error}`);
      }
      
    } catch (error) {
      logger.error(`❌ 서버 등록 실패: ${error}`);
      throw error;
    }
  }

  private async loadWasmModule(): Promise<void> {
    try {
      // WebAssembly 모듈 로드 (실제 구현에서는 적절한 WASM 파일을 로드)
      // this.wasmModule = await import('./shared_memory_wasm.js');
      
      // 임시 구현: WebAssembly 대신 File System Access API 사용
      if ('showDirectoryPicker' in window) {
        // File System Access API 지원 브라우저
        this.wasmModule = {
          createSharedMemory: this.createSharedMemoryFS.bind(this),
          writeFrame: this.writeFrameFS.bind(this),
          readResult: this.readResultFS.bind(this),
          cleanup: this.cleanupFS.bind(this)
        };
      } else {
        // 폴백: IndexedDB 사용
        this.wasmModule = {
          createSharedMemory: this.createSharedMemoryIndexedDB.bind(this),
          writeFrame: this.writeFrameIndexedDB.bind(this),
          readResult: this.readResultIndexedDB.bind(this),
          cleanup: this.cleanupIndexedDB.bind(this)
        };
      }
      
    } catch (error) {
      throw new Error(`WebAssembly 모듈 로드 실패: ${error}`);
    }
  }

  private async initializeSharedMemory(): Promise<void> {
    try {
      this.sharedMemoryHandle = await this.wasmModule.createSharedMemory(
        this.clientId,
        this.config.frameWidth,
        this.config.frameHeight
      );
      
      // 결과 읽기 인터벌 시작
      this.startResultPolling();
      
    } catch (error) {
      // File System Access API 실패 시 IndexedDB로 폴백
      if (error.message.includes('User activation is required') || error.message.includes('NotAllowedError')) {
        console.log('🔄 File System Access API 실패, IndexedDB로 폴백합니다...');
        
        // IndexedDB 모듈로 변경
        this.wasmModule = {
          createSharedMemory: this.createSharedMemoryIndexedDB.bind(this),
          writeFrame: this.writeFrameIndexedDB.bind(this),
          readResult: this.readResultIndexedDB.bind(this),
          cleanup: this.cleanupIndexedDB.bind(this)
        };
        
        // IndexedDB로 재시도
        this.sharedMemoryHandle = await this.wasmModule.createSharedMemory(
          this.clientId,
          this.config.frameWidth,
          this.config.frameHeight
        );
        
        // 결과 읽기 인터벌 시작
        this.startResultPolling();
      } else {
        throw new Error(`공유 메모리 초기화 실패: ${error}`);
      }
    }
  }

  // File System Access API 기반 구현
  private async createSharedMemoryFS(clientId: string, width: number, height: number): Promise<any> {
    try {
      // 사용자 활성화가 필요한지 확인
      if (!this.isUserActivated()) {
        throw new Error('User activation is required to access file system. Please use IndexedDB fallback.');
      }

      const dirHandle = await (window as any).showDirectoryPicker({
        id: 'video-streams',
        mode: 'readwrite'
      });
      
      // 클라이언트별 디렉토리 생성
      const clientDir = await dirHandle.getDirectoryHandle(clientId, { create: true });
      
      // 파일 핸들 생성
      const metadataFile = await clientDir.getFileHandle('metadata', { create: true });
      const frameDataFile = await clientDir.getFileHandle('frame_data', { create: true });
      const controlFile = await clientDir.getFileHandle('control', { create: true });
      
      return {
        type: 'fs',
        clientDir,
        metadataFile,
        frameDataFile,
        controlFile,
        width,
        height
      };
      
    } catch (error) {
      throw new Error(`File System Access API 초기화 실패: ${error}`);
    }
  }

  // 사용자 활성화 상태 확인
  private isUserActivated(): boolean {
    // navigator.userActivation API를 사용하여 사용자 활성화 상태 확인
    if ('userActivation' in navigator) {
      return (navigator as any).userActivation.hasBeenActive || (navigator as any).userActivation.isActive;
    }
    
    // 폴백: 최근 사용자 상호작용이 있었는지 확인
    // 이는 완벽하지 않지만 대부분의 경우 작동합니다
    return true; // 기본적으로 true로 설정하고, 실제 오류가 발생하면 IndexedDB로 폴백
  }

  private async writeFrameFS(frame: SharedMemoryFrame): Promise<boolean> {
    try {
      const handle = this.sharedMemoryHandle;
      
      // 제어 정보 쓰기
      const controlWritable = await handle.controlFile.createWritable();
      const controlData = new ArrayBuffer(256);
      const controlView = new DataView(controlData);
      
      controlView.setUint32(0, 1); // ready status
      controlView.setUint32(4, frame.width);
      controlView.setUint32(8, frame.height);
      controlView.setUint32(12, frame.data.length);
      controlView.setFloat64(16, frame.timestamp);
      
      await controlWritable.write(controlData);
      await controlWritable.close();
      
      // 프레임 데이터 쓰기
      const frameWritable = await handle.frameDataFile.createWritable();
      await frameWritable.write(frame.data);
      await frameWritable.close();
      
      return true;
      
    } catch (error) {
      logger.error(`❌ 프레임 쓰기 실패: ${error}`);
      return false;
    }
  }

  private async readResultFS(): Promise<SharedMemoryResult | null> {
    try {
      const handle = this.sharedMemoryHandle;
      
      // 메타데이터 읽기
      const metadataFile = await handle.metadataFile.getFile();
      const metadataBuffer = await metadataFile.arrayBuffer();
      
      if (metadataBuffer.byteLength === 0) {
        return null;
      }
      
      const metadataView = new DataView(metadataBuffer);
      const resultLength = metadataView.getUint32(0);
      
      if (resultLength === 0) {
        return null;
      }
      
      // 결과 JSON 읽기
      const resultBytes = new Uint8Array(metadataBuffer, 4, resultLength);
      const resultJson = new TextDecoder().decode(resultBytes);
      const result = JSON.parse(resultJson);
      
      return result;
      
    } catch (error) {
      logger.error(`❌ 결과 읽기 실패: ${error}`);
      return null;
    }
  }

  private async cleanupFS(): Promise<void> {
    try {
      const handle = this.sharedMemoryHandle;
      if (handle && handle.clientDir) {
        await handle.clientDir.removeRecursively();
      }
    } catch (error) {
      logger.error(`❌ File System 정리 실패: ${error}`);
    }
  }

  // IndexedDB 기반 구현 (폴백)
  private async createSharedMemoryIndexedDB(clientId: string, width: number, height: number): Promise<any> {
    try {
      const dbName = 'VideoStreamsDB';
      const dbVersion = 1;
      
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          
          // 객체 스토어 생성
          if (!db.objectStoreNames.contains('frames')) {
            db.createObjectStore('frames', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('results')) {
            db.createObjectStore('results', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('control')) {
            db.createObjectStore('control', { keyPath: 'id' });
          }
          
          resolve({
            type: 'indexeddb',
            db,
            clientId,
            width,
            height
          });
        };
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as any).result;
          
          if (!db.objectStoreNames.contains('frames')) {
            db.createObjectStore('frames', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('results')) {
            db.createObjectStore('results', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('control')) {
            db.createObjectStore('control', { keyPath: 'id' });
          }
        };
      });
      
    } catch (error) {
      throw new Error(`IndexedDB 초기화 실패: ${error}`);
    }
  }

  private async writeFrameIndexedDB(frame: SharedMemoryFrame): Promise<boolean> {
    try {
      const handle = this.sharedMemoryHandle;
      const db = handle.db;
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['frames', 'control'], 'readwrite');
        
        // 제어 정보 저장
        const controlStore = transaction.objectStore('control');
        const controlData = {
          id: `${handle.clientId}_control`,
          status: 1, // ready
          width: frame.width,
          height: frame.height,
          size: frame.data.length,
          timestamp: frame.timestamp
        };
        controlStore.put(controlData);
        
        // 프레임 데이터 저장
        const frameStore = transaction.objectStore('frames');
        const frameData = {
          id: `${handle.clientId}_frame`,
          data: frame.data,
          timestamp: frame.timestamp
        };
        frameStore.put(frameData);
        
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => reject(transaction.error);
      });
      
    } catch (error) {
      logger.error(`❌ IndexedDB 프레임 쓰기 실패: ${error}`);
      return false;
    }
  }

  private async readResultIndexedDB(): Promise<SharedMemoryResult | null> {
    try {
      const handle = this.sharedMemoryHandle;
      const db = handle.db;
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['results'], 'readonly');
        const store = transaction.objectStore('results');
        const request = store.get(`${handle.clientId}_result`);
        
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.data : null);
        };
        
        request.onerror = () => reject(request.error);
      });
      
    } catch (error) {
      logger.error(`❌ IndexedDB 결과 읽기 실패: ${error}`);
      return null;
    }
  }

  private async cleanupIndexedDB(): Promise<void> {
    try {
      const handle = this.sharedMemoryHandle;
      if (handle && handle.db) {
        const transaction = handle.db.transaction(['frames', 'results', 'control'], 'readwrite');
        
        // 클라이언트 관련 데이터 삭제
        const frameStore = transaction.objectStore('frames');
        const resultStore = transaction.objectStore('results');
        const controlStore = transaction.objectStore('control');
        
        frameStore.delete(`${handle.clientId}_frame`);
        resultStore.delete(`${handle.clientId}_result`);
        controlStore.delete(`${handle.clientId}_control`);
      }
    } catch (error) {
      logger.error(`❌ IndexedDB 정리 실패: ${error}`);
    }
  }

  async startStreaming(stream: MediaStream): Promise<boolean> {
    if (!this.isConnected) {
      logger.error('❌ 서버에 연결되지 않음');
      return false;
    }

    if (this.isStreaming) {
      logger.warning('⚠️ 이미 스트리밍 중');
      return true;
    }

    try {
      this.isStreaming = true;
      
      // 비디오 캡처 설정
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context를 생성할 수 없습니다');
      }
      
      canvas.width = this.config.frameWidth;
      canvas.height = this.config.frameHeight;
      
      // 스트리밍 인터벌 시작
      this.streamInterval = setInterval(async () => {
        if (!this.isStreaming) return;
        
        try {
          // 비디오 프레임 캡처
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Canvas를 JPEG로 변환
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', this.config.quality);
          });
          
          if (!blob) {
            logger.warning('⚠️ 프레임 캡처 실패');
            return;
          }
          
          // Blob을 ArrayBuffer로 변환
          const arrayBuffer = await blob.arrayBuffer();
          const frameData = new Uint8Array(arrayBuffer);
          
          // 공유 메모리에 프레임 쓰기
          const frame: SharedMemoryFrame = {
            width: canvas.width,
            height: canvas.height,
            data: frameData,
            timestamp: Date.now()
          };
          
          const success = await this.wasmModule.writeFrame(frame);
          
          if (success) {
            this.emit('frame-sent', frame);
          } else {
            this.emit('frame-error', '프레임 전송 실패');
          }
          
        } catch (error) {
          logger.error(`❌ 프레임 처리 실패: ${error}`);
          this.emit('frame-error', error);
        }
      }, 1000 / this.config.fps) as unknown as number;
      
      this.emit('streaming-started');
      logger.info('✅ 스트리밍 시작');
      return true;
      
    } catch (error) {
      logger.error(`❌ 스트리밍 시작 실패: ${error}`);
      this.isStreaming = false;
      this.emit('error', error);
      return false;
    }
  }

  stopStreaming(): void {
    if (this.streamInterval) {
      clearInterval(this.streamInterval);
      this.streamInterval = null;
    }
    
    this.isStreaming = false;
    this.emit('streaming-stopped');
    logger.info('🛑 스트리밍 중지');
  }

  private startResultPolling(): void {
    this.resultInterval = setInterval(async () => {
      if (!this.isConnected) return;
      
      try {
        const result = await this.wasmModule.readResult();
        
        if (result) {
          this.emit('classification-result', result);
        }
        
      } catch (error) {
        logger.error(`❌ 결과 폴링 실패: ${error}`);
      }
    }, 100) as unknown as number; // 100ms마다 결과 확인
  }

  private stopResultPolling(): void {
    if (this.resultInterval) {
      clearInterval(this.resultInterval);
      this.resultInterval = null;
    }
  }

  async disconnect(): Promise<void> {
    try {
      this.stopStreaming();
      this.stopResultPolling();
      
      // 서버에서 클라이언트 등록 해제
      await this.unregisterFromServer();
      
      if (this.wasmModule && this.sharedMemoryHandle) {
        await this.wasmModule.cleanup();
      }
      
      this.isConnected = false;
      this.emit('disconnected');
      logger.info('🔌 연결 해제');
      
    } catch (error) {
      logger.error(`❌ 연결 해제 실패: ${error}`);
    }
  }

  private async unregisterFromServer(): Promise<void> {
    try {
      const response = await fetch('http://localhost:5000/api/unregister', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          logger.info(`✅ 서버 등록 해제 완료: ${this.clientId}`);
        }
      } else {
        logger.warning(`⚠️ 서버 등록 해제 실패: ${response.statusText}`);
      }
      
    } catch (error) {
      logger.warning(`⚠️ 서버 등록 해제 중 오류: ${error}`);
    }
  }

  getClientId(): string {
    return this.clientId;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getStreamingStatus(): boolean {
    return this.isStreaming;
  }

  getConfig(): SharedMemoryConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<SharedMemoryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('config-updated', this.config);
  }
}

export default SharedMemoryVideoClient;