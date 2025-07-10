import { useState, useEffect, useCallback, useRef } from "react";
import debounce from "lodash.debounce";
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Search, ArrowLeft } from 'lucide-react';
import { useLearningData } from '@/hooks/useLearningData';
import API from '@/components/AxiosInstance';

interface SearchResult {
  id: string;
  word: string;
  description?: string;
  videoUrl?: string;
  score?: number;
}

interface PopularSign {
  id: string;
  word: string;
  description: string;
  videoUrl: string;
  views: number;
}

const SearchPage = () => {
  const navigate = useNavigate();
  const { categories } = useLearningData();
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [popularSigns, setPopularSigns] = useState<PopularSign[]>([]);

  const fetchSearchResults = async (query: string) => {
    try {
      const res = await API.get<{ success: boolean; data: { lessons: SearchResult[] }; message: string }>("/search", {
        params: { q: query, k: 10 },
      });
      setSearchResults(res.data.data.lessons);
      setOpen(res.data.data.lessons.length > 0);
    } catch {
      setSearchResults([]);
      setOpen(false);
    }
  };

  // 300ms 디바운스 래퍼 (최신 searchTerm을 항상 참조하도록 useRef 사용)
  const searchTermRef = useRef(searchTerm);
  useEffect(() => { searchTermRef.current = searchTerm; }, [searchTerm]);
  const debouncedFetch = debounce((q: string) => fetchSearchResults(q), 300);

  // input 변경
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim()) debouncedFetch(value);
    else {
      setSearchResults([]);
      setOpen(false);
    }
  };

  // sign 선택 → ID 기반 라우팅
  const handleSignSelect = async (sign: SearchResult) => {
    if (!sign.word) {
      alert('검색 결과에 word(수어 단어명)가 없습니다. 관리자에게 문의하세요.');
      return;
    }
    try {
      await API.post(`/lessons/${sign.id}/view`);
    } catch { /* 조회수 증가 실패해도 무시 */ }
    navigate('/learn/' + sign.id) // 또는 sign.id
    setOpen(false);
    setSearchTerm("");
  };

  // submit 시 최상위 결과 이동
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length) handleSignSelect(searchResults[0]);
  };

  useEffect(() => {
    // 인기 수어 불러오기
    const fetchPopularSigns = async () => {
      try {
        const res = await API.get<{ success: boolean; data: PopularSign[]; message: string }>(
          "/recommendations/popular-by-search"
        );
        setPopularSigns(res.data.data);
      } catch {
        setPopularSigns([]);
      }
    };
    fetchPopularSigns();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/home')}
                className="hover:bg-violet-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                홈으로
              </Button>
              <h1 className="text-xl font-bold text-gray-800">수어 검색</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Search Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-violet-600" />
                <span>수어 검색</span>
              </CardTitle>
              <p className="text-gray-600">학습하고 싶은 수어를 검색해보세요</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearchSubmit} className="space-y-4">
                {/* Popover 제거, Input만 남김 */}
                <div className="relative">
                  <Input
                    placeholder="수어를 검색하세요 (예: 안녕하세요, 감사합니다)"
                    value={searchTerm}
                    onChange={handleInputChange}
                    className="pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-violet-600 hover:bg-violet-700"
                  disabled={searchResults.length === 0}
                >
                  <Search className="h-4 w-4 mr-2" />
                  검색하기
                </Button>
                {/* 드롭다운 대신 결과 리스트를 아래에 출력 */}
                {searchTerm.trim() && searchResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {searchResults.slice(0, 5).map((sign) => (
                      <Button
                        key={sign.id}
                        variant="outline"
                        onClick={() => handleSignSelect(sign)}
                        className="w-full flex justify-between items-center"
                      >
                        <span>{sign.word}</span>
                        {sign.score && (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            유사도: {sign.score.toFixed(2)}
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Popular Signs Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                <span>인기 수어</span>
              </CardTitle>
              <p className="text-gray-600">많이 학습되는 수어들을 확인해보세요</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {popularSigns.length === 0 ? (
                  <div className="col-span-2 md:col-span-3 text-center text-gray-400">인기 수어가 없습니다.</div>
                ) : (
                  popularSigns.map(sign => (
                    <Button
                      key={sign.id}
                      variant="outline"
                      onClick={() => {
                        if (!sign.word) {
                          alert('인기 수어에 word(수어 단어명)가 없습니다. 관리자에게 문의하세요.');
                          return;
                        }
                        navigate(`/learn/${sign.id}`);
                      }}
                      className="h-auto p-3 hover:bg-violet-50 border-gray-200 flex flex-col items-start"
                    >
                      <div className="font-medium text-gray-800">{sign.word}</div>
                    </Button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SearchPage;