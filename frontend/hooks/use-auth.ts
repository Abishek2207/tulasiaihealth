import { useState, useCallback } from 'react'

interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  })

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const data = await response.json()
      
      setAuthState({
        user: data.user_info,
        token: data.access_token,
        isAuthenticated: true,
      })

      // Store token in localStorage
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user_info))
    } catch (error) {
      throw error
    }
  }, [])

  const loginWithFace = useCallback(async (username: string, faceImage: string) => {
    try {
      const response = await fetch('/api/auth/face-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, face_image: faceImage }),
      })

      if (!response.ok) {
        throw new Error('Face login failed')
      }

      const data = await response.json()
      
      setAuthState({
        user: data.user_info,
        token: data.access_token,
        isAuthenticated: true,
      })

      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user_info))
    } catch (error) {
      throw error
    }
  }, [])

  const logout = useCallback(() => {
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
    })

    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }, [])

  return {
    ...authState,
    login,
    loginWithFace,
    logout,
  }
}
