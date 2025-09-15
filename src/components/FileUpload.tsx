import { useState, FormEvent, ChangeEvent } from 'react';
import axios, { AxiosError, AxiosResponse } from 'axios';

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

    setIsLoading(true);

    try {
      const formData = new FormData();
      entries.forEach((entry) => {
        formData.append(`files`, entry.file as File);
        formData.append(`platforms`, entry.platform);
      });

      const response: AxiosResponse<UploadResponse> = await axios.post(
        '/api/order/upload',
        formData
      );

      setSuccessMessage(
        `✅ Success! Processed ${response.data.insertedCount} orders.`
      );
      setEntries([{ file: null, platform: '' }]); // reset
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setError(error.response?.data?.message || error.message || 'Upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <h2>📦 Upload Order Files</h2>
      <form onSubmit={handleSubmit} className="upload-form">
        {entries.map((entry, index) => (
          <div key={index} className="upload-row">
            <input
              type="file"
              accept=".xlsx,.csv,.tsv"
              onChange={(e) => handleFileChange(index, e)}
              disabled={isLoading}
            />
            <select
              value={entry.platform}
              onChange={(e) => handlePlatformChange(index, e)}
              disabled={isLoading}
            >
              <option value="">Select Platform</option>
              <option value="TEMU">TEMU</option>
              <option value="EBAY">EBAY</option>
              <option value="AMAZON">AMAZON</option>
            </select>
            {entries.length > 1 && (
              <button
                type="button"
                className="remove-btn"
                onClick={() => handleRemoveEntry(index)}
                disabled={isLoading}
              >
                ❌ Remove
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddEntry}
          className="add-btn"
          disabled={isLoading}
        >
          ➕ Add Another File
        </button>

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

      <style jsx>{`
        .upload-container {
          max-width: 600px;
          margin: 20px auto;
          padding: 20px;
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
        input[type='file'] {
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
