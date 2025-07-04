import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiClient } from "@/services/api";

function MailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-.879 1.797l-7.5 5.625a2.25 2.25 0 01-2.742 0l-7.5-5.625A2.25 2.25 0 012.25 6.993V6.75" />
    </svg>
  );
}

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7.875A4.125 4.125 0 008.25 7.875V10.5m8.25 0A2.25 2.25 0 0120.25 12.75v4.5A2.25 2.25 0 0118 19.5H6a2.25 2.25 0 01-2.25-2.25v-4.5A2.25 2.25 0 016 10.5m8.25 0h-8.5" />
    </svg>
  );
}

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-4 8-4 8-4s8 0 8 4" />
    </svg>
  );
}

export default function Signup() {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailFocus, setEmailFocus] = useState(false);
  const [nicknameFocus, setNicknameFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [confirmPasswordFocus, setConfirmPasswordFocus] = useState(false);
  const navigator = useNavigate();

  const signup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      await apiClient.auth.register({ 
        email, 
        nickname, 
        password: password   // password로 보내야 함
      });
      alert('회원가입 성공!');
      navigator('/login');
    } catch {
      alert('❌ 회원가입 실패');
    }
  };

  // Google 소셜 로그인
  const handleGoogleLogin = () => {
    window.location.href = apiClient.auth.getGoogleAuthUrl();
  };

  // Kakao 소셜 로그인
  const handleKakaoLogin = () => {
    window.location.href = apiClient.auth.getKakaoAuthUrl();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-100">
      <div className="relative w-[1000px] h-[650px]">
        {/* 보라색 박스 */}
        <div className="absolute left-10 top-0 w-[500px] h-[650px] bg-[#d1ccf4] rounded-[40px] shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex flex-col items-start p-[60px_40px] z-10">
          <div className="mt-2 ml-2">
            <p className="text-[20px] mb-2 text-white font-bold drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]">손끝에서 시작되는 인연</p>
            <h1 className="text-[36px] font-extrabold text-[#520d80] drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]">수어지교</h1>
          </div>
        </div>
        {/* 흰색 카드 */}
        <div className="absolute right-10 top-0 w-[600px] h-[650px] bg-white rounded-[40px] shadow-[0_4px_24px_rgba(0,0,0,0.25)] flex flex-col justify-center items-center p-10 z-20">
          <h2 className="text-2xl font-bold mb-8">회원가입</h2>
          <form className="w-full flex flex-col" onSubmit={signup}>
            {/* 이메일 */}
            <div className="relative w-3/4 mx-auto mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888] text-[18px] z-10 pointer-events-none">
                <MailIcon width={20} height={20} />
              </span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                className="w-full pl-10 pr-3 py-3 border border-[#ccc] rounded-[8px] outline-none bg-white text-[16px] font-medium peer"
                required
              />
              <label
                className={`absolute left-10 top-1/2 -translate-y-1/2 text-[#b0a7c3] bg-white px-1 pointer-events-none transition-all duration-200
                  ${emailFocus || email
                    ? 'text-xs top-2 -translate-y-0'
                    : 'text-base'
                  }`}
              >
                이메일
              </label>
            </div>
            {/* 닉네임 */}
            <div className="relative w-3/4 mx-auto mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888] text-[18px] z-10 pointer-events-none">
                <UserIcon width={20} height={20} />
              </span>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                onFocus={() => setNicknameFocus(true)}
                onBlur={() => setNicknameFocus(false)}
                className="w-full pl-10 pr-3 py-3 border border-[#ccc] rounded-[8px] outline-none bg-white text-[16px] font-medium peer"
                required
              />
              <label
                className={`absolute left-10 top-1/2 -translate-y-1/2 text-[#b0a7c3] bg-white px-1 pointer-events-none transition-all duration-200
                  ${nicknameFocus || nickname
                    ? 'text-xs top-2 -translate-y-0'
                    : 'text-base'
                  }`}
              >
                닉네임
              </label>
            </div>
            {/* 비밀번호 */}
            <div className="relative w-3/4 mx-auto mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888] text-[18px] z-10 pointer-events-none">
                <LockIcon width={20} height={20} />
              </span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setPasswordFocus(true)}
                onBlur={() => setPasswordFocus(false)}
                className="w-full pl-10 pr-3 py-3 border border-[#ccc] rounded-[8px] outline-none bg-white text-[16px] font-medium peer"
                required
              />
              <label
                className={`absolute left-10 top-1/2 -translate-y-1/2 text-[#b0a7c3] bg-white px-1 pointer-events-none transition-all duration-200
                  ${passwordFocus || password
                    ? 'text-xs top-2 -translate-y-0'
                    : 'text-base'
                  }`}
              >
                비밀번호
              </label>
            </div>
            {/* 비밀번호 확인 */}
            <div className="relative w-3/4 mx-auto mb-5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888] text-[18px] z-10 pointer-events-none">
                <LockIcon width={20} height={20} />
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onFocus={() => setConfirmPasswordFocus(true)}
                onBlur={() => setConfirmPasswordFocus(false)}
                className="w-full pl-10 pr-3 py-3 border border-[#ccc] rounded-[8px] outline-none bg-white text-[16px] font-medium peer"
                required
              />
              <label
                className={`absolute left-10 top-1/2 -translate-y-1/2 text-[#b0a7c3] bg-white px-1 pointer-events-none transition-all duration-200
                  ${confirmPasswordFocus || confirmPassword
                    ? 'text-xs top-2 -translate-y-0'
                    : 'text-base'
                  }`}
              >
                비밀번호 확인
              </label>
            </div>
            <button
              type="submit"
              className="w-3/4 mx-auto py-3 rounded-[8px] bg-[#D1CCF4] text-[#520d80] font-bold shadow-[0_4px_10px_rgba(100,100,100,0.25)] hover:bg-[#b9b0e0] transition"
            >
              회원가입
            </button>
          </form>
          <p className="mt-3 text-center text-[14px] text-[#333] w-3/4 mx-auto">
            이미 회원이신가요? <Link to="/login" className="text-[#7c3aed] underline font-bold">로그인</Link>
          </p>
          <div className="text-center my-4 text-[#999] text-[14px] w-3/4 mx-auto">OR</div>
          {/* 소셜 회원가입 */}
          <div className="flex flex-col gap-3 w-3/4 mx-auto">
            {/* 구글 회원가입 */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex items-center justify-center h-12 w-full rounded-[8px] bg-white shadow-[0_4px_10px_rgba(100,100,100,0.25)] border border-[#e0e0e0]"
            >
              <img src="/search 1.svg" alt="Google" className="w-6 h-6 mr-8 ml-5" />
              <span className="font-medium text-[#361313] text-[15.5px] mr-10">Google 회원가입</span>
            </button>
            {/* 카카오 회원가입 */}
            <button
              type="button"
              onClick={handleKakaoLogin}
              className="flex items-center justify-center h-12 w-full rounded-[8px] bg-[#FEE500] shadow-[0_4px_10px_rgba(100,100,100,0.25)] border-none"
            >
              <img src="/kakao_login_medium_narrow.png" alt="Kakao" className="w-50 h-12" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}