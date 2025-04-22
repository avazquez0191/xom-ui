import { useState, FormEvent, ChangeEvent } from 'react';
import axios, { AxiosError, AxiosResponse } from 'axios';

interface UploadResponse {
  count: number;
  message?: string;
}

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setError(''); // Clear previous errors on new file selection
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response: AxiosResponse<UploadResponse> = await axios.post(
        '/api/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      alert(`Success! Processed ${response.data.count} orders.`);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setError(error.response?.data?.message || error.message || 'Upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <form onSubmit={handleSubmit}>
        <label htmlFor="file-upload">Upload File:</label>
        <input
          id="file-upload"
          type="file"
          accept=".xlsx,.csv,.tsv"
          onChange={handleFileChange}
          disabled={isLoading}
        />
        <button 
          type="submit" 
          disabled={!file || isLoading}
          className={isLoading ? 'loading' : ''}
        >
          {isLoading ? 'Processing...' : 'Upload Orders'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}