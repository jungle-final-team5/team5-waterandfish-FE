import { Pose, Results } from '@mediapipe/pose';

export function createPoseHandler(
  onPoseDetected: (
    shoulder: { x: number } | null, 
    wrist: { x: number } | null, 
    isHandDetected: boolean
  ) => void
) {
  const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
  });

  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  pose.onResults((results: Results) => {
    if (!results.poseLandmarks) {
      onPoseDetected(null, null, false);
      return;
    }
    
    const rightShoulder = results.poseLandmarks[12];
    const rightWrist = results.poseLandmarks[16];
    
    // 손이 감지됐는지 확인 (어깨와 손목이 모두 감지되어야 함)
    const isHandDetected = !!(rightShoulder && rightWrist);
    
    onPoseDetected(rightShoulder, rightWrist, isHandDetected);
  });

  return pose;
}

// const pose = createPoseHandler((rightShoulder, rightWrist, isHandDetected) => {
//     if (isHandDetected && rightWrist.x < rightShoulder.x) {
//       setup.current = true;
//     }
//     if (setup.current && isHandDetected && rightWrist.x > rightShoulder.x) {
//       setStart(true);
//     }
//   }); setup은 Ref로 start는 state로 관리하면 될것같습니다