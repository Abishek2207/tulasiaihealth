'use client'

export default function HomePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h1 style={{ 
          color: '#14532d', 
          fontSize: '2.5rem',
          marginBottom: '10px',
          fontWeight: 'bold'
        }}>
          TulsiHealth
        </h1>
        <p style={{ 
          color: '#666', 
          fontSize: '1.1rem',
          marginBottom: '30px'
        }}>
          India's First FHIR R4-Compliant AYUSH + ICD-11 Dual-Coding EMR Platform
        </p>
        
        <div style={{ 
          background: '#facc15',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '30px'
        }}>
          <h3 style={{ color: '#14532d', marginBottom: '10px' }}>Status: Working!</h3>
          <p style={{ color: '#14532d', margin: 0 }}>
            Frontend is successfully running. Backend API is available.
          </p>
        </div>

        <button 
          onClick={() => window.location.href = '/simple-test'}
          style={{
            background: '#14532d',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            borderRadius: '8px',
            fontSize: '1.1rem',
            cursor: 'pointer',
            marginRight: '10px',
            transition: 'all 0.3s ease'
          }}
        >
          Test Page
        </button>

        <button 
          onClick={() => window.open('http://localhost:8000', '_blank')}
          style={{
            background: '#166534',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            borderRadius: '8px',
            fontSize: '1.1rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          API Docs
        </button>

        <div style={{ marginTop: '30px', fontSize: '0.9rem', color: '#666' }}>
          <p>Frontend: http://localhost:3000</p>
          <p>Backend API: http://localhost:8000</p>
          <p>API Documentation: http://localhost:8000/docs</p>
        </div>
      </div>
    </div>
  )
}
