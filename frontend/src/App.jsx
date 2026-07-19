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
      const response = await fetch('https://awandev.pythonanywhere.com/generate-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const json = await response.json()

      if (json.success) {
        setOutlineData(json.data)
      } else {
        setErrorMessage(json.error || 'An error occurred on the server.')
      }
    } catch {
      setErrorMessage('Cannot connect to the server. Make sure the backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* ── Navbar / Header ── */}
      <nav className="navbar app-navbar">
        <div className="container">
          <span className="navbar-brand d-flex flex-column mb-0">
            <span className="navbar-brand-title">AI Outline Generator</span>
            <span className="navbar-brand-subtitle">
              Generate structured academic outlines using IBM watsonx.ai
            </span>
          </span>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="app-main">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-10 col-lg-8">
              <OutlineForm onSubmit={handleGenerateOutline} isLoading={isLoading} />
              <OutlineResult data={outlineData} error={errorMessage} />
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="app-footer">
        Powered by IBM watsonx.ai
      </footer>
    </>
  )
}

export default App
