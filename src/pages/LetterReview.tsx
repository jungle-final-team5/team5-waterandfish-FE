import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useRef, useState } from 'react';

import { drawLandmarks, drawOverlayMessage, drawWarningMessage } from '../components/draw/draw';
import { detectGesture } from '../components/draw/RightDetector';
import API from '@/components/AxiosInstance';
import SessionHeader from '@/components/SessionHeader';
import LetterDisplay from '@/components/LetterDisplay';
import { Hands } from '@mediapipe/hands';
import { set } from 'lodash';

const LetterReview = () => {
  const [gesture, setGesture] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraInitializing, setIsCameraInitializing] = useState(true);
  const navigate = useNavigate();
  
  function divwords(word){
        decref.current.textContent = '';
        setIsDone(false);
        std.current
        for(let i = 0;i<word.length;i++){
            const char = word[i];
            const code = char.charCodeAt(0);
            if((code>=12593&&code<=12622) || (code >= 12623 && code <= 12643)) {
                decref.current.textContent += char;
                continue;
            }
            else if (code < 0xAC00 || code > 0xD7A3) continue; // 한글 아니면 패스

            const offset = code - 0xAC00;
            const cho = CHO[Math.floor(offset / (21 * 28))];
            const jung = JUNG[Math.floor((offset % (21 * 28)) / 28)];
            const jong = JONG[offset % 28];
            decref.current.textContent += (doublesc[cho]||cho);
            decref.current.textContent += (doublesc[jung]||jung);
            if (jong) decref.current.textContent += (doublesc[jong] || jong);
        }
        pileref.current.textContent = '';
    }
    const studyResultRef = useRef<string[]>([]);
    const { setType } = useParams();
    const [sets, setSets] = useState<string[]>([]);

    useEffect(() => {
      if (setType === 'consonant' || setType === 'vowel') {
        API.get(`progress/failures/letter/${setType}`).then(res => {
          setSets(res.data.data || []);
        });
      } else {
        setSets(["수어지교", "기초연습"]);
      }
    }, [setType]);
  const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  const JUNG = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"];
  const JONG = ["", "ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  const doublesc = {'ㄲ':'ㄱ'+'ㄱ','ㄳ':'ㄱ'+'ㅅ','ㄵ':'ㄴ'+'ㅈ','ㄶ':'ㄴ'+'ㅎ','ㄸ':'ㄷ'+'ㄷ','ㄺ':'ㄹ'+'ㄱ','ㄻ':'ㄹ'+'ㅁ',
                    'ㄼ':'ㄹ'+'ㅂ','ㄽ':'ㄹ'+'ㅅ','ㄾ':'ㄹ'+'ㅌ','ㄿ':'ㄹ'+'ㅍ','ㅀ':'ㄹ'+'ㅎ','ㅄ':'ㅂ'+'ㅅ','ㅆ':'ㅅ'+'ㅅ','ㅉ':'ㅈ'+'ㅈ',
                    'ㅘ':'ㅗ'+'ㅏ','ㅙ':'ㅗ'+'ㅐ','ㅝ':'ㅜ'+'ㅓ','ㅞ':'ㅜ'+'ㅔ'};
  const sendreviewResult = async () => {

    try {
      await API.post(
        'review/mark/letter/' + setType,
        {},
        {
          withCredentials: true, // ✅ 쿠키 포함
        }
      );
      console.log("결과 전송 완료");
      // 선택: localStorage 초기화
      // localStorage.removeItem('passed');
      // localStorage.removeItem('failed');
    } catch (error) {
      console.error("결과 전송 실패", error);
    }
  };
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const times = useRef(10);
  const timeref = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const decref = useRef<HTMLDivElement | null>(null);
  const pileref = useRef<HTMLDivElement | null>(null);

  const ges = useRef<string | null>(null);
  const pges = useRef<string | null>(null);
  const std = useRef<boolean>(false);
  const navigated = useRef<boolean>(false);

  const [words, setWords] = useState('');

  // 카메라 관련 refs 추가
  const handsRef = useRef<any | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const isInitializingRef = useRef(false);

  const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    // public 폴더의 파일을 가리키도록 수정 (앞에 / 를 붙여 절대 경로로 지정)
    script.src = `/${src}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`${src} 로드 실패`));
    document.body.appendChild(script);
  });
};

  // 카메라 초기화 함수
  const initializeCamera = async () => {
    
    // 이미 초기화 중이면 중복 실행 방지
    if (isInitializingRef.current) {
      console.log('카메라 초기화가 이미 진행 중입니다.');
      return;
    }
    
    try {
      await Promise.all([
        loadScript('hands.js'),
        loadScript('camera_utils.js')
      ]);

      isInitializingRef.current = true;
      setIsCameraInitializing(true);
      setCameraError(null);

      // DOM 요소들이 준비될 때까지 잠시 대기
      let attempts = 0;
      const maxAttempts = 20; // 더 많은 시도 횟수
      
      while (attempts < maxAttempts) {
        const videoElement = videoRef.current;
        const canvasElement = canvasRef.current;
        const resultElement = resultRef.current;

        if (videoElement && canvasElement && resultElement) {
          console.log('DOM 요소들이 준비되었습니다.');
          break;
        }
        
        console.log(`DOM 요소 대기 중... (${attempts + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 150)); // 더 긴 대기 시간
        attempts++;
      }

      const videoElement = videoRef.current;
      const canvasElement = canvasRef.current;
      const resultElement = resultRef.current;

      if (!videoElement || !canvasElement || !resultElement) {
        console.error('DOM 요소 확인:', {
          video: !!videoElement,
          canvas: !!canvasElement,
          result: !!resultElement
        });
        throw new Error('필요한 DOM 요소를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
      }

      const canvasCtx = canvasElement.getContext('2d');
      if (!canvasCtx) {
        throw new Error('Canvas 컨텍스트를 가져올 수 없습니다.');
      }

      // 기존 인스턴스 정리 - 더 안전한 정리
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (error) {
          console.warn('카메라 정리 중 오류:', error);
        }
        cameraRef.current = null;
      }
      
      if (handsRef.current) {
        try {
          handsRef.current.close();
        } catch (error) {
          console.warn('Hands 정리 중 오류:', error);
        }
        handsRef.current = null;
      }
      
      
      // 약간의 지연을 두어 정리가 완료되도록 함
      await new Promise(resolve => setTimeout(resolve, 3000));
          console.log('MediaPipe Hands dynamic load via hands.js');
      // ESM entrypoint인 hands.js를 직접 불러와 실제 클래스 가져오기 (CDN)
// 전역으로 로드된 Hands 생성자 사용
const HandsConstructor = (window as any).Hands;
if (typeof HandsConstructor !== 'function') {
  console.error('window.Hands is not a constructor:', (window as any).Hands);
  throw new Error('MediaPipe Hands 생성자를 찾을 수 없습니다 (global)');
}
const hands = new HandsConstructor({
  locateFile: (file: string) =>
  {
    return `/${file}`;
  },
   
});
console.log('MediaPipe Hands instance created via global script');
    //   // Hands 인스턴스 생성 - 동적 import 사용
    //   console.log('MediaPipe Hands 동적 로드 시작');
      
      
        
    //     const mpHandModule = await import('@mediapipe/hands');
    //     console.log('MediaPipe Hands 로드 성공:', mpHandModule);

    //   console.log('🔍 MediaPipe 모듈 구조 확인:', Object.keys(mpHandModule));
    // console.log('🔍 default export 타입:', typeof mpHandModule.default);

    //   let handSave: any = null;
      
    //   if(mpHandModule.Hands)
    //   {
    //     handSave = mpHandModule.Hands;
    //     console.log("handSave가 hands로");
    //   }
    //   else if(mpHandModule.default)
    //   {
    //     if (typeof mpHandModule.default === 'object' && mpHandModule.default !== null) {
    //     console.log('default export 객체의 키들:', Object.keys(mpHandModule.default));
        
    //     // 다양한 가능한 키 이름 확인
    //     const possibleKeys = ['Hands', 'hands', 'HandsSolution', 'handsSolution'];
    //     for (const key of possibleKeys) {
    //       if (mpHandModule.default[key]) {
    //         handSave = mpHandModule.default[key];
    //         console.log(`✅ default export 객체에서 ${key} 발견`);
    //         break;
    //       }
    //     }
        
    //     // 모든 속성을 순회하며 함수 타입 찾기
    //     if (!handSave) {
    //       for (const [key, value] of Object.entries(mpHandModule.default)) {
    //         if (typeof value === 'function' && key.toLowerCase().includes('holistic')) {
    //           handSave = value;
    //           console.log(`✅ default export에서 함수 발견: ${key}`);
    //           break;
    //         }
    //       }
    //     }
    //   }
    //   // default가 함수인 경우 (생성자일 수 있음)
    //   else if (typeof mpHandModule.default === 'function') {
    //     handSave = mpHandModule.default;
    //     console.log('✅ default export가 Holistic 생성자인 것으로 추정');
    //   }
    // }
      
      
    //   const hands = new handSave({
    //     locateFile: (file) => {
    //       // CDN URL을 더 안정적으로 설정
    //       const baseUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915';
    //       return `${baseUrl}/${file}`;
    //     },
    //   });

      console.log("complete loaded ");

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      hands.onResults((results: any) => {
        if (!canvasCtx || !canvasElement) return;
        
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];
          const handvc = Math.sqrt(
            (landmarks[0].y - landmarks[9].y) ** 2 +
            (landmarks[0].x - landmarks[9].x) ** 2
          );
          const handedness = results.multiHandedness?.[0]?.label || "Unknown";
          if (handvc > 0.13 && handvc <= 0.5) {
            drawLandmarks(canvasCtx, landmarks, canvasElement);
            const gesture = detectGesture(landmarks, handedness);
            if (gesture) {
              resultElement.textContent = `🖐️ ${gesture}`;
              ges.current = gesture;
              setGesture(gesture);
            } else {
              resultElement.textContent = 'Hand detected';
              ges.current = null;
              setProgressPercent(0);
              setGesture(null);
            }
            if (gesture == 'ㄹ' && decref.current?.textContent?.charAt(0) == 'ㅌ') {
              drawWarningMessage(canvasCtx, canvasElement, '검지와 약지를 붙여주세요');
            } else if (gesture == 'ㅌ' && decref.current?.textContent?.charAt(0) == 'ㄹ') {
              drawWarningMessage(canvasCtx, canvasElement, '검지와 중지를 붙여주세요');
            } else if (gesture == 'ㅠ' && decref.current?.textContent?.charAt(0) == 'ㅅ') {
              drawWarningMessage(canvasCtx, canvasElement, '손가락을 벌려주세요');
            } else if (gesture == 'ㅅ' && decref.current?.textContent?.charAt(0) == 'ㅠ') {
              drawWarningMessage(canvasCtx, canvasElement, '손가락을 모아주세요');
            }
          } else {
            drawOverlayMessage(
              canvasCtx,
              canvasElement,
              handvc <= 0.13 ? '손을 앞으로 옮겨주세요' : '손을 뒤로 빼주세요'
            );
            ges.current = null;
          }
        } else {
          resultElement.textContent = 'Waiting for hand...';
          setProgressPercent(0);
        }
        canvasCtx.restore();
      });

      const CameraConstructor = (window as any).Camera;
      // Camera 인스턴스 생성
      console.log(CameraConstructor);
      const camera = new CameraConstructor(videoElement, {
        onFrame: async () => {
          try {
            // hands 인스턴스가 유효한지 확인
            if (hands) {
              await hands.send({ image: videoElement });
            }
          } catch (error) {
            console.error('Hands processing error:', error);
            // BindingError가 발생하면 에러만 로그하고 자동 재시작하지 않음
            if (error.name === 'BindingError' || error.message.includes('deleted object')) {
              console.log('MediaPipe Hands 오류 발생 - 수동으로 카메라 재시작이 필요합니다.');
            }
          }
        },
        width: 640,
        height: 480,
      });

      // 카메라 시작
      await camera.start();
      
      // 성공적으로 초기화되면 refs에 저장
      handsRef.current = hands;
      cameraRef.current = camera;
      setIsCameraInitializing(false);
      retryCountRef.current = 0;
      isInitializingRef.current = false;
      
      console.log('카메라 초기화 성공');

    } catch (error) {
      console.error('카메라 초기화 실패:', error);
      setCameraError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      
      // 재시도 로직
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.log(`카메라 재시도 ${retryCountRef.current}/${maxRetries}`);
        setTimeout(() => {
          initializeCamera();
        }, 2000); // 2초 후 재시도
      } else {
        setIsCameraInitializing(false);
        setCameraError('카메라를 초기화할 수 없습니다. 페이지를 새로고침해주세요.');
      }
      isInitializingRef.current = false;
    }
  };

  // 카메라 재시작 함수
  const restartCamera = () => {
    retryCountRef.current = 0;
    // 재시작 시에도 약간의 지연을 두어 DOM이 준비될 시간을 줌
    setTimeout(() => {
      initializeCamera();
    }, 100);
  };

  const handleNext = () => {
    setProgressPercent(0);
    times.current = 10;
    if (timeref.current) {
      timeref.current.textContent = times.current.toString();
    }
    if (currentIndex < sets.length) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  


  // const timedown = () => {
  //   if (times.current === 1) {
  //     times.current -= 1;
  //     std.current = false;
  //     navigated.current = true;
  //     if (decref.current) decref.current.textContent = '실패';
  //     if (timeref.current) timeref.current.textContent = times.current.toString();

  //     const failedChar = sets[currentIndex];
  //     const prevFailed = JSON.parse(localStorage.getItem('failed') || '[]');

  //     const newFailed = prevFailed.filter((c: string) => c !== failedChar);
  //     newFailed.push(failedChar);

  //     localStorage.setItem('failed', JSON.stringify(newFailed));

  //     setIsDone(true);
  //     setTimeout(handleNext, 2000);
  //   } else if (times.current > 1) {
  //     times.current -= 1;
  //     if (timeref.current) {
  //       timeref.current.textContent = times.current.toString();
  //     }
  //   }

  //   if (std.current) {
  //     setTimeout(timedown, 1000);
  //   }
  // };

  // const divword = (word: string) => {
  //   if (!decref.current || !pileref.current) return;
  //   decref.current.textContent = '';
  //   setIsDone(false);
  //   for (let i = 0; i < word.length; i++) {
  //     const char = word[i];
  //     const code = char.charCodeAt(0);
  //     if (code >= 0x3131 && code <= 0x318E) {
  //       decref.current.textContent += char;
  //     }
  //   }
  //   pileref.current.textContent = '';
  // };

// 타이머 관련 상태 추가
const [gestureRecognitionActive, setGestureRecognitionActive] = useState(false);
const gestureTimerRef = useRef<NodeJS.Timeout | null>(null);
const startTimeRef = useRef<number | null>(null);
useEffect(() => {
  if (isDone && currentIndex === sets.length) {
      sendreviewResult();
    
  }
}, [isDone, currentIndex]);
useEffect(() => {
  pges.current = ges.current;
  navigated.current = false;
  setProgressPercent(0);
    
  if (pges.current != null && ges.current != null) {
    if ( pges.current === ges.current &&
      decref.current?.textContent?.[0] === pges.current
    ) {

      // 이미 타이머가 실행 중이 아니라면 타이머 시작
      if (!gestureTimerRef.current) {
        console.log("제스처 인식 시작:", ges.current);
        setGestureRecognitionActive(true);
        startTimeRef.current = Date.now();
        
        // 프로그레스 바 애니메이션 시작
        const updateProgress = () => {
          if (!startTimeRef.current) return;
          
          const elapsed = Date.now() - startTimeRef.current;
          const percent = Math.min((elapsed / 800) * 100, 100);
          setProgressPercent(percent);
          
          if (percent < 100) {
            requestAnimationFrame(updateProgress);
          }
        };
        
        requestAnimationFrame(updateProgress);
        
        // 0.6초 타이머 설정
        gestureTimerRef.current = setTimeout(() => {
          console.log("0.6초 유지 성공! 제스처:", ges.current);
          setProgressPercent(100);
          
          // 여기서 제스처 인식 성공 처리
          if (pileref.current && decref.current?.textContent) {
            pileref.current.textContent += pges.current;
            decref.current.textContent = decref.current.textContent.replace(pges.current!, '');
            
          if (decref.current.textContent === '' && !navigated.current) {
            std.current = false;
            navigated.current = true;
            decref.current.textContent = '통과';
            setIsDone(true);
            
            
              const studyChar = sets[currentIndex];
              if (!studyResultRef.current.includes(studyChar)) {
                  studyResultRef.current.push(studyChar);
                }
            
            setTimeout(handleNext, 2000);
          }
          }
          
          // 타이머 초기화
          gestureTimerRef.current = null;
          setGestureRecognitionActive(false);
          
          pges.current = null;
        }, 800);
      }
    } else {
      // 제스처가 변경되었거나 일치하지 않으면 타이머 취소
      if (gestureTimerRef.current) {
        clearTimeout(gestureTimerRef.current);
        gestureTimerRef.current = null;
        setGestureRecognitionActive(false);
        setProgressPercent(0);
        console.log("제스처 변경으로 인식 취소");
      }
    }
  } else {
    // 제스처가 없으면 타이머 취소
    if (gestureTimerRef.current) {
      clearTimeout(gestureTimerRef.current);
      gestureTimerRef.current = null;
      setGestureRecognitionActive(false);
      setProgressPercent(0);
      console.log("제스처 없음으로 인식 취소");
    }
  }
  
  // 컴포넌트 언마운트 시 타이머 정리
  return () => {
    if (gestureTimerRef.current) {
      clearTimeout(gestureTimerRef.current);
      gestureTimerRef.current = null;
    }
  };
}, [gesture]); // eslint-disable-line react-hooks/exhaustive-deps


  useEffect(() => {
    if (sets.length > 0 && currentIndex < sets.length) {
      setWords(sets[currentIndex]);
    }
  }, [sets, currentIndex]);

  useEffect(() => {
    if (!words) return;
    std.current = true;
    divwords(words);
    
  }, [words]);

  useEffect(() => {

    // 예시: 'passed'와 'failed' 키 초기화
    // localStorage.removeItem('passed');
    // localStorage.removeItem('failed');
    setIsDone(false);
    setCurrentIndex(0);
    // 컴포넌트 마운트 시 카메라 초기화를 약간 지연시켜 DOM이 렌더링될 시간을 줌
    const timer = setTimeout(() => {
      console.log('카메라 초기화 시작');
      initializeCamera();
    }, 300); // 더 긴 지연 시간

    // 컴포넌트 언마운트 시 정리
    return () => {
      clearTimeout(timer);
      if (handsRef.current) {
        handsRef.current.close();
      }
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (gestureTimerRef.current) {
        clearTimeout(gestureTimerRef.current);
      }
    };
  }, []);

  const progress = (currentIndex / sets.length) * 100;

  if(isDone && currentIndex === sets.length)
  {
      return (
          <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
          
            <Button onClick={() => {
              navigate(`/category`);
            }}>
              결과 전송
            </Button>
          
          <Button onClick={() => navigate('/home')}>돌아가기</Button>
        </div>
      </div>
  );
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <SessionHeader
        isQuizMode={false}
        currentSign={"쑤퍼노바"}
        chapter={"chaptar"}
        currentSignIndex={1}
        progress={progress}
        categoryId={undefined}
        navigate={navigate}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                {setType === 'consonant'?(<CardTitle>자음 복습</CardTitle>):
                (<CardTitle>모음 복습</CardTitle>)}
{/* 빈 트랙은 항상 */}
<div className="mt-2">
  <div className="w-full bg-gray-200 rounded-full h-2.5">
    {/* 채워지는 부분은 progressPercent에 따라 넓이만 변함 */}
    <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-[800ms] ease-linear"
      style={{ width: `${progressPercent}%` }}
    />
  </div>

  {/* 인식 중 텍스트만 활성 상태에서 노출 */}
  {gestureRecognitionActive && (
    <div className="text-xs text-center mt-1 text-gray-500">
      인식 중...
    </div>
  )}
  </div>
                                
              </CardHeader>
              <CardContent>
                <div ref={decref} className="text-5xl text-center font-bold" />
                  {/* 자음/모음에 따라 이미지로 표시 */}
                  {sets[currentIndex] && (
                    setType === 'consonant' ? (
                      <img
                        src={`/consonant.jpg`}
                        alt={sets[currentIndex]}
                        className="mx-auto w-32 h-32 object-contain"
                      />
                    ) : setType === 'vowel' ? (
                      <img
                        src={`/vowel.jpg`}
                        alt={sets[currentIndex]}
                        className="mx-auto w-32 h-32 object-contain"
                      />
                    ) : null
                  )}
                <div ref={pileref} className="text-center text-3xl mt-4" />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>손 모양 인식</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {isCameraInitializing && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">카메라 초기화 중...</p>
                  </div>
                )}
                
                {cameraError && (
                  <div className="text-center py-8">
                    <p className="text-red-600 mb-4">{cameraError}</p>
                    <Button onClick={restartCamera} variant="outline">
                      카메라 재시작
                    </Button>
                  </div>
                )}
                
                <>
                  <video 
                    ref={videoRef} 
                    style={{ display: 'none' }} 
                    autoPlay 
                    muted 
                    playsInline 
                    width="640" 
                    height="480" 
                  />
                  <canvas 
                    ref={canvasRef} 
                    width="640" 
                    height="480" 
                    className="border border-gray-300"  
                    style={{ 
                      transform: 'scaleX(-1)',
                      visibility: !isCameraInitializing && !cameraError ? 'visible' : 'hidden'
                    }}
                  />
                  <div 
                    ref={resultRef} 
                    className="text-center text-xl mt-4"
                    style={{ visibility: !isCameraInitializing && !cameraError ? 'visible' : 'hidden' }}
                  />
                </>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LetterReview;