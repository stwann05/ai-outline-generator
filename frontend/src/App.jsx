import { useState } from 'react'
import './App.css'
import OutlineForm from './components/OutlineForm'
import OutlineResult from './components/OutlineResult'

function App() {
  const [outlineData, setOutlineData] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleGenerateOutline(formData) {
    setIsLoading(true)
    setErrorMessage(null)
    setOutlineData(null)

    try {
      const response = await fetch('http://127.0.0.1:5000/generate-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const json = await response.json()

      if (json.success) {
        setOutlineData(json.data)
      } else {
        setErrorMessage(json.error || 'Terjadi kesalahan dari server.')
      }
    } catch {
      setErrorMessage('Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">AI Outline Generator</h1>
        <p className="app-subtitle">Buat outline tugas akademik secara otomatis dengan AI</p>
      </header>

      <main>
        <OutlineForm onSubmit={handleGenerateOutline} isLoading={isLoading} />
        <OutlineResult data={outlineData} error={errorMessage} />
      </main>
    </div>
  )
}

export default App
