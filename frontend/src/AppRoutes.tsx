import { Routes, Route, Navigate } from 'react-router-dom'
import WelcomePage from './pages/WelcomePage'
import MainPage from './pages/MainPage'
import { useAuth } from './hooks/useAuth'

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route 
        path="/welcome" 
        element={!isAuthenticated ? <WelcomePage /> : <Navigate to="/" />} 
      />
      <Route 
        path="/" 
        element={isAuthenticated ? <MainPage /> : <Navigate to="/welcome" />} 
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default AppRoutes
