import { useRef, useState } from 'react'
import { saveAs } from 'file-saver'
import { Document, Packer, Paragraph, PageBreak, TextRun } from 'docx'
import { loadPdf } from '../pdfEngine.js'

// Groups a page's text items into reading-order lines based on their y position.
function extractPageLines(textContent) {
  const items = textContent.items.filter((item) => item.str.trim().length > 0)
  const lines = []

  items.forEach((item) => {
    const y = Math.round(item.transform[5])
    let line = lines.find((l) => Math.abs(l.y - y) < 4)
    if (!line) {
      line = { y, parts: [] }
      lines.push(line)
    }
    line.parts.push({ x: item.transform[4], text: item.str })
  })

  lines.sort((a, b) => b.y - a.y)
  return lines.map((line) =>
    line.parts
      .sort((a, b) => a.x - b.x)
      .map((p) => p.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
  )
}

export default function PdfToWord() {
  const [fileName, setFileName] = useState('')
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const reset = () => {
    setStatus('idle')
    setProgress({ done: 0, total: 0 })
    setError('')
  }

  const handleFile = async (file) => {
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('That file is not a PDF. Choose a .pdf file to continue.')
      setStatus('error')
      return
    }
    reset()
    setFileName(file.name)
    setStatus('reading')

    try {
      const buffer = await file.arrayBuffer()
      const pdf = await loadPdf(buffer)
      const total = pdf.numPages
      setProgress({ done: 0, total })
      setStatus('extracting')

      const children = []

      for (let pageNum = 1; pageNum <= total; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const lines = extractPageLines(textContent)

        if (lines.length === 0) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: '[This page has no extractable text — it may be a scanned image.]', italics: true })],
            })
          )
        } else {
          lines.forEach((line) => {
            children.push(new Paragraph({ children: [new TextRun(line)] }))
          })
        }

        if (pageNum < total) {
          children.push(
            new Paragraph({ children: [new TextRun({ children: [new PageBreak()] })] })
          )
        }

        setProgress({ done: pageNum, total })
      }

      setStatus('building')
      const doc = new Document({
        sections: [{ properties: {}, children }],
      })

      const blob = await Packer.toBlob(doc)
      const baseName = file.name.replace(/\.pdf$/i, '')
      saveAs(blob, `${baseName}.docx`)
      setStatus('done')
    } catch (err) {
      console.error(err)
      setError('Could not read that PDF. It may be corrupted or password protected.')
      setStatus('error')
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  return (
    <section className="tool-card">
      <div className="tool-head">
        <h2>PDF to Word</h2>
        <p>Pulls the text out of each page and lays it into a plain, editable .docx file.</p>
      </div>

      <div
        className={dragOver ? 'dropzone drag-over' : 'dropzone'}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <p className="drop-title">
          {fileName ? fileName : 'Drop a PDF here, or click to choose one'}
        </p>
        <p className="drop-sub">Best for text-based PDFs — scanned pages won't have text to pull.</p>
      </div>

      <StatusLine status={status} progress={progress} error={error} />

      <p className="fine-print">
        This runs entirely in your browser, so it can only extract text — it won't reproduce
        columns, tables, or exact fonts the way the original document had them.
      </p>
    </section>
  )
}

function StatusLine({ status, progress, error }) {
  if (status === 'idle') return null
  if (status === 'error') return <p className="status status-error">{error}</p>
  if (status === 'reading') return <p className="status">Opening file…</p>
  if (status === 'extracting')
    return (
      <p className="status">
        Reading page {progress.done} of {progress.total}…
      </p>
    )
  if (status === 'building') return <p className="status">Building your Word document…</p>
  if (status === 'done') return <p className="status status-done">Done — check your downloads.</p>
  return null
}
