import { useState, useEffect, useRef } from 'react'

function EditableText({ as: Tag, value, className, onTextChange }) {
  const [text, setText] = useState(value)

  useEffect(() => {
    setText(value)
  }, [value])

  function handleBlur(e) {
    const updated = e.currentTarget.textContent
    setText(updated)
    if (onTextChange) onTextChange(updated)
  }

  return (
    <Tag
      className={className}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
    >
      {text}
    </Tag>
  )
}

function SectionCard({ bagian, onSectionChange }) {
  const [heading, setHeading] = useState(bagian.heading)
  const [poinList, setPoinList] = useState(bagian.poin)

  useEffect(() => {
    setHeading(bagian.heading)
    setPoinList(bagian.poin)
  }, [bagian.heading, bagian.poin])

  function handleHeadingChange(updated) {
    setHeading(updated)
    if (onSectionChange) onSectionChange({ heading: updated, poin: poinList })
  }

  function handlePoinBlur(index, e) {
    const updated = [...poinList]
    updated[index] = e.currentTarget.textContent
    setPoinList(updated)
    if (onSectionChange) onSectionChange({ heading, poin: updated })
  }

  return (
    <div className="section-card">
      <EditableText
        as="h3"
        value={bagian.heading}
        className="section-heading"
        onTextChange={handleHeadingChange}
      />
      <ul className="section-list">
        {poinList.map((poin, i) => (
          <li
            key={i}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handlePoinBlur(i, e)}
            className="section-point"
          >
            {poin}
          </li>
        ))}
      </ul>
    </div>
  )
}

function OutlineResult({ data, error }) {
  const [copyAlert, setCopyAlert]   = useState(null)   // 'success' | 'error' | null
  const alertTimerRef               = useRef(null)

  // Track live-edited content so Copy/Download always uses current DOM text
  const titleRef    = useRef(data?.judul ?? '')
  const sectionsRef = useRef(data?.bagian ?? [])

  useEffect(() => {
    titleRef.current    = data?.judul ?? ''
    sectionsRef.current = data ? data.bagian.map(b => ({ ...b, poin: [...b.poin] })) : []
  }, [data])

  if (!data && !error) return null

  if (error) {
    return (
      <div className="alert alert-danger d-flex align-items-start gap-2 mt-2 mb-4" role="alert">
        <strong>Error:&nbsp;</strong>{error}
      </div>
    )
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  function buildMarkdown() {
    const lines = [`# ${titleRef.current}`, '']
    sectionsRef.current.forEach(s => {
      lines.push(`## ${s.heading}`)
      s.poin.forEach(p => lines.push(`- ${p}`))
      lines.push('')
    })
    return lines.join('\n')
  }

  function showAlert(type) {
    clearTimeout(alertTimerRef.current)
    setCopyAlert(type)
    alertTimerRef.current = setTimeout(() => setCopyAlert(null), 3500)
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildMarkdown())
      .then(() => showAlert('success'))
      .catch(() => showAlert('error'))
  }

  function handleDownloadMd() {
    const blob = new Blob([buildMarkdown()], { type: 'text/markdown' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: 'outline.md' })
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleDownloadPdf() {
    // jsPDF is loaded from CDN as window.jspdf.jsPDF
    const { jsPDF } = window.jspdf
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const margin = 48
    const pageW  = doc.internal.pageSize.getWidth()
    const maxW   = pageW - margin * 2
    let y        = margin

    function addWrappedText(text, fontSize, bold) {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      const lines = doc.splitTextToSize(text, maxW)
      lines.forEach(line => {
        if (y + fontSize + 6 > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage()
          y = margin
        }
        doc.text(line, margin, y)
        y += fontSize + 6
      })
    }

    addWrappedText(titleRef.current, 18, true)
    y += 10

    sectionsRef.current.forEach(s => {
      y += 6
      addWrappedText(s.heading, 13, true)
      s.poin.forEach(p => addWrappedText(`• ${p}`, 11, false))
    })

    doc.save('outline.pdf')
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="card result-card mb-4">
      <div className="card-header">
        <h5>Generated Outline</h5>
      </div>
      <div className="result-body">
        <EditableText
          as="h2"
          value={data.judul}
          className="outline-title"
          onTextChange={v => { titleRef.current = v }}
        />
        {data.bagian.map((bagian, i) => (
          <SectionCard
            key={i}
            bagian={bagian}
            onSectionChange={updated => {
              sectionsRef.current[i] = updated
            }}
          />
        ))}
        <p className="text-muted mt-3 mb-0" style={{ fontSize: '0.78rem' }}>
          Tip: Click any heading or bullet point to edit it inline.
        </p>
      </div>

      {/* ── Action buttons ── */}
      <div className="card-footer bg-white border-top border-light d-flex flex-wrap gap-2 pt-3 pb-3 px-3">
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={handleCopy}
        >
          Copy Outline
        </button>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={handleDownloadMd}
        >
          Download Markdown (.md)
        </button>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={handleDownloadPdf}
        >
          Download PDF (.pdf)
        </button>
      </div>

      {/* ── Feedback alert ── */}
      {copyAlert === 'success' && (
        <div className="alert alert-success alert-dismissible mx-3 mb-3 py-2 px-3" role="alert" style={{ fontSize: '0.875rem' }}>
          Outline copied successfully!
          <button type="button" className="btn-close btn-close-sm" onClick={() => setCopyAlert(null)} aria-label="Close" />
        </div>
      )}
      {copyAlert === 'error' && (
        <div className="alert alert-danger alert-dismissible mx-3 mb-3 py-2 px-3" role="alert" style={{ fontSize: '0.875rem' }}>
          Failed to copy — clipboard access was denied.
          <button type="button" className="btn-close btn-close-sm" onClick={() => setCopyAlert(null)} aria-label="Close" />
        </div>
      )}
    </div>
  )
}

export default OutlineResult
