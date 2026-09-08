import { useState } from 'react'
import PdfToImages from './components/PdfToImages.jsx'
import PdfToWord from './components/PdfToWord.jsx'

export default function App() {
  const [tool, setTool] = useState('image')

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-mark" aria-hidden="true">
          <svg viewBox="0 0 120 120" width="72" height="72">
            <path
              d="M28 8 H76 L96 28 V112 H28 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path d="M76 8 V28 H96 Z" fill="currentColor" opacity="0.15" />
            <line x1="40" y1="52" x2="84" y2="52" stroke="currentColor" strokeWidth="2.5" />
            <line x1="40" y1="66" x2="84" y2="66" stroke="currentColor" strokeWidth="2.5" />
            <line x1="40" y1="80" x2="68" y2="80" stroke="currentColor" strokeWidth="2.5" />
          </svg>
        </div>
        <p className="eyebrow">Local, in your browser</p>
        <h1>Paper Trail</h1>
        <p className="hero-sub">
          Turn a PDF into page images, or pull its text into an editable Word file —
          nothing ever leaves your device.
        </p>
      </header>

      <nav className="tool-switch" role="tablist" aria-label="Choose a conversion">
        <button
          role="tab"
          aria-selected={tool === 'image'}
          className={tool === 'image' ? 'switch-btn active' : 'switch-btn'}
          onClick={() => setTool('image')}
        >
          PDF <span className="arrow">to</span> Images
        </button>
        <button
          role="tab"
          aria-selected={tool === 'word'}
          className={tool === 'word' ? 'switch-btn active' : 'switch-btn'}
          onClick={() => setTool('word')}
        >
          PDF <span className="arrow">to</span> Word
        </button>
      </nav>

      <main className="workspace">
        {tool === 'image' ? <PdfToImages /> : <PdfToWord />}
      </main>

      <footer className="foot">
        <p>
          Everything runs on your machine using your browser's own PDF engine — files are
          never uploaded anywhere.
        </p>
      </footer>
    </div>
  )
}
