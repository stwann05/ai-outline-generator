import { useState } from 'react'

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'essay',          label: 'Essay' },
  { value: 'report',         label: 'Report' },
  { value: 'research_paper', label: 'Research Paper' },
  { value: 'proposal',       label: 'Proposal' },
  { value: 'thesis',         label: 'Thesis' },
  { value: 'presentation',   label: 'Presentation' },
]

function OutlineForm({ onSubmit, isLoading }) {
  const [topic, setTopic]               = useState('')
  const [docType, setDocType]           = useState('essay')
  const [instructions, setInstructions] = useState('')
  const [errors, setErrors]             = useState({})

  function validate() {
    const newErrors = {}
    if (!topic.trim())  newErrors.topic   = 'Topic is required.'
    if (!docType)       newErrors.docType = 'Please select a document type.'
    return newErrors
  }

  function handleSubmit(e) {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    const formData = {
      topik:        topic.trim(),
      jenis_tugas:  docType,
      instructions: instructions.trim(),
    }
    console.log('[OutlineForm] formData sebelum dikirim ke backend:', formData)
    onSubmit(formData)
  }

  return (
    <div className="card form-card mb-4">
      <div className="card-header">
        <h5>Generate a New Outline</h5>
      </div>
      <div className="card-body p-4">
        <form onSubmit={handleSubmit} noValidate>

          {/* Topic */}
          <div className="mb-3">
            <label htmlFor="topic" className="form-label fw-semibold">
              Topic
            </label>
            <input
              id="topic"
              type="text"
              className={`form-control form-control-lg${errors.topic ? ' is-invalid' : ''}`}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. The impact of social media on adolescent mental health"
            />
            {errors.topic && (
              <div className="invalid-feedback">{errors.topic}</div>
            )}
          </div>

          {/* Document Type */}
          <div className="mb-3">
            <label htmlFor="docType" className="form-label fw-semibold">
              Document Type
            </label>
            <select
              id="docType"
              className={`form-select${errors.docType ? ' is-invalid' : ''}`}
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              <option value="">— Select document type —</option>
              {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.docType && (
              <div className="invalid-feedback">{errors.docType}</div>
            )}
          </div>

          {/* Additional Instructions */}
          <div className="mb-4">
            <label htmlFor="instructions" className="form-label fw-semibold">
              Additional Instructions{' '}
              <span className="text-muted fw-normal">(optional)</span>
            </label>
            <textarea
              id="instructions"
              className="form-control"
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Focus on recent studies, include a methodology section, target audience is undergraduate students…"
            />
          </div>

          {/* Submit */}
          <div className="d-grid">
            <button
              type="submit"
              className="btn btn-primary btn-lg btn-generate"
              disabled={isLoading}
            >
              {isLoading
                ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Generating...</>
                : 'Generate Outline'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default OutlineForm
