import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Learn from "./pages/Learn";
import Categories from "./pages/Categories";
import Chapters from "./pages/Chapters";
import LearnSession from "./pages/LearnSession";
import Review from "./pages/Review";
import SearchPage from "./pages/Search";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";
import { AuthProvider } from "@/hooks/useAuth";
import LetterSession from "./pages/LetterSession";
import LearningGuide from "./pages/LearningGuide";
import QuizSession from "./pages/QuizSession";
import QuizReview from "./pages/ReviewSession";
import ProtectedRoute from "@/components/ProtectedRoute";
import { GlobalWebSocketProvider } from "@/contexts/GlobalWebSocketContext";
import ReviewSession from "./pages/ReviewSession";
import MediaPipeSession from "./pages/MediaPipeSession";
import SessionBegin from "./pages/SessionBegin";
import SessionComplete from "./pages/SessionComplete";
import LetterReview from "./pages/LetterReview";
import LocationContext from "@/contexts/LocationContext";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <GlobalWebSocketProvider
          defaultPosition="top-right"
          autoShowOnConnection={true}
          showToggleButton={true}
        >
          <BrowserRouter>
            <LocationContext.Provider value={{ location: '', setLocation: () => { } }}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/category" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
                <Route path="/category/:categoryId/chapters" element={<ProtectedRoute><Chapters /></ProtectedRoute>} />
                <Route path="/learn/:lessonId" element={<Learn />} />
                <Route path="/learn/chapter/:chapterId/guide/:modeNum" element={<ProtectedRoute><SessionBegin /></ProtectedRoute>} />
                <Route path="/learn/chapter/:chapterId" element={<ProtectedRoute><LearnSession /></ProtectedRoute>} />
                <Route path="/quiz/chapter/:chapterId" element={<ProtectedRoute><QuizSession /></ProtectedRoute>} />
                <Route path="/review/chapter/:chapterId" element={<ProtectedRoute><ReviewSession /></ProtectedRoute>} />
                <Route path="/quiz/chapter/:chapterId/review" element={<ProtectedRoute><QuizReview /></ProtectedRoute>} />
                <Route path="/test/letter/:setType/:qOrs" element={<ProtectedRoute><LetterSession /></ProtectedRoute>} />
                <Route path="/review/letter/:setType/" element={<ProtectedRoute><LetterReview /></ProtectedRoute>}/>
                <Route path="/complete/chapter/:chapterId/:modeNum" element={<ProtectedRoute><SessionComplete /></ProtectedRoute>} />
                <Route path="/review" element={<ProtectedRoute><Review /></ProtectedRoute>} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/Admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                <Route path="/test/mediapipe" element={<ProtectedRoute><MediaPipeSession /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </LocationContext.Provider>
          </BrowserRouter>
        </GlobalWebSocketProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;