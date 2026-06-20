import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { client } from '../api/client'

interface AppContextType {
  entityId: string
}

export default function Ingestion() {
  const { entityId } = useOutletContext<AppContextType>()
  
  // CSV States
  const [bankCsv, setBankCsv] = useState('')
  const [ledgerCsv, setLedgerCsv] = useState('')
  const [bankFileSelected, setBankFileSelected] = useState<string | null>(null)
  const [ledgerFileSelected, setLedgerFileSelected] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  
  // Matching state
  const [matching, setMatching] = useState(false)
  
  // PDF state
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfParsing, setPdfParsing] = useState(false)
  const [parsedMarkdown, setParsedMarkdown] = useState('')

  // Handle CSV file selection and reading
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'bank' | 'ledger') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (type === 'bank') {
      setBankFileSelected(file.name)
    } else {
      setLedgerFileSelected(file.name)
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (type === 'bank') {
        setBankCsv(text)
      } else {
        setLedgerCsv(text)
      }
    }
    reader.readAsText(file)
  }

  // Handle upload of both CSVs
  const handleUploadCsvs = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entityId) {
      alert('Please select an active entity first.')
      return
    }
    if (!bankCsv.trim() && !ledgerCsv.trim()) {
      alert('Please enter or upload at least one CSV dataset.')
      return
    }

    setUploading(true)
    try {
      if (bankCsv.trim()) {
        await client.post('/recon/bank/upload/', {
          entity_id: entityId,
          csv_text: bankCsv,
          source_type: 'bank'
        })
      }
      if (ledgerCsv.trim()) {
        await client.post('/recon/bank/upload/', {
          entity_id: entityId,
          csv_text: ledgerCsv,
          source_type: 'ledger'
        })
      }
      alert('Data uploaded successfully! Click OK to continue.')
      setBankCsv('')
      setLedgerCsv('')
      setBankFileSelected(null)
      setLedgerFileSelected(null)
    } catch (err: any) {
      alert(`Upload failed: ${err.message || err}`)
    } finally {
      setUploading(false)
    }
  }

  // Trigger matching engine
  const handleRunReconciliation = async () => {
    if (!entityId) {
      alert('Please select an active entity first.')
      return
    }
    setMatching(true)
    try {
      const res = await client.post('/recon/bank/run/', { entity_id: entityId })
      alert(`Reconciliation matching finished! Created/Routed ${res.exceptions_created} exceptions.`);
    } catch (err: any) {
      alert(`Failed to run reconciliation: ${err.message || err}`)
    } finally {
      setMatching(false)
    }
  }

  // Handle PDF Statement parsing
  const handlePdfUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pdfFile) return
    
    setPdfParsing(true)
    setParsedMarkdown('')
    
    const formData = new FormData()
    formData.append('file', pdfFile)

    try {
      const res = await fetch('http://localhost:8001/parse-document', {
        method: 'POST',
        body: formData
      })
      if (!res.ok) throw new Error('PDF parsing failed')
      const data = await res.json()
      setParsedMarkdown(data.markdown || 'No text extracted.')
    } catch (err: any) {
      setParsedMarkdown(`Error: ${err.message}`)
    } finally {
      setPdfParsing(false)
    }
  }

  return (
    <div className="page-container" style={{ padding: 0 }}>
      <div className="page-header-row">
        <div>
          <h1>Data Ingestion</h1>
          <p>Import transaction entries and execute reconciliation matching rules.</p>
        </div>
      </div>

      <div className="grid-2">
        {/* CSV Upload Column */}
        <div>
          <div className="card">
            <h2>CSV Transaction Upload</h2>
            <p style={{ fontSize: '13px', marginBottom: '16px' }}>Provide datasets for statement and ledger. Files must contain: <code>txn_date</code>, <code>amount</code>, <code>reference</code>, <code>counterparty</code>.</p>
            
            <form onSubmit={handleUploadCsvs}>
              {/* Bank Statement File */}
              <div className="form-group">
                <label className="form-label">🏦 Bank Statement CSV</label>
                <div className="drag-drop-area" style={{ padding: '16px' }}>
                  <input 
                    type="file" 
                    accept=".csv"
                    onChange={(e) => handleFileChange(e, 'bank')}
                    style={{ display: 'none' }}
                    id="bank-file-input"
                  />
                  <label htmlFor="bank-file-input" style={{ cursor: 'pointer' }}>
                    <div style={{ fontSize: '24px' }}>📄</div>
                    <div style={{ fontWeight: 500, fontSize: '13px', marginTop: '4px' }}>
                      {bankFileSelected ? `Selected: ${bankFileSelected}` : 'Click to select Bank Statement CSV'}
                    </div>
                  </label>
                </div>
                <textarea 
                  value={bankCsv}
                  onChange={(e) => setBankCsv(e.target.value)}
                  placeholder="Or paste bank statement CSV rows here..."
                  className="form-input"
                  style={{ height: '80px', fontFamily: 'monospace', fontSize: '11px', resize: 'none' }}
                />
              </div>

              {/* General Ledger File */}
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label className="form-label">📖 General Ledger CSV</label>
                <div className="drag-drop-area" style={{ padding: '16px' }}>
                  <input 
                    type="file" 
                    accept=".csv"
                    onChange={(e) => handleFileChange(e, 'ledger')}
                    style={{ display: 'none' }}
                    id="ledger-file-input"
                  />
                  <label htmlFor="ledger-file-input" style={{ cursor: 'pointer' }}>
                    <div style={{ fontSize: '24px' }}>📄</div>
                    <div style={{ fontWeight: 500, fontSize: '13px', marginTop: '4px' }}>
                      {ledgerFileSelected ? `Selected: ${ledgerFileSelected}` : 'Click to select General Ledger CSV'}
                    </div>
                  </label>
                </div>
                <textarea 
                  value={ledgerCsv}
                  onChange={(e) => setLedgerCsv(e.target.value)}
                  placeholder="Or paste ledger CSV rows here..."
                  className="form-input"
                  style={{ height: '80px', fontFamily: 'monospace', fontSize: '11px', resize: 'none' }}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                disabled={uploading}
              >
                {uploading ? 'Processing Data Upload...' : '📥 Ingest Datasets'}
              </button>
            </form>
          </div>

          <div className="card" style={{ borderColor: '#818cf8', background: '#f5f7ff' }}>
            <h2>Matching Pipeline</h2>
            <p style={{ fontSize: '13px', marginBottom: '16px' }}>Run the matching engine to process loaded datasets, check against rules and tolerances, and generate exceptions.</p>
            <button 
              onClick={handleRunReconciliation}
              className="btn btn-primary"
              style={{ width: '100%', background: '#4F46E5' }}
              disabled={matching}
            >
              {matching ? 'Running Matching Rules...' : '⚡ Run Reconciliation Matching'}
            </button>
          </div>
        </div>

        {/* PDF Extraction Column */}
        <div>
          <div className="card">
            <h2>AI Document Parsing</h2>
            <p style={{ fontSize: '13px', marginBottom: '16px' }}>Convert unstructured PDF statements or invoices into structured Markdown using the FastAPI AI service pipeline.</p>
            
            <form onSubmit={handlePdfUpload}>
              <div className="form-group">
                <div className="drag-drop-area">
                  <div className="upload-icon">📁</div>
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setPdfFile(file)
                    }}
                    style={{ display: 'none' }}
                    id="pdf-file-input"
                  />
                  <label htmlFor="pdf-file-input" style={{ cursor: 'pointer' }}>
                    <div style={{ fontWeight: 600 }}>
                      {pdfFile ? `Selected: ${pdfFile.name}` : 'Drag & drop or click to upload statement PDF'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Supports PDF format up to 50MB</div>
                  </label>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-secondary" 
                style={{ width: '100%' }}
                disabled={pdfParsing || !pdfFile}
              >
                {pdfParsing ? 'Parsing PDF Document...' : '✨ Parse PDF to Markdown'}
              </button>
            </form>

            {parsedMarkdown && (
              <div style={{ marginTop: '20px' }}>
                <label className="form-label">Extracted Markdown Output</label>
                <div style={{ background: '#f9fafb', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '12px', height: '260px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                  {parsedMarkdown}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
