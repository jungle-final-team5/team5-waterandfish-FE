import ExampleAnim from '@/components/ExampleAnim';

interface LearningDisplayProps {
  data: any;
  currentFrame: number;
  currentSign: any;
}

const LearningDisplay = ({ data, currentFrame, currentSign }: LearningDisplayProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">수어 예시</h3>
      <ExampleAnim data={data} currentFrame={currentFrame} showCylinders={true} showLeftHand={true} showRightHand={true} />
      
      {/* 현재 수어 텍스트 표시 */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="text-center">
          <p className="text-sm text-blue-600 mb-2">따라해보세요</p>
          <h2 className="text-3xl font-bold text-blue-800">
            "{currentSign.word}"
          </h2>
        </div>
      </div>
    </div>
  );
};

export default LearningDisplay; 