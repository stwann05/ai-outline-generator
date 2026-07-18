import { useState } from 'react'

const JENIS_TUGAS_OPTIONS = [
  { value: 'esai', label: 'Esai' },
  { value: 'presentasi', label: 'Presentasi' },
  { value: 'proposal', label: 'Proposal' },
]

function OutlineForm({ onSubmit, isLoading }) {
  const [topik, setTopik] = useState('')
  const [matkul, setMatkul] = useState('')
  const [jenisTugas, setJenisTugas] = useState('')
  const [errors, setErrors] = useState({})

  function validate() {
    const newErrors = {}
    if (!topik.trim()) newErrors.topik = 'Topik tugas tidak boleh kosong.'
    if (!matkul.trim()) newErrors.matkul = 'Mata kuliah tidak boleh kosong.'
    if (!jenisTugas) newErrors.jenisTugas = 'Jenis tugas harus dipilih.'
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
    onSubmit({ topik: topik.trim(), matkul: matkul.trim(), jenis_tugas: jenisTugas })
  }

  return (
    <form className="outline-form" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="topik">Topik tugas</label>
        <input
          id="topik"
          type="text"
          value={topik}
          onChange={(e) => setTopik(e.target.value)}
          placeholder="Contoh: Dampak media sosial terhadap remaja"
          className={errors.topik ? 'input-error' : ''}
        />
        {errors.topik && <span className="error-msg">{errors.topik}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="matkul">Mata kuliah</label>
        <input
          id="matkul"
          type="text"
          value={matkul}
          onChange={(e) => setMatkul(e.target.value)}
          placeholder="Contoh: Sosiologi Komunikasi"
          className={errors.matkul ? 'input-error' : ''}
        />
        {errors.matkul && <span className="error-msg">{errors.matkul}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="jenisTugas">Jenis tugas</label>
        <select
          id="jenisTugas"
          value={jenisTugas}
          onChange={(e) => setJenisTugas(e.target.value)}
          className={errors.jenisTugas ? 'input-error' : ''}
        >
          <option value="">-- Pilih jenis tugas --</option>
          {JENIS_TUGAS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {errors.jenisTugas && <span className="error-msg">{errors.jenisTugas}</span>}
      </div>

      <button type="submit" className="btn-submit" disabled={isLoading}>
        {isLoading ? 'Membuat outline...' : 'Buat Outline'}
      </button>
    </form>
  )
}

export default OutlineForm
