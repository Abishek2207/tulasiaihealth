'use client'

import { useState } from 'react'

export default function AppleStyleLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate login
    setTimeout(() => {
      alert('Login successful! Welcome to TulsiHealth.')
      setIsLoading(false)
    }, 2000)
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '60px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 30px 60px rgba(0, 0, 0, 0.2)',
        textAlign: 'center'
      }}>
        {/* Logo */}
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(45deg, #facc15, #14532d)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 30px',
          fontSize: '32px',
          fontWeight: 'bold',
          color: 'white'
        }}>
          TH
        </div>

        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#1d1d1f',
          margin: '0 0 10px 0'
        }}>
          Welcome Back
        </h1>
        
        <p style={{
          fontSize: '16px',
          color: '#666',
          margin: '0 0 40px 0',
          lineHeight: '1.5'
        }}>
          Sign in to access your TulsiHealth EMR dashboard
        </p>

        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#1d1d1f',
              marginBottom: '8px'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@tulsihealth.in"
              required
              style={{
                width: '100%',
                padding: '16px',
                border: '1px solid #d1d5db',
                borderRadius: '12px',
                fontSize: '16px',
                background: '#f9fafb',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#1d1d1f',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{
                width: '100%',
                padding: '16px',
                border: '1px solid #d1d5db',
                borderRadius: '12px',
                fontSize: '16px',
                background: '#f9fafb',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              background: isLoading ? '#94a3b8' : '#007AFF',
              color: 'white',
              border: 'none',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0, 122, 255, 0.3)',
              marginBottom: '20px'
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '30px 0'
        }}>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          <span style={{ padding: '0 15px', color: '#666', fontSize: '14px' }}>
            Or continue with
          </span>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
          <button
            onClick={() => alert('Face recognition coming soon!')}
            style={{
              flex: 1,
              background: 'transparent',
              color: '#1d1d1f',
              border: '2px solid #d1d5db',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            Face ID
          </button>
          <button
            onClick={() => alert('QR code login coming soon!')}
            style={{
              flex: 1,
              background: 'transparent',
              color: '#1d1d1f',
              border: '2px solid #d1d5db',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            QR Code
          </button>
        </div>

        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
          Don't have an account?{' '}
          <a href="#" style={{ color: '#007AFF', textDecoration: 'none', fontWeight: '600' }}>
            Contact Administrator
          </a>
        </p>
      </div>
    </div>
  )
}
