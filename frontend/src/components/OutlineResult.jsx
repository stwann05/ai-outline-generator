import { useState, useEffect } from 'react'

function EditableText({ as: Tag, value, className }) {
  const [text, setText] = useState(value)

  useEffect(() => {
    setText(value)
  }, [value])

  return (
    <Tag
      className={className}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => setText(e.currentTarget.textContent)}
    >
      {text}
    </Tag>
  )
}

function BagianCard({ bagian }) {
  const [poinList, setPoinList] = useState(bagian.poin)

  useEffect(() => {
    setPoinList(bagian.poin)
  }, [bagian.poin])

  function handlePoinBlur(index, e) {
    const updated = [...poinList]
    updated[index] = e.currentTarget.textContent
    setPoinList(updated)
  }

  return (
    <div className="bagian-card">
      <EditableText as="h3" value={bagian.heading} className="bagian-heading" />
      <ul className="bagian-list">
        {poinList.map((poin, i) => (
          <li
            key={i}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handlePoinBlur(i, e)}
            className="bagian-poin"
          >
            {poin}
          </li>
        ))}
      </ul>
    </div>
  )
}

function OutlineResult({ data, error }) {
  if (!data && !error) return null

  if (error) {
    return (
      <div className="result-error">
        <strong>Terjadi kesalahan:</strong> {error}
      </div>
    )
  }

  return (
    <div className="outline-result">
      <EditableText as="h2" value={data.judul} className="outline-judul" />
      {data.bagian.map((bagian, i) => (
        <BagianCard key={i} bagian={bagian} />
      ))}
    </div>
  )
}

export default OutlineResult
