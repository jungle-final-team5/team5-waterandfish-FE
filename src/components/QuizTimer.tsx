import { useState, useEffect, useRef } from 'react';

interface QuizTimerProps {
  duration: number; // 초 단위
  onTimeUp: () => void;
  isActive: boolean;
  onReset?: () => void;
  onTimeChange?: (timeLeft: number) => void; // 시간 변경 콜백 추가
}

const QuizTimer = ({ duration, onTimeUp, isActive, onTimeChange }: QuizTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const timeref = useRef<HTMLDivElement | null>(null);

  // isActive가 true가 될 때만 타이머 초기화 및 시작
  useEffect(() => {
    if (isActive) {
      console.log('⏰ 타이머 시작:', duration, '초');
      setTimeLeft(duration);
    } else {
        
      console.log('⏸️ 타이머 정지');
    }
  }, [isActive, duration]);

  useEffect(() => {
    if (!isActive) return;

    console.log('🔄 타이머 카운트다운 시작');
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        // console.log('⏱️ 타이머:', prev, '초 남음');
        if (prev <= 1) {
          console.log('⏰ 시간 초과!');
          onTimeUp();
          return 0;
        }
        const newTimeLeft = prev - 1;
        if (onTimeChange) {
          onTimeChange(newTimeLeft);
        }
        return newTimeLeft;
      });
    }, 1000);

    return () => {
      console.log('🛑 타이머 정리');
      clearInterval(interval);
    };
  }, [isActive, onTimeUp, onTimeChange]);

  const isWarning = timeLeft <= 5;

  return (
    <div className="flex flex-col items-center mb-4">
      <div className="relative flex items-center justify-center w-64 h-64">
        <svg className="absolute top-0 left-0 w-64 h-64" viewBox="0 0 256 256">
          <circle
            cx="128"
            cy="128"
            r="112"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="24"
          />
          {timeLeft > 0 && (
            <circle
              cx="128"
              cy="128"
              r="112"
              fill="none"
              stroke={isWarning ? "#ef4444" : "#2563eb"} // 5초 이하일 때 빨간색
              strokeWidth="24"
              strokeDasharray={2 * Math.PI * 112}
              strokeDashoffset={2 * Math.PI * 112 * (1 - (timeLeft - 1) / (duration - 1))}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          )}
        </svg>
        <div ref={timeref} className="absolute text-[7rem] font-extrabold text-gray-800 text-center select-none w-full h-full flex items-center justify-center">
          {timeLeft}
        </div>
      </div>
    </div>
  );
};

export default QuizTimer;
