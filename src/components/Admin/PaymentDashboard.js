'use client';
import { useState, useEffect } from 'react';
import styles from '@/app/admin/dashboard/page.module.css';

export default function PaymentDashboard() {
    const [orders, setOrders] = useState([]);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [ordersRes, configRes] = await Promise.all([
                fetch('/api/orders'),
                fetch('/api/site-config')
            ]);

            if (ordersRes.ok) {
                const data = await ordersRes.json();
                setOrders(data);
            }
            if (configRes.ok) {
                const data = await configRes.json();
                setConfig(data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfigChange = (field, value) => {
        setConfig(prev => ({
            ...prev,
            paymentConfig: {
                ...prev.paymentConfig,
                [field]: value
            }
        }));
    };

    const handleSaveConfig = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/site-config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            if (res.ok) alert('Payment settings updated!');
            else alert('Failed to update settings.');
        } catch (e) {
            console.error(e);
            alert('Error saving settings.');
        } finally {
            setSaving(false);
        }
    };

    // Calculate Stats
    const totalRevenue = orders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);
    const totalPending = orders.reduce((sum, o) => sum + Math.max(0, (o.amountTotal || 0) - (o.amountPaid || 0)), 0);

    // Get all transactions
    const transactions = orders.flatMap(o =>
        (o.transactions || []).map(t => ({ ...t, clientName: o.clientName, orderId: o._id }))
    ).sort((a, b) => new Date(b.date) - new Date(a.date));

    if (loading) return <div>Loading Payment Dashboard...</div>;

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2>Payment Dashboard</h2>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard} style={{ borderColor: '#22c55e', background: '#f0fdf4' }}>
                    <h3>Total Revenue</h3>
                    <p style={{ color: '#15803d' }}>₹{totalRevenue.toLocaleString()}</p>
                </div>
                <div className={styles.statCard} style={{ borderColor: '#ef4444', background: '#fef2f2' }}>
                    <h3>Total Pending</h3>
                    <p style={{ color: '#b91c1c' }}>₹{totalPending.toLocaleString()}</p>
                </div>
                <div className={styles.statCard}>
                    <h3>Total Transactions</h3>
                    <p>{transactions.length}</p>
                </div>
            </div>

            <div className={styles.formGrid} style={{ marginTop: '2rem' }}>
                {/* Payment Settings */}
                <div className={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Payment Settings</h3>
                        <button
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            onClick={handleSaveConfig}
                            disabled={saving}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        >
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Advance Payment %</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={config?.paymentConfig?.advancePercentage || 50}
                            onChange={(e) => handleConfigChange('advancePercentage', Number(e.target.value))}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>GST / Tax Rate (%)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={config?.paymentConfig?.taxRate || 0}
                            onChange={(e) => handleConfigChange('taxRate', Number(e.target.value))}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Invoice Footer Note</label>
                        <input
                            type="text"
                            value={config?.paymentConfig?.invoiceNote || ''}
                            onChange={(e) => handleConfigChange('invoiceNote', e.target.value)}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Refund/Cancellation Policies</label>
                        <textarea
                            value={config?.paymentConfig?.policies || ''}
                            onChange={(e) => handleConfigChange('policies', e.target.value)}
                            rows={4}
                        />
                    </div>
                </div>

                {/* Manual Payment Settings */}
                <div className={styles.card}>
                    <h3>Manual Payment (UPI / QR)</h3>
                    <div className={styles.inputGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                        <input
                            type="checkbox"
                            checked={config?.paymentConfig?.manualPayment?.enabled ?? true}
                            onChange={(e) => setConfig(prev => ({
                                ...prev,
                                paymentConfig: {
                                    ...prev.paymentConfig,
                                    manualPayment: {
                                        ...(prev.paymentConfig?.manualPayment || {}),
                                        enabled: e.target.checked
                                    }
                                }
                            }))}
                            style={{ width: 'auto' }}
                        />
                        <label style={{ margin: 0 }}>Enable Manual Payment</label>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>UPI ID</label>
                        <input
                            type="text"
                            placeholder="e.g. name@upi"
                            value={config?.paymentConfig?.manualPayment?.upiId || config?.contact?.upiId || ''}
                            onChange={(e) => setConfig(prev => ({
                                ...prev,
                                paymentConfig: {
                                    ...prev.paymentConfig,
                                    manualPayment: {
                                        ...(prev.paymentConfig?.manualPayment || {}),
                                        upiId: e.target.value
                                    }
                                }
                            }))}
                        />
                        <small style={{ color: '#64748b' }}>
                            {config?.contact?.upiId ? `(Default from Contact: ${config.contact.upiId})` : ''}
                        </small>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>QR Code Image URL</label>
                        <input
                            type="text"
                            placeholder="https://..."
                            value={config?.paymentConfig?.manualPayment?.qrCode || ''}
                            onChange={(e) => setConfig(prev => ({
                                ...prev,
                                paymentConfig: {
                                    ...prev.paymentConfig,
                                    manualPayment: {
                                        ...(prev.paymentConfig?.manualPayment || {}),
                                        qrCode: e.target.value
                                    }
                                }
                            }))}
                        />
                        <small>Paste a direct link to your QR Code image or upload one below.</small>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;

                                const formData = new FormData();
                                formData.append('file', file);

                                try {
                                    const res = await fetch('/api/upload', {
                                        method: 'POST',
                                        body: formData
                                    });
                                    if (res.ok) {
                                        const data = await res.json();
                                        setConfig(prev => ({
                                            ...prev,
                                            paymentConfig: {
                                                ...prev.paymentConfig,
                                                manualPayment: {
                                                    ...(prev.paymentConfig?.manualPayment || {}),
                                                    qrCode: data.path
                                                }
                                            }
                                        }));
                                        alert('QR Code uploaded successfully!');
                                    } else {
                                        alert('Upload failed.');
                                    }
                                } catch (err) {
                                    console.error(err);
                                    alert('Error uploading file.');
                                }
                            }}
                            style={{ marginTop: '0.5rem' }}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Instructions for Client</label>
                        <textarea
                            value={config?.paymentConfig?.manualPayment?.instructions || ''}
                            onChange={(e) => setConfig(prev => ({
                                ...prev,
                                paymentConfig: {
                                    ...prev.paymentConfig,
                                    manualPayment: {
                                        ...(prev.paymentConfig?.manualPayment || {}),
                                        instructions: e.target.value
                                    }
                                }
                            }))}
                            rows={3}
                        />
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
                    <h3>Recent Transactions</h3>
                    <div className={styles.tableCard} style={{ boxShadow: 'none', border: '1px solid #e2e8f0', marginTop: '1rem' }}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Client</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Status</th>
                                    <th>Reference ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((t, i) => (
                                    <tr key={i}>
                                        <td>{new Date(t.date).toLocaleDateString()}</td>
                                        <td>{t.clientName}</td>
                                        <td style={{ fontWeight: 'bold', color: '#15803d' }}>+₹{t.amount}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{t.method || 'Manual'}</td>
                                        <td>
                                            <span className={styles.statusBadge} style={{ background: '#dcfce7', color: '#166534' }}>
                                                {t.status || 'Success'}
                                            </span>
                                        </td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{t.id}</td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', color: '#64748b' }}>No transactions found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
