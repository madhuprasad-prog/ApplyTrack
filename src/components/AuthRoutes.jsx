import { Navigate, Outlet, useLocation } from 'react-router-dom'
import AuthLoading from './AuthLoading.jsx'
import useAuth from '../hooks/useAuth.js'
import { getSafeReturnPath } from '../utils/authNavigation.js'

export function ProtectedRoute() {
  const { user, loading, error } = useAuth()
  const location = useLocation()

  if (loading || error) return <AuthLoading error={error} />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

export function PublicOnlyRoute() {
  const { user, loading, error } = useAuth()
  const location = useLocation()

  if (loading || error) return <AuthLoading error={error} />
  if (user) return <Navigate to={getSafeReturnPath(location.state?.from)} replace />
  return <Outlet />
}
