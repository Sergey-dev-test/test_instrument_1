import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from './services/api'

interface User {
  id: string
  username: string
  email: string
  role: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  })
  const navigate = useNavigate()

  useEffect(() => {
    // Проверка наличия токена при загрузке
    const token = localStorage.getItem('access_token')
    if (token) {
      fetchUser()
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setAuthState({
        user: response.data,
        isAuthenticated: true,
        isLoading: false
      })
    } catch (error) {
      localStorage.removeItem('access_token')
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      })
    }
  }

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { username, password })
      
      localStorage.setItem('access_token', response.data.access_token)
      localStorage.setItem('refresh_token', response.data.refresh_token)
      
      await fetchUser()
      navigate('/')
      
      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    })
    
    navigate('/welcome')
  }

  return {
    ...authState,
    login,
    logout
  }
}
