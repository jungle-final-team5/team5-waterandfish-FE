import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Flame, Target } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useStreakData } from "@/hooks/useStreakData";

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (date: Date) => {
  // 항상 0시 기준으로 YYYY-MM-DD 반환
  return date.toISOString().slice(0, 10);
};

const formatDateKST = (date: Date) => {
  // KST(로컬) 기준으로 YYYY-MM-DD 반환
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - tzOffset);
  return localDate.toISOString().slice(0, 10);
};

const StreakModal = ({ isOpen, onClose }: StreakModalProps) => {
  const { studyDates, currentStreak, longestStreak, loading } = useStreakData();
  const today = new Date();
  
  // 날짜가 학습한 날짜인지 확인하는 함수 (KST 기준 YYYY-MM-DD 문자열로 비교)
  const isStudyDate = (date: Date) => {
    const today = new Date();
    // 오늘 이후(미래)는 무조건 false
    if (date > today) return false;
    return (studyDates ?? []).some(studyDateStr => {
      const studyDate = new Date(studyDateStr + 'T00:00:00Z');
      return (
        date.getUTCFullYear() === studyDate.getUTCFullYear() &&
        date.getUTCMonth() === studyDate.getUTCMonth() &&
        date.getUTCDate() === studyDate.getUTCDate()
      );
    });
  };

  // 오늘 날짜인지 확인하는 함수 (KST 기준 YYYY-MM-DD 문자열로 비교)
  const isToday = (date: Date) => {
    return formatDateKST(date) === formatDateKST(today);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-4 flex items-center justify-center">
            <Flame className="h-6 w-6 text-orange-500 mr-2" />
            연속 학습 기록
          </DialogTitle>
        </DialogHeader>
        
        {/* 통계 정보 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Flame className="h-5 w-5 text-orange-600 mr-1" />
              <span className="text-sm font-medium text-gray-700">현재 연속</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{currentStreak}일</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-5 w-5 text-blue-600 mr-1" />
              <span className="text-sm font-medium text-gray-700">최장 연속</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{longestStreak}일</p>
          </div>
        </div>

        {/* 달력 */}
        <div className="flex justify-center">
          <Calendar
            mode="single"
            className={cn("p-3 pointer-events-auto")}
            components={{
              Day: ({ date, ...props }: { date: Date; displayMonth?: Date; className?: string } & React.ComponentProps<'button'>) => {
                const { displayMonth, className: _ignore, ...buttonProps } = props;
                const isStudy = isStudyDate(date);
                const isTodayDate = isToday(date);
                // 디버깅용 콘솔 로그 추가
                console.log({
                  date,
                  formatDateKST: formatDateKST(date),
                  isStudy,
                  isToday: isTodayDate,
                  studyDates
                });
                let className = "h-8 w-8 font-normal rounded-md mx-[2px] my-[2px] p-0.5 flex items-center justify-center";
                if (isTodayDate && isStudy) {
                  className += " bg-green-600 text-white ring-2 ring-blue-400 font-bold";
                } else if (isStudy) {
                  className += " bg-green-500 text-white hover:bg-green-600 font-semibold";
                } else if (isTodayDate) {
                  className += " bg-blue-100 text-blue-900 font-bold ring-2 ring-blue-400";
                } else {
                  className += " hover:bg-accent hover:text-accent-foreground";
                }
                return (
                  <div className="relative">
                    <button
                      {...buttonProps}
                      className={className}
                    >
                      {date.getDate()}
                    </button>
                    {isStudy && (
                      <div className="absolute -top-1 -right-1">
                        <div className="h-2 w-2 rounded-full"></div>
                      </div>
                    )}
                  </div>
                );
              }
            }}
          />
        </div>

        {/* 범례 */}
        <div className="flex justify-center space-x-6 mt-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-600 rounded mr-2 border border-green-700"></div>
            <span className="text-sm text-gray-600">학습 완료</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 border-2 border-blue-400 rounded mr-2"></div>
            <span className="text-sm text-gray-600">오늘</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-600 border-2 border-blue-400 rounded mr-2"></div>
            <span className="text-sm text-gray-600">오늘+학습</span>
          </div>
        </div>

        {/* 격려 메시지 */}
        <div className="text-center mt-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl">
          <p className="text-gray-700 font-medium">
            🔥 {currentStreak}일 연속 학습 중입니다!
          </p>
          <p className="text-sm text-gray-600 mt-1">
            내일도 계속해서 연속 기록을 이어가세요!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StreakModal;