import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ScrollToTop } from '@/components/ScrollToTop';
import { FullPageSpinner, ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import { SettingsDialogProvider } from '@/contexts/SettingsDialogContext';
import Landing from '@/pages/Landing';

const Login = lazy(() => import('@/pages/Login'));
const Signup = lazy(() => import('@/pages/Signup'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const IdeaWorkshop = lazy(() => import('@/pages/IdeaWorkshop'));
const Projects = lazy(() => import('@/pages/Projects'));
const ProjectDetail = lazy(() => import('@/pages/ProjectDetail'));
const Lessons = lazy(() => import('@/pages/Lessons'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <ScrollToTop />
      <SettingsDialogProvider>
        <Suspense fallback={<FullPageSpinner />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/idea-workshop" element={<ProtectedRoute><IdeaWorkshop /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
            <Route path="/lessons" element={<ProtectedRoute><Lessons /></ProtectedRoute>} />
            {/* Old URL from earlier versions. */}
            <Route path="/workspace" element={<Navigate to="/projects" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </SettingsDialogProvider>
    </BrowserRouter>
    <Toaster />
  </AuthProvider>
);

export default App;
