import { useEffect, useState } from "react";
import api from "../core/Api";

interface Batch {
    id: string;
    name: string;
    createdAt: Date;
    platforms: string[];
    labelFile?: string;
    orderCount: number;
}

interface Props {
    onConfirmShipping: (batchId: string) => void;
    onConfirmPackages: (batchId: string) => void;
}

export default function BatchesList({ onConfirmShipping, onConfirmPackages }: Props) {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loadingBatches, setLoadingBatches] = useState<Record<string, boolean>>({});

    useEffect(() => {
        api.get<Batch[]>("/batch").then(res => setBatches(res));
    }, []);

    const handleDownload = async (batchId: string) => {
        // if (!labelFile) return;
        setLoadingBatches(prev => ({ ...prev, [batchId]: true }));
        try {
            const response = await api.get<BlobPart>(`/batch/${batchId}/labels/print`, {
                responseType: "blob"
            });
            const blob = new Blob([response], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            // link.setAttribute("download", labelFile);
            link.setAttribute("target", "_blank");
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } finally {
            setLoadingBatches(prev => ({ ...prev, [batchId]: false }));
        }
    };

    const handleExportShippingConfirmation = async (batchId: string) => {
        setLoadingBatches(prev => ({ ...prev, [batchId]: true }));
        try {
            const response = await api.get<Blob>(`/batch/${batchId}/export/shipping-confirmation`, {
                responseType: "blob"
            });
            const blob = new Blob([response], { type: "application/zip" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `shipping-confirmations-batch-${batchId}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } finally {
            setLoadingBatches(prev => ({ ...prev, [batchId]: false }));
        }
    };

    const handleExportAccounting = async (batchId: string) => {
        setLoadingBatches(prev => ({ ...prev, [batchId]: true }));
        try {
            const response = await api.get<Blob>(`/batch/${batchId}/export/accounting`, {
                responseType: "blob"
            });
            const blob = new Blob([response], { type: "application/zip" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `accounting-batch-${batchId}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } finally {
            setLoadingBatches(prev => ({ ...prev, [batchId]: false }));
        }
    };

    return (
        <div className="batches-container">
            {batches.map((batch) => (
                <div className="batch-row" key={batch.id}>
                    <div className="batch-info">
                        <strong>{batch.name}</strong> | {batch.platforms.join(", ")} | {batch.orderCount} | {new Date(batch.createdAt).toLocaleString()}
                    </div>
                    <div className="batch-actions">
                        <div className="dropdown">
                            <button className="dropdown-toggle" disabled={loadingBatches[batch.id]}>
                                ⋮
                            </button>
                            <div className="dropdown-menu">
                                <button
                                    className="packages-btn"
                                    onClick={() => onConfirmPackages(batch.id)}
                                    disabled={loadingBatches[batch.id]}
                                >
                                    📦 Confirm Packages
                                </button>
                                <button
                                    className="download-btn"
                                    onClick={() => handleDownload(batch.id)}
                                    disabled={loadingBatches[batch.id]}
                                >
                                    ⬇️ Labels
                                </button>
                                <button
                                    className="confirm-btn"
                                    onClick={() => onConfirmShipping(batch.id)}
                                    disabled={loadingBatches[batch.id]}
                                >
                                    ✅ Confirm Shipping
                                </button>
                                <button
                                    className="export-btn"
                                    onClick={() => handleExportShippingConfirmation(batch.id)}
                                    disabled={loadingBatches[batch.id]}
                                >
                                    📦 Export Shipping Confirmation
                                </button>
                                <button
                                    className="export-btn"
                                    onClick={() => handleExportAccounting(batch.id)}
                                    disabled={loadingBatches[batch.id]}
                                >
                                    📊 Export Accounting
                                </button>
                            </div>
                            <style>{`
                                
                            `}</style>
                        </div>
                    </div>
                </div>
            ))}

            <style>{`
                .batches-container {
                max-width: 700px;
                margin: 0 auto;
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
                .dropdown {
                    position: relative;
                    display: inline-block;
                }
                .dropdown-toggle {
                    background: #f9fafb;
                    color: #1f2937;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    padding: 6px 12px;
                    cursor: pointer;
                    font-size: 18px;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .dropdown-menu {
                    display: none;
                    position: absolute;
                    right: 0;
                    top: 110%;
                    background: #fff;
                    min-width: 220px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
                    border-radius: 8px;
                    z-index: 10;
                    flex-direction: column;
                    padding: 8px 0;
                }
                .dropdown:hover .dropdown-menu,
                .dropdown:focus-within .dropdown-menu {
                    display: flex;
                }
                .dropdown-menu button {
                    width: 100%;
                    text-align: left;
                    border: none;
                    background: none;
                    padding: 10px 18px;
                    font-size: 14px;
                    cursor: pointer;
                }
                .dropdown-menu button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .dropdown-menu button:hover:not(:disabled) {
                    background: #f3f4f6;
                }
                .batch-actions {
                display: flex;
                gap: 8px;
                }
                .batch-row:last-child {
                border-bottom: none;
                }
                .batch-info {
                font-size: 14px;
                color: #111827;
                }
                .batch-actions button {
                background: #f9fafb;
                color: #1f2937;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                padding: 6px 12px;
                cursor: pointer;
                font-size: 13px;
                }
                .download-btn:hover, .confirm-btn:hover {
                background: #e5e7eb;
                }
                .batch-actions { display: flex; gap: 8px; }
                .packages-btn {
                background: #e0f2fe;
                color: #0369a1;
                border: 1px solid #bae6fd;
                border-radius: 6px;
                padding: 6px 12px;
                cursor: pointer;
                font-size: 13px;
                }
                .packages-btn:hover {
                background: #bae6fd;
                }
            `}</style>
        </div>
    );
}
