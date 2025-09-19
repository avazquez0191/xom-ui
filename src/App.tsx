// App.tsx
import './App.css'
import FileUpload from './components/FileUpload'
import BatchesList from './components/BatchesList'
import ShippingConfirmation from './components/ShippingConfirmation'
import { useState } from 'react'

function App() {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)

  return (
    <div className="app-container">
      <div className="left-panel">
        <div className="file-upload-section">
          <FileUpload />
          <BatchesList onConfirmShipping={(batchId) => setSelectedBatchId(batchId)} />
        </div>
      </div>
      <div className="right-panel">
        {selectedBatchId && (
          <ShippingConfirmation batch={selectedBatchId} />
        )}
      </div>

      <style>{`
        .app-container {
          display: flex;
          height: 100vh;
          gap: 20px;
          padding: 20px;
          background: #f3f4f6;
          box-sizing: border-box;
        }
        .left-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .file-upload-section {
          flex: 1;
          overflow-y: auto;
        }
        .right-panel {
          flex: 1;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          padding: 16px;
          overflow-y: auto;
        }
      `}</style>
    </div>
  )
}

export default App
