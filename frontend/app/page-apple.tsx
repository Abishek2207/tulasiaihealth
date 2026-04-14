'use client'

import { useState } from 'react'

export default function AppleStylePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Navigation Header */}
      <nav style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '60px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(45deg, #facc15, #14532d)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: 'white',
              fontSize: '18px'
            }}>
              TH
            </div>
            <span style={{ fontSize: '20px', fontWeight: '600', color: '#1d1d1f' }}>
              TulsiHealth
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button 
              onClick={() => setActiveTab('overview')}
              style={{
                background: activeTab === 'overview' ? '#007AFF' : 'transparent',
                color: activeTab === 'overview' ? 'white' : '#1d1d1f',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('patients')}
              style={{
                background: activeTab === 'patients' ? '#007AFF' : 'transparent',
                color: activeTab === 'patients' ? 'white' : '#1d1d1f',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Patients
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              style={{
                background: activeTab === 'analytics' ? '#007AFF' : 'transparent',
                color: activeTab === 'analytics' ? 'white' : '#1d1d1f',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Analytics
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Hero Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '60px',
          textAlign: 'center',
          marginBottom: '40px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '700',
            color: '#1d1d1f',
            margin: '0 0 20px 0',
            background: 'linear-gradient(45deg, #facc15, #14532d)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            TulsiHealth
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#666',
            margin: '0 0 40px 0',
            lineHeight: '1.6'
          }}>
            India's First FHIR R4-Compliant AYUSH + ICD-11 Dual-Coding EMR Platform
          </p>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => window.open('http://localhost:8000/docs', '_blank')}
              style={{
                background: '#007AFF',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0, 122, 255, 0.3)'
              }}
            >
              API Documentation
            </button>
            <button 
              onClick={() => alert('Opening patient dashboard...')}
              style={{
                background: 'transparent',
                color: '#007AFF',
                border: '2px solid #007AFF',
                padding: '13px 28px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Patient Portal
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '30px',
          marginBottom: '40px'
        }}>
          {/* Card 1 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(45deg, #facc15, #f59e0b)',
              borderRadius: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginBottom: '20px'
            }}>
              Hospital
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 10px 0' }}>
              Dual Coding System
            </h3>
            <p style={{ color: '#666', lineHeight: '1.6', margin: 0 }}>
              Seamless integration of AYUSH terminology (NAMASTE) with ICD-11 MMS coding standards
            </p>
          </div>

          {/* Card 2 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(45deg, #14532d, #166534)',
              borderRadius: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginBottom: '20px'
            }}>
              Lock
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 10px 0' }}>
              ABHA Integration
            </h3>
            <p style={{ color: '#666', lineHeight: '1.6', margin: 0 }}>
              Complete integration with India's National Digital Health Ecosystem
            </p>
          </div>

          {/* Card 3 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(45deg, #8b5cf6, #7c3aed)',
              borderRadius: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginBottom: '20px'
            }}>
              Robot
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 10px 0' }}>
              AI-Powered Features
            </h3>
            <p style={{ color: '#666', lineHeight: '1.6', margin: 0 }}>
              Symptom extraction, recovery prediction, and medicine recommendations
            </p>
          </div>
        </div>

        {/* Status Dashboard */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ fontSize: '28px', fontWeight: '600', color: '#1d1d1f', margin: '0 0 30px 0' }}>
            System Status
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(45deg, #10b981, #059669)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px',
                fontSize: '32px'
              }}>
                Check
              </div>
              <h4 style={{ margin: '0 0 5px 0', color: '#1d1d1f', fontSize: '18px' }}>
                Backend API
              </h4>
              <p style={{ margin: 0, color: '#10b981', fontSize: '14px', fontWeight: '500' }}>
                Operational
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(45deg, #10b981, #059669)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px',
                fontSize: '32px'
              }}>
                Check
              </div>
              <h4 style={{ margin: '0 0 5px 0', color: '#1d1d1f', fontSize: '18px' }}>
                Frontend UI
              </h4>
              <p style={{ margin: 0, color: '#10b981', fontSize: '14px', fontWeight: '500' }}>
                Operational
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(45deg, #10b981, #059669)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 15px',
                fontSize: '32px'
              }}>
                Check
              </div>
              <h4 style={{ margin: '0 0 5px 0', color: '#1d1d1f', fontSize: '18px' }}>
                Database
              </h4>
              <p style={{ margin: 0, color: '#10b981', fontSize: '14px', fontWeight: '500' }}>
                Connected
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        padding: '30px 20px',
        textAlign: 'center',
        marginTop: '60px'
      }}>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
          © 2024 TulsiHealth. India's First AYUSH + ICD-11 Dual-Coding EMR Platform.
        </p>
      </footer>
    </div>
  )
}
