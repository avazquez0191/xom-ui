import { useState, FormEvent, ChangeEvent } from 'react';
import { AxiosError } from 'axios';
import api from "../core/Api";

interface UploadResponse {
  insertedCount: number;
  message?: string;
}

interface FileEntry {
  file: File | null;
  platform: string;
}

export default function FileUpload() {
  const [entries, setEntries] = useState<FileEntry[]>([
    { file: null, platform: '' },
  ]);
  const [orderReferenceStart, setOrderReferenceStart] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const handleFileChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const newEntries = [...entries];
    newEntries[index].file = e.target.files?.[0] || null;
    setEntries(newEntries);
    setError('');
  };

  const handlePlatformChange = (
    index: number,
    e: ChangeEvent<HTMLSelectElement>
  ) => {
    const newEntries = [...entries];
    newEntries[index].platform = e.target.value;
    setEntries(newEntries);
    setError('');
  };

  const handleAddEntry = () => {
    setEntries([...entries, { file: null, platform: '' }]);
  };

  const handleRemoveEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // validate all entries
    for (const entry of entries) {
      if (!entry.file) {
        setError('Please select a file for all entries');
        return;
      }
      if (!entry.platform) {
        setError('Please select a platform for all entries');
        return;
      }
    }

    // validates reference required
    if (!orderReferenceStart) {
      setError('Reference number is required.');
      return;
    }

    // validate reference start if provided
    const trimmedRef = orderReferenceStart.trim();
    if (trimmedRef && !/^\d+$/.test(trimmedRef)) {
      setError('Reference number must be a positive integer (or left empty).');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      entries.forEach((entry) => {
        formData.append('files', entry.file as File);
        formData.append('platforms', entry.platform);
      });

      if (trimmedRef) {
        // send the starting reference number (server should parse it as integer)
        formData.append('orderReferenceStart', trimmedRef);
      }

      api.post<UploadResponse>('/batch/orders', formData).then(data => {
        setSuccessMessage(`✅ Success! Processed ${data.insertedCount} orders.`);
        setEntries([{ file: null, platform: '' }]);
        setOrderReferenceStart('');
        //reload page after 500ms to show new orders
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      });
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setError(error.response?.data?.message || error.message || 'Upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <span>Upload Order Files</span>

      <form onSubmit={handleSubmit} className="upload-form">
        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          Reference Number
          <input
            type="number"
            min="1"
            value={orderReferenceStart}
            onChange={(e) => setOrderReferenceStart(e.target.value)}
            placeholder="e.g. 1000"
            disabled={isLoading}
            style={{
              width: '100px',
            }}
          />
        </label>

        {entries.map((entry, index) => (
          <div key={index} className="upload-row">
            <input
              type="file"
              accept=".xlsx,.csv,.tsv"
              onChange={(e) => handleFileChange(index, e)}
              disabled={isLoading}
              title="Select order file (.xlsx, .csv, .tsv)"
              placeholder="Choose a file"
            />
            <select
              id={`platform-select-${index}`}
              value={entry.platform}
              onChange={(e) => handlePlatformChange(index, e)}
              disabled={isLoading}
              title="Select Platform"
            >
              <option value="">Select Platform</option>
              <option value="TEMU">TEMU</option>
              <option value="EBAY">EBAY</option>
              <option value="AMAZON">AMAZON</option>
            </select>
            {entries.length > 1 && entries.length - 1 === index && (
              <button
                type="button"
                className="remove-btn"
                onClick={() => handleRemoveEntry(index)}
                disabled={isLoading}
              >
                ❌
              </button>
            )}
            {entries.length - 1 === index && (
              <button
                type="button"
                onClick={handleAddEntry}
                className="add-btn"
                disabled={isLoading}
              >
                ➕ Add File
              </button>
            )}
          </div>
        ))}



        <button
          type="submit"
          disabled={isLoading || entries.length === 0}
          className="submit-btn"
        >
          {isLoading ? 'Processing...' : '🚀 Upload Orders'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {successMessage && <p className="success">{successMessage}</p>}

      <style>{`
        .upload-container {
          padding: 20px;
          margin-bottom: 20px;
          border-radius: 8px;
          background: #f9fafb;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          font-family: sans-serif;
        }
        .upload-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .upload-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        select,
        input[type='file'],
        input[type='number'] {
          padding: 6px;
          border: 1px solid #ccc;
          border-radius: 6px;
        }
        .add-btn,
        .remove-btn,
        .submit-btn {
          padding: 8px 14px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        .add-btn {
          background: #e0f2fe;
          color: #0369a1;
        }
        .remove-btn {
          background: #fee2e2;
          color: #b91c1c;
        }
        .submit-btn {
          background: #22c55e;
          color: white;
          font-weight: bold;
        }
        .submit-btn:disabled {
          background: #a1a1aa;
        }
        .error {
          color: #dc2626;
          font-weight: 500;
        }
        .success {
          color: #16a34a;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
