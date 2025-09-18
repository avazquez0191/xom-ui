import { useEffect, useState } from "react";
import axios from "axios";
import api from "../core/Api";

interface Batch {
    id: string;
    name: string;
    createdAt: Date;
    platforms: string[];
    labelFile?: string;
    orderCount: number;
}

export default function BatchesList() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get<Batch[]>("/batch").then(res => {
            console.log(res)
            setBatches(res)
        });
    }, []);

    const handleDownload = async (batchId: string, labelFile: string) => {
        setLoading(true);
        try {
            const response = await api.get<BlobPart>(`/batch/${batchId}/labels/${labelFile}`, {
                responseType: "blob"
            });
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `${labelFile}`);
            document.body.appendChild(link);
            link.click();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="batches-container">
            {batches.map((batch) => (
                <div className="batch-row" key={batch.id}>
                    <div className="batch-info">
                        <strong>{batch.name}</strong> | {batch.platforms.join(", ")} | Orders: {batch.orderCount} | {new Date(batch.createdAt).toLocaleString()}
                    </div>
                    <button className="download-btn" onClick={() => handleDownload(batch.id, batch.labelFile || '')}>
                        ⬇️ Download Labels
                    </button>
                </div>
            ))}

            <style>{`
        .batches-container {
          max-width: 700px;
          margin: 20px auto;
          padding: 10px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          font-family: sans-serif;
        }
        .batch-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .batch-row:last-child {
          border-bottom: none;
        }
        .batch-info {
          font-size: 14px;
          color: #111827;
        }
        .download-btn {
          background: #f9fafb;
          color: #1f2937;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 13px;
        }
        .download-btn:hover {
          background: #e5e7eb;
        }
      `}</style>
        </div>
    );
}
