import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GlobalWebSocketProvider } from "@/contexts/GlobalWebSocketContext";

import Home from "./pages/Home";
import Learn from "./pages/SingleLearn";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Chapters from "./pages/Chapters";
import SearchPage from "./pages/Search";
import NotFound from "./pages/NotFound";
import Categories from "./pages/Categories";
import QuizSession from "./pages/QuizSession";
import SessionBegin from "./pages/SessionBegin";
import LearnSession from "./pages/LearnSession";
import AuthCallback from "./pages/AuthCallback";
import LetterSession from "./pages/LetterSession";
import SessionComplete from "./pages/SessionComplete";
import MediaPipeSession from "./pages/MediaPipeSession";
import ProtectedRoute from "@/components/ProtectedRoute";
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
                <Route path="/test/letter/:setType/:qOrs/:chapterId" element={<ProtectedRoute><LetterSession /></ProtectedRoute>} />
                <Route path="/complete/chapter/:chapterId/:modeNum" element={<ProtectedRoute><SessionComplete /></ProtectedRoute>} />
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