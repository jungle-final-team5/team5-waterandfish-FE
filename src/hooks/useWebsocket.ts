import React, { useState, useEffect, createContext, useContext } from 'react';
import WebSocketAutoReconnectService from '@/services/WebSocketAutoReconnect';

// 개별 웹소켓 연결 상태 타입
interface WebSocketConnection {
    id: string;
    url: string;
    ws: WebSocket | null;
    status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';
    error: string | null;
    connectedAt: Date | null;
    lastAttemptAt: Date | null;
    attemptCount: number;
    autoReconnect: boolean;
}

// 전역 웹소켓 상태 타입
interface WebSocketState {
    connections: WebSocketConnection[];
    globalStatus: 'disconnected' | 'connecting' | 'connected' | 'error' | 'partial';
    totalConnections: number;
    connectedCount: number;
    errorCount: number;
    lastConnectedTime: Date | null;
    globalError: string | null;
    wsUrls: string[];
}

// 전역 웹소켓 컨텍스트 타입
interface WebSocketContextType extends WebSocketState {
    connectToWebSockets: (urls: string[], autoReconnect?: boolean) => WebSocketConnection[];
    disconnectWebSockets: () => void;
    disconnectWebSocket: (id: string) => void;
    reconnectWebSocket: (id: string) => void;
    getConnection: (id: string) => WebSocketConnection | undefined;
    getConnectionByUrl: (url: string) => WebSocketConnection | undefined;
    setGlobalError: (error: string | null) => void;
}

// 전역 웹소켓 상태
let globalWebSocketState: WebSocketState = {
    connections: [],
    globalStatus: 'disconnected',
    totalConnections: 0,
    connectedCount: 0,
    errorCount: 0,
    lastConnectedTime: null,
    globalError: null,
    wsUrls: []
};

// 상태 변경 리스너들
const stateListeners = new Set<() => void>();

// 상태 업데이트 함수
const updateGlobalState = (newState: Partial<WebSocketState>) => {
    globalWebSocketState = { ...globalWebSocketState, ...newState };
    stateListeners.forEach(listener => listener());
};

// 개별 연결 상태 업데이트
const updateConnection = (id: string, updates: Partial<WebSocketConnection>) => {
    // 
    const connections = globalWebSocketState.connections.map(conn =>
        conn.id === id ? { ...conn, ...updates } : conn
    );

    // 전체 상태 계산
    const connectedCount = connections.filter(c => c.status === 'connected').length;
    const errorCount = connections.filter(c => c.status === 'error').length;
    const connectingCount = connections.filter(c => c.status === 'connecting' || c.status === 'reconnecting').length;

    let globalStatus: WebSocketState['globalStatus'] = 'disconnected';
    if (connectedCount === connections.length && connections.length > 0) {
        globalStatus = 'connected';
    } else if (connectedCount > 0) {
        globalStatus = 'partial';
    } else if (connectingCount > 0) {
        globalStatus = 'connecting';
    } else if (errorCount > 0) {
        globalStatus = 'error';
    }

    updateGlobalState({
        connections,
        globalStatus,
        connectedCount,
        errorCount,
        lastConnectedTime: connectedCount > 0 ? new Date() : globalWebSocketState.lastConnectedTime
    });
};

// 고유 ID 생성
const generateConnectionId = (url: string) => {
    return `ws_${url.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
};

// 단일 웹소켓 연결
const connectToWebSocket = (url: string, autoReconnect: boolean = true): WebSocketConnection => {
    const id = generateConnectionId(url);
    const connection: WebSocketConnection = {
        id,
        url,
        ws: null,
        status: 'connecting',
        error: null,
        connectedAt: null,
        lastAttemptAt: new Date(),
        attemptCount: 1,
        autoReconnect
    };

    // 연결 상태를 먼저 업데이트
    const existingConnections = globalWebSocketState.connections.filter(c => c.url !== url);
    updateGlobalState({
        connections: [...existingConnections, connection],
        totalConnections: existingConnections.length + 1
    });

    console.log(`Connecting to WebSocket: ${url}`);

    try {
        let wsUrl = url;
        if (typeof window !== 'undefined' && window.location.protocol === 'https:' && wsUrl.startsWith('ws://')) {
            wsUrl = wsUrl.replace('ws://', 'wss://');
        }
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log(`WebSocket connected: ${url}`);
            updateConnection(id, {
                ws,
                status: 'connected',
                error: null,
                connectedAt: new Date(),
                attemptCount: 1
            });
        };

        ws.onclose = (event) => {
            console.log(`WebSocket disconnected: ${url}`, event.code, event.reason);
            updateConnection(id, {
                ws: null,
                status: 'disconnected',
                error: event.reason || `Connection closed (${event.code})`
            });
        };

        ws.onerror = (error) => {
            console.error(`WebSocket error: ${url}`, error);
            updateConnection(id, {
                ws: null,
                status: 'error',
                error: `Connection error: ${error.toString()}`
            });
        };

        ws.onmessage = (event) => {
            // 메시지 수신 시 연결 상태 확인
            updateConnection(id, {
                connectedAt: new Date()
            });
        };

        // 연결 객체에 WebSocket 인스턴스 저장
        updateConnection(id, { ws });

        return { ...connection, ws };
    } catch (error) {
        console.error(`Failed to create WebSocket: ${url}`, error);
        updateConnection(id, {
            status: 'error',
            error: `Failed to create connection: ${error}`
        });
        return connection;
    }
};

// 다중 웹소켓 연결
const connectToWebSockets = (wsUrls: string[], autoReconnect: boolean = true): WebSocketConnection[] => {
    const uniqueWsUrls = [...new Set(wsUrls)];
    console.log(`Connecting to ${uniqueWsUrls.length} WebSocket(s)`);

    // 기존 연결 정리
    // disconnectWebSockets();

    const connections: WebSocketConnection[] = [];

    for (const url of uniqueWsUrls) {
        const connection = connectToWebSocket(url, autoReconnect);
        connections.push(connection);
    }
    globalWebSocketState.wsUrls = uniqueWsUrls;
    return connections;
};

// 개별 웹소켓 연결 해제
const disconnectWebSocket = (id: string) => {
    const connection = globalWebSocketState.connections.find(c => c.id === id);
    if (connection && connection.ws) {
        if (connection.ws.readyState === WebSocket.OPEN || connection.ws.readyState === WebSocket.CONNECTING) {
            connection.ws.close();
        }

        updateConnection(id, {
            ws: null,
            status: 'disconnected',
            error: null
        });
    }
};

// 모든 웹소켓 연결 해제
const disconnectWebSockets = () => {
    globalWebSocketState.connections.forEach(connection => {
        if (connection.ws && (connection.ws.readyState === WebSocket.OPEN || connection.ws.readyState === WebSocket.CONNECTING)) {
            connection.ws.close();
        }
    });

    updateGlobalState({
        connections: [],
        globalStatus: 'disconnected',
        totalConnections: 0,
        connectedCount: 0,
        errorCount: 0,
        lastConnectedTime: null,
        globalError: null
    });
};

// 개별 연결 재연결
const reconnectWebSocket = (id: string) => {
    const connection = globalWebSocketState.connections.find(c => c.id === id);
    if (!connection) return;

    // 기존 연결 정리
    if (connection.ws) {
        connection.ws.close();
    }

    // 재연결 시도
    updateConnection(id, {
        ws: null,
        status: 'reconnecting',
        error: null,
        lastAttemptAt: new Date(),
        attemptCount: connection.attemptCount + 1
    });

    // 새 연결 생성
    const newConnection = connectToWebSocket(connection.url, connection.autoReconnect);
    updateConnection(id, {
        ws: newConnection.ws,
        status: newConnection.status
    });
};

// 연결 조회 함수들
const getConnection = (id: string): WebSocketConnection | undefined => {
    return globalWebSocketState.connections.find(c => c.id === id);
};

const getConnectionByUrl = (url: string): WebSocketConnection | undefined => {
    return globalWebSocketState.connections.find(c => c.url === url);
};

// 레거시 지원을 위한 호환성 계산
const getCompatibleState = () => {
    const wsList = globalWebSocketState.connections.map(c => c.ws).filter(Boolean) as WebSocket[];
    const wsUrls = globalWebSocketState.connections.map(c => c.url);

    let connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
    if (globalWebSocketState.globalStatus === 'connected') {
        connectionStatus = 'connected';
    } else if (globalWebSocketState.globalStatus === 'connecting') {
        connectionStatus = 'connecting';
    } else if (globalWebSocketState.globalStatus === 'error') {
        connectionStatus = 'error';
    } else if (globalWebSocketState.globalStatus === 'partial') {
        connectionStatus = 'connected'; // 부분 연결도 연결된 것으로 간주
    }

    return {
        wsList,
        wsUrls,
        connectionStatus,
        connectionAttempts: globalWebSocketState.connections.reduce((sum, c) => sum + c.attemptCount, 0),
        lastConnectedTime: globalWebSocketState.lastConnectedTime,
        error: globalWebSocketState.globalError
    };
};

// 메시지 전송 함수
const sendMessage = (message: string | ArrayBuffer | Blob, connectionId?: string) => {
    if (connectionId) {
        // 특정 연결로 메시지 전송
        // console.log('[sendMessage] connectionId', connectionId);
        const connection = getConnection(connectionId);
        if (connection?.ws?.readyState === WebSocket.OPEN) {
            connection.ws.send(message);
            return true;
        }
        return false;
    } else {
        // 모든 연결된 웹소켓으로 메시지 전송
        //console.log('[sendMessage] globalWebSocketState.wsUrls', globalWebSocketState.wsUrls);
        const connectedSockets = globalWebSocketState.connections.filter(
            conn => conn.ws?.readyState === WebSocket.OPEN
        );

        if (connectedSockets.length === 0) {
            return false;
        }

        let successCount = 0;
        connectedSockets.forEach(conn => {
            try {
                conn.ws!.send(message);
                successCount++;
            } catch (error) {
                console.error(`Failed to send message to ${conn.url}:`, error);
            }
        });

        return successCount > 0;
    }
};

// 모든 연결된 웹소켓으로 메시지 브로드캐스트
const broadcastMessage = (message: string | ArrayBuffer | Blob) => {
    return sendMessage(message);
};

// 자동 재연결 서비스 인스턴스
const autoReconnectService = WebSocketAutoReconnectService.getInstance();

// 커스텀 훅
const useWebsocket = (wsUrls?: string[]) => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<
        'disconnected' | 'connecting' | 'connected' | 'error'
    >('disconnected');
    const wsList = globalWebSocketState.connections.map(c => c.ws).filter(Boolean) as WebSocket[];

    const [state, setState] = useState(() => ({
        ...globalWebSocketState,
        ...getCompatibleState()
    }));

    useEffect(() => {
        const listener = () => {
            setState({
                ...globalWebSocketState,
                ...getCompatibleState()
            });
        };

        stateListeners.add(listener);

        return () => {
            stateListeners.delete(listener);
        };
    }, []);

    // 자동 재연결 서비스 시작 (연결이 있을 때만)
    useEffect(() => {
        if (globalWebSocketState.connections.length > 0) {
            autoReconnectService.start();
        } else {
            autoReconnectService.stop();
        }
    }, [globalWebSocketState.connections.length]);

    return {
        ...state,
        connectToWebSockets,
        disconnectWebSockets,
        disconnectWebSocket,
        reconnectWebSocket,
        getConnection,
        getConnectionByUrl,
        sendMessage,
        broadcastMessage,
        // 자동 재연결 서비스 제어
        autoReconnectService: {
            start: () => autoReconnectService.start(),
            stop: () => autoReconnectService.stop(),
            getStatus: () => autoReconnectService.getStatus(),
            updateConfig: (config: any) => autoReconnectService.updateConfig(config),
            cancelReconnect: (connectionId: string) => autoReconnectService.cancelReconnect(connectionId),
            getReconnectState: (connectionId: string) => autoReconnectService.getReconnectState(connectionId),
            getAllReconnectStates: () => autoReconnectService.getAllReconnectStates()
        },
        setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => {
            updateGlobalState({ globalError: null });
        },
        setError: (error: string | null) => {
            updateGlobalState({ globalError: error });
        }
    };
};

// 전역 웹소켓 상태 접근 함수
const getGlobalWebSocketState = () => globalWebSocketState;

export default useWebsocket;
export {
    connectToWebSocket,
    connectToWebSockets,
    disconnectWebSockets,
    disconnectWebSocket,
    reconnectWebSocket,
    getConnection,
    getConnectionByUrl,
    sendMessage,
    broadcastMessage,
    getGlobalWebSocketState,
    autoReconnectService,
    type WebSocketConnection,
    type WebSocketState
};