import { useCallback, useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useWebsocket from "./useWebsocket";
import { Lesson } from "@/types/learning";

//===============================================
// 분류 서버 관련 훅
//===============================================

// 재시도 설정
const RETRY_CONFIG = {
    maxAttempts: 3,
    initialDelay: 1000, // 1초
    maxDelay: 5000, // 5초
};

export const useClassifierClient = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { connectionStatus, wsList, sendMessage, getConnectionByUrl } = useWebsocket();

    // 상태 관리
    const [retryAttempts, setRetryAttempts] = useState({
        lessonMapper: 0,
        wsConnection: 0,
    });
    const [isRetrying, setIsRetrying] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [currentConnectionId, setCurrentConnectionId] = useState<string>('');
    const [currentWsUrl, setCurrentWsUrl] = useState<string>('');
    const [lessonMapper, setLessonMapper] = useState<Record<string, string>>({});
    const [currentSignId, setCurrentSignId] = useState<string>('');
    const [currentSign, setCurrentSign] = useState<Lesson>(null);
    const [currentResult, setCurrentResult] = useState<any>(null);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [displayConfidence, setDisplayConfidence] = useState<string>('');
    const [maxConfidence, setMaxConfidence] = useState<number>(0);
    const [isBufferingPaused, setIsBufferingPaused] = useState<boolean>(false);
    const [bufferingPauseTime, setBufferingPauseTime] = useState<number>(0);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    // refs
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const studyListRef = useRef<string[]>([]);

    // 초기화 로직
    useEffect(() => {
        // location.state에서 lesson_mapper가 있으면 초기화
        if (location.state?.lesson_mapper && 
            Object.keys(location.state.lesson_mapper).length > 0 &&
            typeof location.state.lesson_mapper === 'object') {
            setLessonMapper(location.state.lesson_mapper);
            console.log('[LearnSession] lesson_mapper 초기화 완료:', Object.keys(location.state.lesson_mapper).length, '개 항목');
        }
        setIsInitialized(true);
    }, [location.state?.lesson_mapper]);

    // lesson_mapper 재시도 함수
    const retryLessonMapper = useCallback(async () => {
        if (retryAttempts.lessonMapper >= RETRY_CONFIG.maxAttempts) {
            console.error('[LearnSession] lesson_mapper 재시도 횟수 초과');
            alert('데이터를 불러오는데 실패했습니다. 페이지를 새로고침하거나 다시 시도해주세요.');
            setIsRetrying(false);
            return;
        }

        setIsRetrying(true);
        const delay = Math.min(
            RETRY_CONFIG.initialDelay * Math.pow(2, retryAttempts.lessonMapper),
            RETRY_CONFIG.maxDelay
        );

        console.log(`[LearnSession] lesson_mapper 재시도 ${retryAttempts.lessonMapper + 1}/${RETRY_CONFIG.maxAttempts} (${delay}ms 후)`);

        retryTimeoutRef.current = setTimeout(() => {
            // 이전 페이지로 돌아가서 다시 데이터 받아오기
            if (location.state?.lesson_mapper && 
                Object.keys(location.state.lesson_mapper).length > 0 &&
                typeof location.state.lesson_mapper === 'object') {
                setLessonMapper(location.state.lesson_mapper);
                setRetryAttempts(prev => ({ ...prev, lessonMapper: 0 }));
                // WebSocket 연결도 성공했거나 재시도가 필요없으면 전체 재시도 상태 해제
                if (retryAttempts.wsConnection === 0 && currentConnectionId) {
                    setIsRetrying(false);
                }
                console.log('[LearnSession] lesson_mapper 재시도 성공');
            } else {
                console.warn('[LearnSession] location.state에 유효한 lesson_mapper가 없음:', location.state?.lesson_mapper);
                setRetryAttempts(prev => ({ ...prev, lessonMapper: prev.lessonMapper + 1 }));
                retryLessonMapper();
            }
        }, delay);
    }, [retryAttempts.lessonMapper, retryAttempts.wsConnection, location.state, currentConnectionId]);

    // WebSocket 연결 재시도 함수
    const retryWsConnection = useCallback(async (targetUrl: string) => {
        if (retryAttempts.wsConnection >= RETRY_CONFIG.maxAttempts) {
            console.error('[LearnSession] WebSocket 연결 재시도 횟수 초과');
            alert('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
            navigate("/");
            setIsRetrying(false);
            return;
        }

        setIsRetrying(true);
        const delay = Math.min(
            RETRY_CONFIG.initialDelay * Math.pow(2, retryAttempts.wsConnection),
            RETRY_CONFIG.maxDelay
        );

        // console.log(`[LearnSession] WebSocket 연결 재시도 ${retryAttempts.wsConnection + 1}/${RETRY_CONFIG.maxAttempts} (${delay}ms 후)`);

        retryTimeoutRef.current = setTimeout(() => {
            const connection = getConnectionByUrl(targetUrl);
            if (connection) {
                setCurrentConnectionId(connection.id);
                setRetryAttempts(prev => ({ ...prev, wsConnection: 0 }));
                // lesson_mapper도 성공했거나 재시도가 필요없으면 전체 재시도 상태 해제
                if (retryAttempts.lessonMapper === 0 && Object.keys(lessonMapper).length > 0) {
                    setIsRetrying(false);
                }
                console.log('[LearnSession] WebSocket 연결 재시도 성공:', connection.id);
            } else {
                setRetryAttempts(prev => ({ ...prev, wsConnection: prev.wsConnection + 1 }));
                retryWsConnection(targetUrl);
            }
        }, delay);
    }, [retryAttempts.wsConnection, retryAttempts.lessonMapper, lessonMapper, navigate, getConnectionByUrl]);

    // WebSocket 연결 상태 모니터링
    useEffect(() => {
        // connectionStatus가 변경될 때마다 isConnected 업데이트
        const isWsConnected = connectionStatus === 'connected' && wsList.length > 0;
        setIsConnected(isWsConnected);
        // 연결 상태가 변경될 때만 로그 출력
        if (isWsConnected !== (connectionStatus === 'connected' && wsList.length > 0)) {
            console.log(`🔌 WebSocket 연결 상태: ${connectionStatus}, 연결된 소켓: ${wsList.length}개`);
        }
    }, [connectionStatus, wsList.length]);

    // 이전 connectionId 추적을 위한 ref
    const prevConnectionIdRef = useRef<string>('');

    // connectionId 변경 시 비디오 스트리밍 갱신
    useEffect(() => {
        // 실제로 connectionId가 변경되었을 때만 처리
        if (currentConnectionId &&
            currentConnectionId !== prevConnectionIdRef.current &&
            prevConnectionIdRef.current !== '') {
            console.log('[LearnSession] connectionId 변경:', prevConnectionIdRef.current, '->', currentConnectionId);
        }
        // connectionId 업데이트
        if (currentConnectionId) {
            prevConnectionIdRef.current = currentConnectionId;
        }
    }, [currentConnectionId]);

    // 현재 수어에 대한 ws url 출력
    useEffect(() => {
        // 초기화가 완료되지 않았으면 처리하지 않음
        if (!isInitialized) {
            return;
        }

        if (currentSignId) {
            const wsUrl = lessonMapper[currentSignId] || '';
            setCurrentWsUrl(wsUrl);

            if (wsUrl) {
                const connection = getConnectionByUrl(wsUrl);
                if (connection) {
                    setCurrentConnectionId(connection.id);
                    setRetryAttempts(prev => ({ ...prev, wsConnection: 0 })); // 성공 시 재시도 카운터 리셋
                } else {
                    console.warn(`[LearnSession] No connection found for targetUrl: ${wsUrl}, 재시도 시작`);
                    retryWsConnection(wsUrl);
                }
            } else {
                console.warn('[LearnSession] currentSignId에 대한 WebSocket URL이 없음:', currentSignId);
                // lesson_mapper에 해당 ID가 없으면 lesson_mapper 재시도
                // 단, lesson_mapper가 비어있고 location.state에 lesson_mapper가 있는 경우에만 재시도
                if (Object.keys(lessonMapper).length === 0 && location.state?.lesson_mapper) {
                    console.log('[LearnSession] lesson_mapper가 비어있고 location.state에 lesson_mapper가 있음, 재시도 시작');
                    retryLessonMapper();
                } else if (Object.keys(lessonMapper).length === 0) {
                    console.warn('[LearnSession] lesson_mapper가 비어있고 location.state에도 lesson_mapper가 없음');
                }
            }
        }
    }, [currentSignId, lessonMapper, retryWsConnection, retryLessonMapper, getConnectionByUrl, location.state, isInitialized]);

    // 소켓 메시지 수신 처리
    useEffect(() => {
        if (wsList && wsList.length > 0) {
            // 각 소켓에 대해 핸들러 등록
            const handlers: { ws: WebSocket; fn: (e: MessageEvent) => void }[] = [];
            setMaxConfidence(0);

            wsList.forEach(ws => {
                const handleMessage = (event: MessageEvent) => {
                    try {
                        const msg = JSON.parse(event.data);
                        switch (msg.type) {
                            case 'classification_result': {

                                // 버퍼링 일시정지 중에 None 감지 시 버퍼링 재개
                                if (isBufferingPaused && msg.data && msg.data.prediction !== "None") {
                                    setDisplayConfidence("빠른 동작 감지");
                                    return;
                                } else if (isBufferingPaused && msg.data && msg.data.prediction === "None") {
                                    setIsBufferingPaused(false);
                                    return;
                                }


                                // console.log('받은 분류 결과:', msg.data);
                                if (feedback && msg.data.prediction === "None") {
                                    setCurrentResult(msg.data);
                                    break;
                                }
                                const { prediction, confidence, probabilities } = msg.data;
                                const target = currentSign?.word;
                                let percent: number | undefined = undefined;
                                if (prediction === target) {
                                    percent = confidence * 100;
                                } else if (probabilities && target && probabilities[target] != null) {
                                    percent = probabilities[target] * 100;
                                }
                                else {
                                    setDisplayConfidence("[연결 대기 중]");
                                }
                                if (percent != null) {
                                    setDisplayConfidence(`${percent.toFixed(1)}%`);
                                }
                                setCurrentResult(msg.data);
                                if (percent >= 80.0) {
                                    setFeedback("correct");
                                    studyListRef.current.push(currentSign.id);
                                    console.log("PASSED");
                                }
                                break;
                            }
                            default:
                                break;
                        }
                    } catch (e) {
                        console.error('WebSocket 메시지 파싱 오류:', e);
                    }
                };
                ws.addEventListener('message', handleMessage);
                handlers.push({ ws, fn: handleMessage });
            });

            // 정리: 컴포넌트 언마운트 혹은 wsList 변경 시 리스너 해제
            return () => {
                handlers.forEach(({ ws, fn }) => {
                    ws.removeEventListener('message', fn);
                });
            };
        }
    }, [wsList, isBufferingPaused, feedback, currentSign, currentSignId]);

    // 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, []);

    return {
        // 상태
        isRetrying,
        isConnected,
        currentConnectionId,
        currentWsUrl,
        lessonMapper,
        currentSignId,
        currentSign,
        currentResult,
        setCurrentResult,
        feedback,
        displayConfidence,
        maxConfidence,
        isBufferingPaused,
        isInitialized,
        studyList: studyListRef.current,
        bufferingPauseTime,
        // 상태 설정 함수들
        setCurrentSignId,
        setCurrentSign,
        setLessonMapper,
        setFeedback,
        setDisplayConfidence,
        setMaxConfidence,
        setIsBufferingPaused,
        setBufferingPauseTime,
        // 재시도 함수들
        retryLessonMapper,
        retryWsConnection,
        
        // WebSocket 관련
        connectionStatus,
        wsList,
        sendMessage,
    };
};