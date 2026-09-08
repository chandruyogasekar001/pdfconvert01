# Paper Trail — PDF Converter

A 100% frontend React app (no backend, no uploads) that converts PDFs:

- **PDF → Images**: renders every page to PNG or JPG at your chosen quality.
- **PDF → Word**: extracts text from each page into an editable `.docx` file.

Everything runs in the browser using `pdf.js`. Files never leave your device.

## Run it locally

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`).

## Build for production / deploy

```bash
npm run build
```

This outputs a static `dist/` folder you can host anywhere — including free on
Cloudflare Pages (framework preset: Vite, build command: `npm run build`,
output directory: `dist`).

## Notes & limits

- PDF → Word only extracts text — it won't preserve columns, tables, images,
  or exact fonts from the original PDF. A pure-frontend app can't run a full
  document-layout engine.
- Scanned PDFs (photographed/scanned pages with no real text layer) won't
  have extractable text, so PDF → Word will note that on those pages.
- Multi-page PDF → Images downloads are bundled into a `.zip`.
