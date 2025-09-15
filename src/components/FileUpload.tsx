import { useState, FormEvent, ChangeEvent } from 'react';
import axios, { AxiosError, AxiosResponse } from 'axios';

interface UploadResponse {
  insertedCount: number;
  message?: string;
}

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [platform, setPlatform] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setError(''); // Clear previous errors on new file selection
  };

  const handlePlatformChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setPlatform(e.target.value);
    setError(''); // Clear previous errors on new platform selection
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
    formData.append('platform', platform);

    try {
      const response: AxiosResponse<UploadResponse> = await axios.post(
        '/api/order/upload',
        formData
      );
      console.log(`Success! Processed ${response.data.insertedCount} orders.`);
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
        {/* implement a select with the values TEMU, EBAY, AMAZON */}
        <label htmlFor="platform-select">Platform:</label>
        <select id="platform-select" name="platform" onChange={handlePlatformChange} value={platform} disabled={isLoading}>
          <option value="">Select Platform</option>
          <option value="TEMU">TEMU</option>
          <option value="EBAY">EBAY</option>
          <option value="AMAZON">AMAZON</option>
        </select>
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