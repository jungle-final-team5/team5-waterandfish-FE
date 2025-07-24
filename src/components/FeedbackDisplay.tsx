import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';

interface FeedbackDisplayProps {
  feedback: 'correct' | 'incorrect' | null;
  prediction?: any;
  onComplete?: () => void;
}

const FeedbackDisplay = ({ feedback, prediction, onComplete }: FeedbackDisplayProps) => {
  const isCorrect = feedback === 'correct';
  const [countdown, setCountdown] = useState(3);
  const [waitingForNone, setWaitingForNone] = useState(false);
  const [noneCountdown, setNoneCountdown] = useState(0);
  const noneTimerRef = useRef<NodeJS.Timeout | null>(null);

  const lastCheckRef = useRef<number>(0);
const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
// 검사 최소 간격(ms) — 필요에 따라 조정하세요
const CHECK_INTERVAL = 500;

  useEffect(() => {
    if (isCorrect) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // 3초 경과 후 prediction 체크
            checkPredictionAndComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isCorrect]);

  const clearNoneTimer = () => {
    if (noneTimerRef.current) {
      clearInterval(noneTimerRef.current);
      noneTimerRef.current = null;
    }
    setNoneCountdown(0);
  };

  const startNoneTimer = () => {
    console.log('⏳ None이 2초 동안 연속으로 유지되는지 확인 중...');
    clearNoneTimer(); // 기존 타이머 정리
    
    setNoneCountdown(2);
    setWaitingForNone(false); // 타이머 시작 시 대기 상태 해제
    
    noneTimerRef.current = setInterval(() => {
      setNoneCountdown((prev) => {
        if (prev <= 1) {
          console.log('✅ None이 2초 동안 연속으로 유지되었습니다. 다음으로 진행합니다.');
          clearNoneTimer();
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const checkPredictionAndComplete = () => {
    if (prediction && prediction.toLowerCase() === 'none') {
      // 이미 타이머가 실행 중이 아닐 때만 시작
      if (!noneTimerRef.current) {
        console.log('✅ Prediction이 None입니다. 2초 타이머를 시작합니다.');
        startNoneTimer();
      } else {
        console.log('⏳ None 타이머가 이미 실행 중입니다.');
      }
    } else {
      console.log('⏳ Prediction이 아직 None이 아닙니다. 대기 중...');
      console.log(prediction);
      setWaitingForNone(true);
    }
  };

  // prediction이 변경될 때마다 체크
useEffect(() => {
  const now = Date.now();

  // 실제 검사 로직을 함수로 분리
  const runCheck = () => {
    if (waitingForNone || noneCountdown > 0) {
      if (prediction?.toLowerCase() === 'none') {
        if (!noneTimerRef.current && waitingForNone) {
          console.log('✅ Prediction이 None으로 변경되었습니다. 2초 타이머를 시작합니다.');
          startNoneTimer();
        } else if (noneTimerRef.current) {
          console.log('⏳ None 타이머가 이미 실행 중입니다.');
        }
      } else if (prediction && prediction.toLowerCase() !== 'none') {
        console.log('❌ Prediction이 None이 아님으로 변경됨. 타이머를 리셋하고 대기 상태로 돌아갑니다.');
        clearNoneTimer();
        setWaitingForNone(true);
      }
    }
  };

  const timeSince = now - lastCheckRef.current;
  if (timeSince >= CHECK_INTERVAL) {
    // 마지막 실행 시점과 충분한 간격이 있으면 즉시 실행
    lastCheckRef.current = now;
    console.log("실행!!");
    runCheck();
  } else {
    // 그렇지 않으면, 남은 시간 후에 한 번만 실행 예약
    if (!throttleTimerRef.current) {
      throttleTimerRef.current = setTimeout(() => {
        lastCheckRef.current = Date.now();
        runCheck();
        throttleTimerRef.current = null;
      }, CHECK_INTERVAL - timeSince);
    }
  }

  // cleanup: 언마운트 시 예약된 타이머 취소
  return () => {
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
      throttleTimerRef.current = null;
    }
  };
}, [prediction, waitingForNone, noneCountdown, onComplete]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      clearNoneTimer();
    };
  }, []);

  if (isCorrect) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-500">
        <Card className="border-4 border-green-500 bg-green-50 max-w-md w-full mx-4 animate-in zoom-in-95 duration-700">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-6">
              {/* 큰 성공 아이콘 */}
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-green-500 animate-bounce">
                  <CheckCircle className="h-16 w-16 text-white" />
                </div>
              </div>
              
              {/* 성공 메시지 */}
              <div>
                <h2 className="text-3xl font-bold text-green-800 mb-3">
                  정답입니다! 🎉
                </h2>
                <p className="text-lg text-green-700 mb-4">
                  수어 동작을 정확하게 수행했습니다!
                </p>
                
                {/* 카운트다운 및 대기 상태 */}
                {countdown > 0 ? (
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-sm text-green-600">다음 수어까지</span>
                    <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg animate-pulse">
                      {countdown}
                    </div>
                    <span className="text-sm text-green-600">초</span>
                  </div>
                ) : noneCountdown > 0 ? (
                  <div className="text-sm text-green-600">
                    <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg animate-pulse mx-auto mb-2">
                      {noneCountdown}
                    </div>
                    손을 그대로 유지하세요...
                  </div>
                ) : waitingForNone ? (
                  <div className="text-sm text-green-600">
                    <div className="animate-spin inline-block w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full mr-2"></div>
                    손을 내려주세요...
                  </div>
                ) : (
                  <div className="text-sm text-green-600">
                    다음 수어로 이동 중...
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 오답일 때는 모달 형태로 표시
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-500">
      <Card className="border-4 border-red-500 bg-red-50 max-w-md w-full mx-4 animate-in zoom-in-95 duration-700">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-6">
            {/* 큰 실패 아이콘 */}
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-red-500 animate-bounce">
                <XCircle className="h-16 w-16 text-white" />
              </div>
            </div>
            
            {/* 실패 메시지 */}
            <div>
              <h2 className="text-3xl font-bold text-red-800 mb-3">
                시간 초과! ⏰
              </h2>
              <p className="text-lg text-red-700 mb-4">
                15초 내에 수어를 완성하지 못했습니다.
              </p>
              
              {/* 개선 힌트 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-1">개선 힌트</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• 손가락 모양을 다시 확인해보세요</li>
                      <li>• 손목의 각도를 조정해보세요</li>
                      <li>• 예시 영상을 다시 천천히 관찰해보세요</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* 다음 문제로 이동 중 메시지 */}
              <div className="text-sm text-red-600 mt-4">
                <div className="animate-spin inline-block w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full mr-2"></div>
                다음 문제로 이동 중...
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackDisplay;