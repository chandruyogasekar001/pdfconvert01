import { useRef, useState } from 'react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { loadPdf } from '../pdfEngine.js'

const FORMATS = [
  { id: 'png', label: 'PNG', mime: 'image/png', ext: 'png' },
  { id: 'jpeg', label: 'JPG', mime: 'image/jpeg', ext: 'jpg' },
]

export default function PdfToImages() {
  const [fileName, setFileName] = useState('')
  const [format, setFormat] = useState('png')
  const [scale, setScale] = useState(2)
  const [status, setStatus] = useState('idle') // idle | reading | rendering | zipping | done | error
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
      setStatus('rendering')

      const activeFormat = FORMATS.find((f) => f.id === format)
      const blobs = []

      for (let pageNum = 1; pageNum <= total; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')
        await page.render({ canvasContext: ctx, viewport }).promise

        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, activeFormat.mime, 0.92)
        )
        blobs.push(blob)
        setProgress({ done: pageNum, total })
      }

      const baseName = file.name.replace(/\.pdf$/i, '')

      if (blobs.length === 1) {
        saveAs(blobs[0], `${baseName}.${activeFormat.ext}`)
        setStatus('done')
        return
      }

      setStatus('zipping')
      const zip = new JSZip()
      blobs.forEach((blob, idx) => {
        const num = String(idx + 1).padStart(2, '0')
        zip.file(`${baseName}-page-${num}.${activeFormat.ext}`, blob)
      })
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      saveAs(zipBlob, `${baseName}-images.zip`)
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
        <h2>PDF to Images</h2>
        <p>Every page is rendered at full resolution and saved as its own image file.</p>
      </div>

      <div className="options-row">
        <div className="option-group">
          <span className="option-label">Format</span>
          <div className="pill-group">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                className={format === f.id ? 'pill active' : 'pill'}
                onClick={() => setFormat(f.id)}
                type="button"
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="option-group">
          <span className="option-label">Quality</span>
          <div className="pill-group">
            {[
              { v: 1, label: 'Standard' },
              { v: 2, label: 'High' },
              { v: 3, label: 'Print' },
            ].map((s) => (
              <button
                key={s.v}
                className={scale === s.v ? 'pill active' : 'pill'}
                onClick={() => setScale(s.v)}
                type="button"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
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
        <p className="drop-sub">Single page files download directly · multi-page files as a .zip</p>
      </div>

      <StatusLine status={status} progress={progress} error={error} action="images" />
    </section>
  )
}

function StatusLine({ status, progress, error, action }) {
  if (status === 'idle') return null
  if (status === 'error') return <p className="status status-error">{error}</p>
  if (status === 'reading') return <p className="status">Opening file…</p>
  if (status === 'rendering')
    return (
      <p className="status">
        Rendering page {progress.done} of {progress.total}…
      </p>
    )
  if (status === 'zipping') return <p className="status">Packing pages into a zip…</p>
  if (status === 'done') return <p className="status status-done">Done — check your downloads.</p>
  return null
}
