// components/PackageConfirmation.tsx
import { useEffect, useState } from "react"
import api from "../core/Api"

interface Product {
    sku: string
    name: string
    quantityPurchased: number
}

interface Order {
    orderId: string
    orderReferenceNumber?: string
    products: Product[]
    metadata: {
        platform: string
    }
}

interface Package {
    id: number
    products: Record<string, number> // sku -> quantity
}

interface Props {
    batch: string
}

interface ShippingPackage {
    products: ShippingProduct[];
}

interface ShippingProduct {
    sku: string;
    quantity: number;
}

export default function PackageConfirmation({ batch }: Props) {
    const [orders, setOrders] = useState<Order[]>([])
    const [packagesByOrder, setPackagesByOrder] = useState<Record<string, Package[]>>({})

    useEffect(() => {
        api.get<Order[]>(`/batch/${batch}/orders`).then((res) => {
            setOrders(res)
            const init: Record<string, Package[]> = {}
            res.forEach((o) => {
                const fullAlloc: Record<string, number> = {}
                o.products.forEach((p) => {
                    fullAlloc[p.sku] = p.quantityPurchased
                })
                init[o.orderId] = [{ id: 1, products: fullAlloc }]
            })
            setPackagesByOrder(init)
        })
    }, [batch])

    const mapPackagesForApi = (packages: Package[]): ShippingPackage[] => {
        return packages.map(pkg => ({
            label: {}, // can be filled later with tracking info
            products: Object.entries(pkg.products).map(([sku, quantity]) => ({
                sku,
                quantity,
            })),
        }));
    };

    const getRemainingAllocations = (order: Order) => {
        const pkgs = packagesByOrder[order.orderId] || []
        const totals: Record<string, number> = {}
        order.products.forEach((p) => {
            const allocated = pkgs.reduce((sum, pkg) => sum + (pkg.products[p.sku] || 0), 0)
            totals[p.sku] = p.quantityPurchased - allocated
        })
        return totals
    }

    const addPackage = (order: Order) => {
        setPackagesByOrder((prev) => {
            const nextId = (prev[order.orderId]?.length || 0) + 1
            const remaining = getRemainingAllocations(order)
            return {
                ...prev,
                [order.orderId]: [
                    ...(prev[order.orderId] || []),
                    { id: nextId, products: remaining },
                ],
            }
        })
    }

    const removePackage = (orderId: string) => {
        setPackagesByOrder((prev) => {
            const pkgs = prev[orderId]
            if (!pkgs || pkgs.length <= 1) return prev // never remove the first package
            return { ...prev, [orderId]: pkgs.slice(0, -1) }
        })
    }

    const updateAllocation = (
        orderId: string,
        packageId: number,
        sku: string,
        value: number
    ) => {
        setPackagesByOrder((prev) => {
            return {
                ...prev,
                [orderId]: prev[orderId].map((pkg) =>
                    pkg.id === packageId
                        ? {
                            ...pkg,
                            products: { ...pkg.products, [sku]: value },
                        }
                        : pkg
                ),
            }
        })
    }

    const isAllocationComplete = (order: Order) => {
        const totals = getRemainingAllocations(order)
        return Object.values(totals).every((remaining) => remaining === 0)
    }

    const canAddPackage = (order: Order) => {
        if (isAllocationComplete(order)) return false
        const pkgs = packagesByOrder[order.orderId] || []
        if (pkgs.length === 0) return false
        const firstPkg = pkgs[0]
        return order.products.some(
            (p) => (firstPkg.products[p.sku] ?? 0) < p.quantityPurchased
        )
    }

    const handleConfirmOrder = async (orderId: string) => {
        const order = orders.find((o) => o.orderId === orderId)
        if (!order) return
        if (!isAllocationComplete(order)) {
            alert(`❌ Cannot confirm order ${orderId}: allocation incomplete.`)
            return
        }
        const packages = packagesByOrder[orderId]
        const mapped = mapPackagesForApi(packages);
        await api.post(`/batch/${batch}/orders/${orderId}/packages`, { packages: mapped })
        alert(`Packages confirmed for order ${orderId}`)
    }

    const handleConfirmAll = async () => {
        // block confirm all if at least one order incomplete
        const incomplete = orders.filter((o) => !isAllocationComplete(o))
        if (incomplete.length > 0) {
            alert("❌ Some orders have incomplete allocations. Please fix before confirming all.")
            return
        }
        const payload = Object.entries(packagesByOrder).map(([orderId, packages]) => ({
            orderId,
            packages: mapPackagesForApi(packages)
        }))
        await api.post(`/batch/${batch}/orders/packages`, { orders: payload })
        alert("✅ All packages confirmed for this batch")
    }

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 15 }}>
                <h4 style={{ margin: 0, textAlign: "left" }}>Confirm Packages</h4>
                <button className="confirm-btn" onClick={handleConfirmAll}>
                    🚀 Confirm All
                </button>
            </div>
            {orders.map((order) => {
                const pkgs = packagesByOrder[order.orderId] || []
                const complete = isAllocationComplete(order)
                return (
                    <div key={order.orderId} className="order-block">
                        <p style={{ margin: 0, textAlign: "left" }}>
                            {order.metadata.platform} | #{order.orderReferenceNumber} | {order.orderId} |{" "}
                            <b>{complete ? "✅" : "⚠️ Incomplete"}</b>
                        </p>

                        <div className="packages-container">
                            {pkgs.map((pkg, idx) => (
                                <div className="package-card" key={pkg.id}>
                                    <h4 style={{ margin: 0, textAlign: "left" }}>
                                        📦 Package {pkg.id}{" "}
                                        {idx === pkgs.length - 1 && pkgs.length > 1 && (
                                            <button
                                                className="remove-btn"
                                                onClick={() => removePackage(order.orderId)}
                                            >
                                                🗑 Remove
                                            </button>
                                        )}
                                    </h4>
                                    {order.products.map((p) => (
                                        <div className="alloc-row" key={p.sku}>
                                            <label title={p.name} style={{ textAlign: "left", marginRight: 10 }}>
                                                {p.name.length > 90 ? p.name.slice(0, 90) + "…" : p.name}
                                            </label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={p.quantityPurchased}
                                                value={pkg.products[p.sku] ?? 0}
                                                title={`Set allocation`}
                                                placeholder={`Qty for ${p.name}`}
                                                onChange={(e) =>
                                                    updateAllocation(
                                                        order.orderId,
                                                        pkg.id,
                                                        p.sku,
                                                        parseInt(e.target.value) || 0
                                                    )
                                                }
                                            />
                                            /  {p.quantityPurchased}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        <div style={{ textAlign: "right" }}>
                            <button
                                className="add-pkg-btn"
                                disabled={!canAddPackage(order)}
                                onClick={() => addPackage(order)}
                            >
                                ➕ Add Package
                            </button>
                            <button
                                className="confirm-btn"
                                disabled={!complete}
                                onClick={() => handleConfirmOrder(order.orderId)}
                            >
                                ✅ Confirm Packages
                            </button>
                        </div>
                    </div>
                )
            })}
            <style>{`
        .order-block {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 20px;
        }
        .packages-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 10px;
        }
        .package-card {
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 10px;
          background: #f9fafb;
          min-width: 200px;
          position: relative;
        }
        .remove-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #dc2626;
          margin-left: 10px;
        }
        .add-pkg-btn {
            margin-top: 10px;
            margin-right: 10px;
            background: #f3f4f6;
            color: #374151;
            padding: 7px 16px;
            border-radius: 6px;
            border: 1px solid #d1d5db;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s, color 0.15s, border 0.15s;
        }
        .add-pkg-btn:disabled {
            background: #f3f4f6;
            color: #9ca3af;
            border: 1px solid #e5e7eb;
            cursor: not-allowed;
        }
        .add-pkg-btn:hover:enabled {
            background: #e5e7eb;
            color: #111827;
            border: 1px solid #a1a1aa;
        }
        .alloc-row {
          display: flex;
          justify-content: space-between;
          margin: 6px 0;
        }
        .alloc-row label {
          flex: 1;
        }
        .alloc-row input {
          width: 60px;
          text-align: right;
        }
        .confirm-btn {
          margin-top: 12px;
          background: #22c55e;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
        }
        .confirm-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        .confirm-btn:hover:enabled {
          background: #16a34a;
        }
        .global-actions {
          margin-top: 30px;
          text-align: center;
        }
      `}</style>
        </div>
    )
}
