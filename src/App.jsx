import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AppLayout from './layouts/AppLayout.jsx'
import useApplyTrack from './hooks/useApplyTrack.js'
import './App.css'

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Applications = lazy(() => import('./pages/Applications.jsx'))
const ApplicationDetails = lazy(() => import('./pages/ApplicationDetails.jsx'))
const Interviews = lazy(() => import('./pages/Interviews.jsx'))
const Followups = lazy(() => import('./pages/Followups.jsx'))
const Resumes = lazy(() => import('./pages/Resumes.jsx'))
const Analytics = lazy(() => import('./pages/Analytics.jsx'))

function RoutedApp() {
  const app = useApplyTrack()

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Suspense fallback={<div className="route-loading" role="status">Loading your workspace…</div>}>
        <Routes>
          <Route element={<AppLayout app={app} />}>
            <Route index element={<Dashboard />} />
            <Route path="applications" element={<Applications />} />
            <Route path="applications/:id" element={<ApplicationDetails />} />
            <Route path="interviews" element={<Interviews />} />
            <Route path="follow-ups" element={<Followups />} />
            <Route path="resumes" element={<Resumes />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}

export default function App() {
  return <BrowserRouter><RoutedApp /></BrowserRouter>
}
