// ShippingConfirmation.tsx
import { useEffect, useRef, useState } from "react";
import api from "../core/Api";

interface Order {
    orderId: string;
    orderReferenceNumber: string;
    orderStatus: string;
}

interface Props {
    batch: string;
}

interface OrderFormState {
    scannedOrderId?: string;
    orderReferenceNumber?: string;
    trackingNumbers: string[];
    cost?: string;
    confirmed: boolean;
}

export default function ShippingConfirmation({ batch: batchId }: Props) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [courier, setCourier] = useState("USPS");
    const [service, setService] = useState("first-class");
    const [generalCost, setGeneralCost] = useState("");
    const [formState, setFormState] = useState<Record<string, OrderFormState>>({});

    const orderIdRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const trackingRefs = useRef<Record<string, HTMLInputElement[]>>({});

    useEffect(() => {
        api.get<Order[]>(`/batch/${batchId}/orders`).then((res) => {
            const allConfirmed = res.every((o) => o.orderStatus === "SHIPPED");
            if (allConfirmed) {
                setFormState({});
                setOrders([]);
                alert("✅ All orders in this batch are already confirmed.");
                return;
            }

            setOrders(res);

            const init: Record<string, OrderFormState> = {};
            res.forEach((o) => {
                init[o.orderId] = {
                    confirmed: false,
                    trackingNumbers: [],
                };
            });
            setFormState(init);
        });
    }, [batchId]);

    const handleScanOrderId = (
        e: React.KeyboardEvent<HTMLInputElement>,
        inputOrderId: string,
        targetOrderId: string
    ) => {
        if (e.key === "Enter") {
            e.preventDefault();

            const match = orders.find((o) => o.orderId === inputOrderId);
            if (!match) {
                alert("Order not found in this batch!");
                return;
            }

            // 🚨 Prevent duplicate scanned orderId
            const alreadyUsed = Object.entries(formState).some(
                ([oid, state]) =>
                    oid !== targetOrderId && state.scannedOrderId === inputOrderId
            );
            if (alreadyUsed) {
                alert("⚠️ This order has already been scanned!");
                return;
            }

            if (formState[targetOrderId] && !formState[targetOrderId].confirmed) {
                setFormState((prev) => ({
                    ...prev,
                    [targetOrderId]: {
                        ...prev[targetOrderId],
                        scannedOrderId: inputOrderId,
                        orderReferenceNumber: match.orderReferenceNumber,
                        confirmed: true,
                        trackingNumbers: [""],
                        cost: generalCost || prev[targetOrderId].cost,
                    },
                }));

                setTimeout(
                    () => trackingRefs.current[targetOrderId]?.[0]?.focus(),
                    0
                );
            }
        }
    };

    const handleTrackingChange = (
        orderId: string,
        index: number,
        value: string
    ) => {
        setFormState((prev) => {
            const trackings = [...(prev[orderId]?.trackingNumbers || [])];
            trackings[index] = value;
            return {
                ...prev,
                [orderId]: {
                    ...prev[orderId],
                    trackingNumbers: trackings,
                },
            };
        });
    };

    const handleAddTracking = (orderId: string) => {
        setFormState((prev) => {
            const trackings = [...(prev[orderId]?.trackingNumbers || []), ""];
            return {
                ...prev,
                [orderId]: {
                    ...prev[orderId],
                    trackingNumbers: trackings,
                },
            };
        });

        setTimeout(() => {
            const refs = trackingRefs.current[orderId] || [];
            refs[refs.length - 1]?.focus();
        }, 0);
    };

    // Apply general cost to all orders
    const handleGeneralCostChange = (value: string) => {
        setGeneralCost(value);
        setFormState((prev) => {
            const updated: Record<string, OrderFormState> = {};
            for (const key of Object.keys(prev)) {
                updated[key] = {
                    ...prev[key],
                    cost: value,
                };
            }
            return updated;
        });
    };

    const allOrdersReady =
        orders.length > 0 &&
        orders.every(
            (o) =>
                formState[o.orderId]?.trackingNumbers.length > 0 &&
                formState[o.orderId]?.trackingNumbers.every((t) => t.trim() !== "")
        );

    const handleConfirmShipping = () => {
        const payload = {
            courier,
            service,
            orderConfirmation: orders.map((o) => ({
                orderId: o.orderId,
                trackingNumbers: formState[o.orderId]?.trackingNumbers || [],
                cost: formState[o.orderId]?.cost,
            })),
        };

        api.post(`/batch/${batchId}/orders/confirm`, payload)
            .then((res) => {
                setFormState({});
                setOrders([]);
                const data = res as { message: string, updatedCount: number };
                alert(`✅ ${data.message} for ${data.updatedCount} orders.`);
            })
            .catch((err) => {
                alert(
                    "Error confirming shipping: " +
                    (err.response?.data?.message || err.message)
                );
            });
    };

    return (
        <div className="shipping-container">
            <span>Shipping Confirmation</span>

            <div className="selectors">
                <label style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <span>Courier:</span>
                    <select
                        value={courier}
                        onChange={(e) => setCourier(e.target.value)}
                    >
                        <option value="">-- Select --</option>
                        <option value="USPS">USPS</option>
                        <option value="UPS">UPS</option>
                        <option value="FEDEX">FEDEX</option>
                        <option value="OTHER">OTHER</option>
                    </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <span>Service:</span>
                    <select
                        value={service}
                        onChange={(e) => setService(e.target.value)}
                    >
                        <option value="">-- Select --</option>
                        {courier === "USPS" && (
                            <>
                                <option value="first-class">First Class</option>
                                <option value="priority">Priority Mail</option>
                                <option value="ground-advantage">Ground Advantage</option>
                            </>
                        )}
                        {courier === "UPS" && (
                            <>
                                <option value="ground">Ground</option>
                                <option value="2day">2nd Day Air</option>
                            </>
                        )}
                        {courier === "FEDEX" && (
                            <>
                                <option value="ground">Ground</option>
                                <option value="overnight">Overnight</option>
                            </>
                        )}
                        {courier === "OTHER" && (
                            <option value="custom">Custom Service</option>
                        )}
                    </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <span>Shipping Cost:</span>
                    <input
                        type="number"
                        placeholder="Type cost"
                        value={generalCost}
                        onChange={(e) => handleGeneralCostChange(e.target.value)}
                        style={{ width: 100 }}
                    />
                </label>
            </div>

            <div className="orders-section">
                {orders.map((order) => {
                    const state = formState[order.orderId] || {};
                    return (
                        <div key={order.orderId} className="order-row">
                            {!state.confirmed ? (
                                <input
                                    type="text"
                                    placeholder="Scan Order ID"
                                    ref={(el) => {
                                        if (el)
                                            orderIdRefs.current[order.orderId] = el;
                                    }}
                                    onKeyDown={(e) =>
                                        handleScanOrderId(
                                            e,
                                            (e.target as HTMLInputElement).value,
                                            order.orderId
                                        )
                                    }
                                />
                            ) : (
                                <>
                                    <span className="confirmed">
                                        ✅ {state.orderReferenceNumber}
                                    </span>

                                    <div className="tracking-section">
                                        {state.trackingNumbers?.map(
                                            (tracking, idx) => (
                                                <input
                                                    key={idx}
                                                    type="text"
                                                    placeholder={`Tracking #${idx + 1
                                                        }`}
                                                    value={tracking}
                                                    ref={(el) => {
                                                        if (
                                                            !trackingRefs.current[
                                                            order.orderId
                                                            ]
                                                        ) {
                                                            trackingRefs.current[
                                                                order.orderId
                                                            ] = [];
                                                        }
                                                        if (el) {
                                                            trackingRefs.current[
                                                                order.orderId
                                                            ][idx] = el;
                                                        }
                                                    }}
                                                    onChange={(e) =>
                                                        handleTrackingChange(
                                                            order.orderId,
                                                            idx,
                                                            e.target.value
                                                        )
                                                    }
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            const refs = trackingRefs.current[order.orderId] || [];
                                                            if (idx < refs.length - 1) {
                                                                // Go to next tracking in same order
                                                                refs[idx + 1]?.focus();
                                                            } else {
                                                                // Go to next order's Scan Order ID input
                                                                const currentIndex = orders.findIndex(
                                                                    (o) => o.orderId === order.orderId
                                                                );
                                                                const nextOrder = orders[currentIndex + 1];
                                                                if (nextOrder) {
                                                                    orderIdRefs.current[nextOrder.orderId]?.focus();
                                                                }
                                                            }
                                                        }
                                                    }}
                                                />
                                            )
                                        )}
                                        <button
                                            type="button"
                                            className="add-tracking-btn"
                                            onClick={() =>
                                                handleAddTracking(order.orderId)
                                            }
                                        >
                                            ➕
                                        </button>
                                    </div>

                                    <input
                                        type="number"
                                        placeholder="Cost"
                                        value={state.cost || ""}
                                        style={{ width: 50 }}
                                        onChange={(e) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                [order.orderId]: {
                                                    ...prev[order.orderId],
                                                    cost: e.target.value,
                                                },
                                            }))
                                        }
                                    />
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {allOrdersReady && (
                <button
                    className="confirm-shipping-btn"
                    onClick={handleConfirmShipping}
                >
                    Confirm Shipping
                </button>
            )}

            <style>{`
        .shipping-container {
          display: flex;
          flex-direction: column;
        }
        .selectors {
          display: flex;
          gap: 20px;
        }
        .orders-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 15px;
        }
        .order-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px;
          background: #f9fafb;
          border-radius: 6px;
        }
        .tracking-section {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .order-row input {
          padding: 6px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
        }
        .confirmed {
          font-weight: bold;
          color: green;
        }
        .add-tracking-btn {
          background: #e5e7eb;
          border: none;
          border-radius: 4px;
          padding: 6px 8px;
          cursor: pointer;
        }
        .add-tracking-btn:hover {
          background: #d1d5db;
        }
        .confirm-shipping-btn {
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px 16px;
          cursor: pointer;
          font-size: 14px;
          align-self: flex-start;
        }
        .confirm-shipping-btn:hover {
          background: #1e40af;
        }
      `}</style>
        </div>
    );
}
