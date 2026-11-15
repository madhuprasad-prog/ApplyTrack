import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AppLayout from './layouts/AppLayout.jsx'
import useApplyTrack from './hooks/useApplyTrack.js'
import AuthProvider from './contexts/AuthContext.jsx'
import { ProtectedRoute, PublicOnlyRoute } from './components/AuthRoutes.jsx'
import AuthForm from './components/AuthForm.jsx'
import './App.css'

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Applications = lazy(() => import('./pages/Applications.jsx'))
const ApplicationDetails = lazy(() => import('./pages/ApplicationDetails.jsx'))
const Interviews = lazy(() => import('./pages/Interviews.jsx'))
const Followups = lazy(() => import('./pages/Followups.jsx'))
const Resumes = lazy(() => import('./pages/Resumes.jsx'))
const Analytics = lazy(() => import('./pages/Analytics.jsx'))
const CareerProfile = lazy(() => import('./pages/CareerProfile.jsx'))

function WorkspaceLayout() {
  const app = useApplyTrack()

  if (app.applicationsLoading && app.applications.length === 0) {
    return <div className="route-loading" role="status">Loading your workspace…</div>
  }

  return (
    <Suspense fallback={<div className="route-loading" role="status">Loading your workspace…</div>}>
      <AppLayout app={app} />
    </Suspense>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<AuthForm mode="login" />} />
            <Route path="/register" element={<AuthForm mode="register" />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<WorkspaceLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="applications" element={<Applications />} />
              <Route path="applications/:id" element={<ApplicationDetails />} />
              <Route path="interviews" element={<Interviews />} />
              <Route path="follow-ups" element={<Followups />} />
              <Route path="resumes" element={<Resumes />} />
              <Route path="profile" element={<CareerProfile />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
