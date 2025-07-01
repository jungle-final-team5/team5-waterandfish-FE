import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Clock } from 'lucide-react';

interface SessionHeaderProps {
  isQuizMode: boolean;
  currentSign: any;
  chapter: any;
  currentSignIndex: number;
  progress: number;
  categoryId: string | undefined;
  navigate: (path: string) => void;
}

const SessionHeader = ({ 
  isQuizMode, 
  currentSign, 
  chapter, 
  currentSignIndex, 
  progress, 
  categoryId, 
  navigate 
}: SessionHeaderProps) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/learn/category/${categoryId}`)}
              className="hover:bg-blue-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              뒤로
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {isQuizMode ? '퀴즈' : '학습'}: {currentSign.word}
              </h1>
              <p className="text-sm text-gray-600">
                {chapter.title} • {currentSignIndex + 1}/{chapter.signs.length}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isQuizMode && (
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">퀴즈 모드</span>
              </div>
            )}
            <div className="w-32">
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SessionHeader; 