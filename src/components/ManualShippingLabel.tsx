import { useState, FormEvent } from "react";
import api from "../core/Api";

interface ManualShippingForm {
    name: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
}

export default function ManualShippingLabel() {
    const [form, setForm] = useState<ManualShippingForm>({
        name: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        zip: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage("");

        try {
            const response = await api.post<BlobPart>("/order/manual-label", form, {
                responseType: "blob"
            });

            const blob = new Blob([response], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("target", "_blank");
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setMessage(`✅ Label generated successfully`);
            setForm({ name: "", line1: "", line2: "", city: "", state: "", zip: "" });
        } catch (err) {
            setMessage("❌ Failed to generate label");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="manual-label-container">
            <h2>Create Manual Shipping Label</h2>
            <form onSubmit={handleSubmit} className="manual-label-form">
                <input name="name" placeholder="Recipient Name" value={form.name} onChange={handleChange} required />
                <input name="line1" placeholder="Address Line 1" value={form.line1} onChange={handleChange} required />
                <input name="line2" placeholder="Address Line 2" value={form.line2} onChange={handleChange} />
                <input name="city" placeholder="City" value={form.city} onChange={handleChange} required />
                <input name="state" placeholder="State" value={form.state} onChange={handleChange} required />
                <input name="zip" placeholder="Zip Code" value={form.zip} onChange={handleChange} required />

                <button type="submit" disabled={isLoading}>
                    {isLoading ? "Generating..." : "📦 Generate Label"}
                </button>
            </form>
            {message && <p className="status">{message}</p>}

            <style>{`
        .manual-label-container {
          display: flex;
          flex-direction: column;
          gap: 15px;
          font-family: sans-serif;
          align-items: center;
        }
        .manual-label-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 500px;
          min-width: 400px;
        }
        input {
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 6px;
        }
        button {
          padding: 10px;
          border: none;
          border-radius: 6px;
          background: #2563eb;
          color: white;
          font-weight: bold;
          cursor: pointer;
        }
        button:disabled {
          background: #94a3b8;
        }
        .status {
          font-weight: 500;
        }
      `}</style>
        </div>
    );
}
