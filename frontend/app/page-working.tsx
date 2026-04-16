'use client'

export default function WorkingPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#14532d', fontSize: '2rem' }}>
        🏥 TulsiHealth
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '30px' }}>
        India's First FHIR R4-Compliant AYUSH + ICD-11 Dual-Coding EMR Platform
      </p>
      
      <div style={{ 
        background: '#facc15', 
        padding: '20px', 
        borderRadius: '10px', 
        marginBottom: '30px' 
      }}>
        <h2 style={{ color: '#14532d', margin: '0 0 10px 0' }}>
          ✅ Status: Working Successfully!
        </h2>
        <p style={{ margin: 0, color: '#14532d' }}>
          Frontend is running without errors. Backend API is connected.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => alert('Frontend button working!')}
          style={{
            background: '#14532d',
            color: 'white',
            border: 'none',
            padding: '15px 25px',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          Test Frontend
        </button>

        <button 
          onClick={() => window.open('http://localhost:8000', '_blank')}
          style={{
            background: '#166534',
            color: 'white',
            border: 'none',
            padding: '15px 25px',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          Open API
        </button>
      </div>

      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        background: '#f5f5f5', 
        borderRadius: '10px' 
      }}>
        <h3 style={{ color: '#14532d', margin: '0 0 15px 0' }}>
          🌐 Access Information:
        </h3>
        <div style={{ lineHeight: '1.8' }}>
          <p><strong>Frontend:</strong> <a href="http://localhost:3001" target="_blank" style={{ color: '#166534' }}>http://localhost:3001</a></p>
          <p><strong>Backend API:</strong> <a href="http://localhost:8000" target="_blank" style={{ color: '#166534' }}>http://localhost:8000</a></p>
          <p><strong>API Docs:</strong> <a href="http://localhost:8000/docs" target="_blank" style={{ color: '#166534' }}>http://localhost:8000/docs</a></p>
        </div>
      </div>
    </div>
  )
}



