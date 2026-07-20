import { useState } from 'react'

const JENIS_TUGAS_OPTIONS = [
  { value: 'proposal',       label: 'Proposal' },
  { value: 'presentasi',     label: 'Presentasi' },
  { value: 'esai',           label: 'Esai' },
  { value: 'konten kreatif', label: 'Konten Kreatif' },
  { value: 'storyboard',     label: 'Storyboard' },
]

function getInstructionsPlaceholder(jenisTugas) {
  switch (jenisTugas) {
    case 'proposal':
      return 'Contoh: Proposal skripsi bidang Psikologi, atau Proposal kegiatan seminar kampus, atau Proposal bisnis untuk mata kuliah Kewirausahaan'
    case 'presentasi':
      return 'Contoh: Presentasi tugas kelas biasa, atau Presentasi sidang skripsi, atau Pitch untuk mata kuliah Kewirausahaan'
    case 'esai':
      return 'Contoh: Esai argumentatif, esai reflektif, atau esai untuk beasiswa'
    default:
      return 'Contoh: platform yang dituju, gaya bahasa, atau batasan durasi/halaman'
  }
}

function OutlineForm({ onSubmit, isLoading }) {
  const [topik, setTopik]               = useState('')
  const [matkul, setMatkul]             = useState('')
  const [jenisTugas, setJenisTugas]     = useState('')
  const [instructions, setInstructions] = useState('')
  const [errors, setErrors]             = useState({})

  function validate() {
    const newErrors = {}
    if (!topik.trim())    newErrors.topik      = 'Topik wajib diisi.'
    if (!jenisTugas)      newErrors.jenisTugas = 'Pilih jenis tugas terlebih dahulu.'
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
    onSubmit({
      topik:        topik.trim(),
      matkul:       matkul.trim(),
      jenis_tugas:  jenisTugas,
      instructions: instructions.trim(),
    })
  }

  return (
    <div className="card form-card mb-4">
      <div className="card-header">
        <h5>Buat Outline Baru</h5>
      </div>
      <div className="card-body p-4">
        <form onSubmit={handleSubmit} noValidate>

          {/* Topik */}
          <div className="mb-3">
            <label htmlFor="topik" className="form-label fw-semibold">
              Topik
            </label>
            <input
              id="topik"
              type="text"
              className={`form-control form-control-lg${errors.topik ? ' is-invalid' : ''}`}
              value={topik}
              onChange={(e) => setTopik(e.target.value)}
              placeholder="Contoh: Dampak media sosial terhadap kesehatan mental remaja"
            />
            {errors.topik && (
              <div className="invalid-feedback">{errors.topik}</div>
            )}
          </div>

          {/* Mata Kuliah */}
          <div className="mb-3">
            <label htmlFor="matkul" className="form-label fw-semibold">
              Mata Kuliah{' '}
              <span className="text-muted fw-normal">(opsional)</span>
            </label>
            <input
              id="matkul"
              type="text"
              className="form-control"
              value={matkul}
              onChange={(e) => setMatkul(e.target.value)}
              placeholder="Contoh: Psikologi Sosial"
            />
          </div>

          {/* Jenis Tugas */}
          <div className="mb-3">
            <label htmlFor="jenisTugas" className="form-label fw-semibold">
              Jenis Tugas
            </label>
            <select
              id="jenisTugas"
              className={`form-select${errors.jenisTugas ? ' is-invalid' : ''}`}
              value={jenisTugas}
              onChange={(e) => setJenisTugas(e.target.value)}
            >
              <option value="">— Pilih jenis tugas —</option>
              {JENIS_TUGAS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.jenisTugas && (
              <div className="invalid-feedback">{errors.jenisTugas}</div>
            )}
          </div>

          {/* Konteks Tambahan */}
          <div className="mb-4">
            <label htmlFor="instructions" className="form-label fw-semibold">
              Konteks tambahan{' '}
              <span className="text-muted fw-normal">(opsional)</span>
            </label>
            <textarea
              id="instructions"
              className="form-control"
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={getInstructionsPlaceholder(jenisTugas)}
            />
            <div className="form-text text-muted" style={{ fontSize: '0.8rem' }}>
              Semakin spesifik konteksnya, semakin relevan outline yang dihasilkan.
            </div>
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
