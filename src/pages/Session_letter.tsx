import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawLandmarks, drawOverlayMessage } from '../components/draw/draw';
import { detectGesture } from '../components/draw/RightDetector';
import API from '@/components/AxiosInstance';

const LetterSession = () => {
  const navigate = useNavigate();
  const { setType,qOrs } = useParams();
  const [sets] = useState(() => {
    if (setType === 'consonant') {
      return ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
    } else if (setType === 'vowel') {
      return ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ','ㅗ','ㅛ','ㅜ','ㅠ','ㅡ','ㅣ'];
    } else {
      return [];
    }
  });
  const sendQuizResult = async () => {
    const passedLetters = JSON.parse(localStorage.getItem('passed') || '[]');
    const failedLetters = JSON.parse(localStorage.getItem('failed') || '[]');

    try {
      await API.post(
        'study/result/letter',
        {
          passed: passedLetters,
          failed: failedLetters,
        },
        {
          withCredentials: true, // ✅ 쿠키 포함
        }
      );
      console.log("결과 전송 완료");
      // 선택: localStorage 초기화
      localStorage.removeItem('passed');
      localStorage.removeItem('failed');
    } catch (error) {
      console.error("결과 전송 실패", error);
    }
  };
  const sendstudyResult = async () => {
    const checkedLetters = JSON.parse(localStorage.getItem('checked') || '[]');

    try {
      await API.post(
        '/study/letter',
        {
          checked: checkedLetters
        },
        {
          withCredentials: true, // ✅ 쿠키 포함
        }
      );
      console.log("결과 전송 완료");
      // 선택: localStorage 초기화
      localStorage.removeItem('checked');
    } catch (error) {
      console.error("결과 전송 실패", error);
    }
  };
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const times = useRef(10);
  const qors = useRef<boolean>(qOrs === 'quiz');
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

  const handleNext = () => {
    if (currentIndex < sets.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const comges = () => {
    navigated.current = false;
    if (pges.current != null) {
      if (
        pges.current === ges.current &&
        decref.current?.textContent?.[0] === pges.current
      ) {
        if (pileref.current && decref.current?.textContent) {
          pileref.current.textContent += pges.current;
          decref.current.textContent = decref.current.textContent.replace(pges.current, '');
          if (decref.current.textContent === '' && !navigated.current) {
            std.current = false;
            navigated.current = true;
            decref.current.textContent = '통과';
            setIsDone(true);
            const passedChar = sets[currentIndex];
            const prevPassed = JSON.parse(localStorage.getItem('passed') || '[]');

            // 중복 제거 후 배열 새로 만들기
            const newPassed = prevPassed.filter((c: string) => c !== passedChar);
            newPassed.push(passedChar);

            localStorage.setItem('passed', JSON.stringify(newPassed));
            setTimeout(handleNext, 5000);
          }
        }
        pges.current = null;
      } else {
        pges.current = ges.current;
      }
    } else {
      pges.current = ges.current;
    }

    if (std.current) {
      setTimeout(comges, 1000);
    }
  };

  const timedown = () => {
    if (times.current === 1) {
      times.current -= 1;
      std.current = false;
      navigated.current = true;
      if (decref.current) decref.current.textContent = '실패';
      if (timeref.current) timeref.current.textContent = times.current.toString();

      const failedChar = sets[currentIndex];
      const prevFailed = JSON.parse(localStorage.getItem('failed') || '[]');

      const newFailed = prevFailed.filter((c: string) => c !== failedChar);
      newFailed.push(failedChar);

      localStorage.setItem('failed', JSON.stringify(newFailed));

      setIsDone(true);
      setTimeout(handleNext, 5000);
    } else if (times.current > 1) {
      times.current -= 1;
      if (timeref.current) {
        timeref.current.textContent = times.current.toString();
      }
    }

    if (std.current) {
      setTimeout(timedown, 1000);
    }
  };

  const divword = (word: string) => {
    if (!decref.current || !pileref.current) return;
    decref.current.textContent = '';
    setIsDone(false);
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const code = char.charCodeAt(0);
      if (code >= 0x3131 && code <= 0x318E) {
        decref.current.textContent += char;
      }
    }
    pileref.current.textContent = '';
    if(qors.current){
      times.current = 10;
      if (timeref.current) timeref.current.textContent = times.current.toString();
    }
  };

  useEffect(() => {
    setWords(sets[currentIndex]);
  }, [currentIndex]);

  useEffect(() => {
    if (!words) return;
    std.current = true;
    divword(words);
    setTimeout(comges, 300);
    if(qors.current){
      setTimeout(timedown, 1000);
    }
  }, [words]);

  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const resultElement = resultRef.current;

    if (!videoElement || !canvasElement || !resultElement) return;
    const canvasCtx = canvasElement.getContext('2d');
    if (!canvasCtx) return;

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results: any) => {
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
          const gesture = detectGesture(landmarks,handedness);
          if (gesture) {
            resultElement.textContent = `🖐️ ${gesture}`;
            ges.current = gesture;
          } else {
            resultElement.textContent = 'Hand detected';
            ges.current = null;
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
      }
      canvasCtx.restore();
    });

    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 640,
      height: 480,
    });

    camera.start();
  }, []);

  const progress = (currentIndex / sets.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate(-1)} className="hover:bg-blue-50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                돌아가기
              </Button>
              <div>
                {setType === 'consonant'?(<h1 className="text-xl font-bold text-gray-800">자음 테스트</h1>):
                (<h1 className="text-xl font-bold text-gray-800">모음 테스트</h1>)}
                <p className="text-sm text-gray-600">
                  문제 {currentIndex + 1}/{sets.length}
                </p>
              </div>
            </div>
            <div className="w-32">
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {qors.current?(<div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>현재 문제</CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={decref} className="text-5xl text-center font-bold" />
                <div ref={timeref} className="text-center text-gray-600 mt-2 text-3xl " />
                <div ref={pileref} className="text-center text-3xl mt-4" />
              </CardContent>
            </Card>
          </div>):(<div className="space-y-6">
            <Card>
              <CardHeader>
                {setType === 'consonant'?(<CardTitle>자음 연습</CardTitle>):
                (<CardTitle>모음 연습</CardTitle>)}
              </CardHeader>
              <CardContent>
                <div ref={decref} className="text-5xl text-center font-bold" />
                {setType === 'consonant'?(<img src="/consonant.jpg" alt="자음표" className="mx-auto my-4 w-[480px] h-auto"/>):
                (<img src="/vowel.jpg" alt="모음표" className="mx-auto my-4 w-[480px] h-auto"/>)}
                <div ref={pileref} className="text-center text-3xl mt-4" />
              </CardContent>
            </Card>
          </div>)}

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>손 모양 인식</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <video ref={videoRef} style={{ display: 'none' }} autoPlay muted playsInline width="640" height="480" />
                <canvas ref={canvasRef} width="640" height="480" className="border border-gray-300"  style={{ transform: 'scaleX(-1)' }}/>
                <div ref={resultRef} className="text-center text-xl mt-4" />

                {isDone && currentIndex === sets.length - 1 && (
                  qors.current ? (
                    <Button className="mt-4" onClick={() => sendQuizResult()}>
                      결과 저장
                    </Button>
                  ) : (
                    <Button className="mt-4" onClick={() => sendstudyResult()}>
                      카테고리로
                    </Button>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LetterSession;