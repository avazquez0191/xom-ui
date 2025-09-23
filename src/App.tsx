// App.tsx
import './App.css'
import FileUpload from './components/FileUpload'
import BatchesList from './components/BatchesList'
import ShippingConfirmation from './components/ShippingConfirmation'
import PackageConfirmation from './components/PackageConfirmation'
import { useState } from 'react'

type RightPanelMode = 'shipping' | 'packages' | null

function App() {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
  const [panelMode, setPanelMode] = useState<RightPanelMode>(null)

  return (
    <div className="app-container">
      <div className="left-panel">
        <div className="file-upload-section">
          <FileUpload />
          <BatchesList
            onConfirmShipping={(batchId) => {
              setSelectedBatchId(batchId)
              setPanelMode('shipping')
            }}
            onConfirmPackages={(batchId) => {
              setSelectedBatchId(batchId)
              setPanelMode('packages')
            }}
          />
        </div>
      </div>
      <div className="right-panel">
        {selectedBatchId && panelMode === 'shipping' && (
          <ShippingConfirmation batch={selectedBatchId} />
        )}
        {selectedBatchId && panelMode === 'packages' && (
          <PackageConfirmation batch={selectedBatchId} />
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
        // .file-upload-section {
        //   flex: 1;
        //   overflow-y: auto;
        // }
        .right-panel {
          flex: 2;
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
