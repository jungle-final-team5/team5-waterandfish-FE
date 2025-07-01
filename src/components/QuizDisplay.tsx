import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface QuizDisplayProps {
  currentSign: any;
  quizStarted: boolean;
  feedback: 'correct' | 'incorrect' | null;
  handleNextSign: () => void;
}

const QuizDisplay = ({ currentSign, quizStarted, feedback, handleNextSign }: QuizDisplayProps) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">수행할 수어</h3>
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 min-h-[400px]">
        <CardContent className="pt-8">
          <div className="text-center flex flex-col justify-center h-full min-h-[350px]">
            <div className="text-8xl mb-8">🤟</div>
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              "{currentSign.word}"
            </h2>
            <p className="text-lg text-gray-600">
              위 단어를 수어로 표현해보세요
            </p>
            {!quizStarted && (
              <p className="text-sm text-blue-600 mt-4">
                퀴즈가 자동으로 시작됩니다
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* 퀴즈 모드 건너뛰기 버튼 */}
      {quizStarted && !feedback && (
        <div className="flex justify-center">
          <Button 
            onClick={handleNextSign}
            variant="outline"
            className="border-gray-400 text-gray-600 hover:bg-gray-50"
          >
            건너뛰기
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuizDisplay; 