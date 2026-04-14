'use client'

export default function SimpleTest() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>TulsiHealth - Simple Test</h1>
      <p>Frontend is working!</p>
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => alert('Button clicked!')}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#facc15', 
            color: '#14532d',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Button
        </button>
      </div>
    </div>
  )
}
