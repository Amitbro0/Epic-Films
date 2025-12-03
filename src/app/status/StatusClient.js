'use client';

import { useState, useEffect } from 'react';
import { siteConfig } from '@/config/siteConfig';
import styles from './page.module.css';
import { FaDownload, FaFileInvoice } from 'react-icons/fa';

export default function StatusPage() {
    const [phone, setPhone] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'ledger'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [config, setConfig] = useState(siteConfig);

    // Load Razorpay Script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        // Fetch config
        fetch('/api/site-config').then(res => res.json()).then(data => {
            if (data) setConfig(prev => ({ ...prev, ...data }));
        });
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/status?phone=${phone}`);
            const data = await res.json();

            if (res.ok) {
                setOrders(data);
                setIsLoggedIn(true);
            } else {
                setError(data.message || 'No orders found for this number.');
            }
        } catch (err) {
            setError('Failed to fetch data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePayBalance = async (order) => {
        const amountDue = (order.amountTotal || 0) - (order.amountPaid || 0);
        if (amountDue <= 0) return;

        try {
            // 1. Create Order
            const res = await fetch('/api/payment/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: amountDue,
                    orderId: order._id
                })
            });
            const orderData = await res.json();
            if (!res.ok) throw new Error(orderData.message);

            // 2. Open Razorpay
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: config.studioName,
                description: `Balance Payment for Order #${order._id.toString().slice(-6)}`,
                order_id: orderData.id,
                handler: async function (response) {
                    // 3. Verify
                    const verifyRes = await fetch('/api/payment/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderId: order._id,
                            amountPaid: orderData.amountToPay
                        })
                    });
                    if (verifyRes.ok) {
                        alert('Payment Successful!');
                        // Refresh Data
                        handleLogin({ preventDefault: () => { } });
                    } else {
                        alert('Payment Verification Failed');
                    }
                },
                prefill: {
                    name: order.clientName,
                    contact: order.phone
                },
                theme: { color: "#3b82f6" }
            };
            const rzp1 = new window.Razorpay(options);
            rzp1.open();
        } catch (e) {
            console.error(e);
            alert('Payment failed to start.');
        }
    };

    const generateInvoice = async (order) => {
        const { jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text(config.studioName, 14, 22);
        doc.setFontSize(10);
        doc.text(config.location || 'Location', 14, 28);
        doc.text(`Phone: ${config.contact.phone}`, 14, 33);

        doc.setFontSize(16);
        doc.text('INVOICE', 160, 22);
        doc.setFontSize(10);
        doc.text(`Invoice #: ${order.invoiceNumber || 'N/A'}`, 160, 28);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 160, 33);

        // Bill To
        doc.text('Bill To:', 14, 45);
        doc.setFontSize(12);
        doc.text(order.clientName, 14, 50);
        doc.setFontSize(10);
        doc.text(order.phone, 14, 55);

        // Items
        const serviceName = siteConfig.services.find(s => s.id === order.serviceType)?.title || order.serviceType;
        const taxRate = config.paymentConfig?.taxRate || 0;
        const taxAmount = (order.amountTotal * taxRate) / 100;
        const totalWithTax = order.amountTotal + taxAmount;

        autoTable(doc, {
            startY: 65,
            head: [['Description', 'Amount']],
            body: [
                [serviceName, `Rs. ${order.amountTotal}`],
                taxRate > 0 ? [`Tax (${taxRate}%)`, `Rs. ${taxAmount}`] : null,
            ].filter(Boolean),
            foot: [
                ['Total', `Rs. ${totalWithTax}`],
                ['Paid', `Rs. ${order.amountPaid}`],
                ['Balance Due', `Rs. ${Math.max(0, totalWithTax - order.amountPaid)}`]
            ]
        });

        // Footer
        const finalY = doc.lastAutoTable.finalY || 150;
        doc.text(config.paymentConfig?.invoiceNote || 'Thank you for your business!', 14, finalY + 20);
        doc.text('Authorized Signature', 160, finalY + 20);
        doc.text(config.ownerName, 160, finalY + 30);

        doc.save(`Invoice_${order._id}.pdf`);
    };

    const calculateLedger = () => {
        let totalPaid = 0;
        let totalPending = 0;
        orders.forEach(o => {
            totalPaid += o.amountPaid || 0;
            totalPending += (o.amountTotal || 0) - (o.amountPaid || 0);
        });
        return { totalPaid, totalPending };
    };

    const ledger = calculateLedger();

    if (!isLoggedIn) {
        return (
            <div className={styles.container}>
                <h1 className="section-title">Track Your Order</h1>
                <div className={styles.loginCard}>
                    <h2>Client Login</h2>
                    <p style={{ marginBottom: '1.5rem', color: '#94a3b8' }}>Enter your mobile number to view your dashboard.</p>
                    <form onSubmit={handleLogin}>
                        <div className={styles.inputGroup}>
                            <input
                                type="tel"
                                placeholder="Mobile Number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                        {error && <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</div>}
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Accessing...' : 'View Dashboard'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={`${styles.printArea} print-only`}>
                <div className={styles.dashboardHeader}>
                    <div className={styles.clientInfo}>
                        <h2>{orders[0]?.clientName}</h2>
                        <p>{phone}</p>
                    </div>
                    <button className={styles.downloadBtn} onClick={() => window.print()}>
                        <FaDownload /> Download Report
                    </button>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'orders' ? styles.active : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        Order List
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'ledger' ? styles.active : ''}`}
                        onClick={() => setActiveTab('ledger')}
                    >
                        Khata / Ledger
                    </button>
                </div>

                <div className={styles.listContainer}>
                    {activeTab === 'orders' && (
                        <>
                            {orders.map(order => (
                                <div key={order._id} className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <h3>{siteConfig.services.find(s => s.id === order.serviceType)?.title || order.serviceType}</h3>
                                        <div className={styles.cardSub}>
                                            Order ID: {order._id.toString().slice(-6).toUpperCase()} • {new Date(order.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className={styles.statusBadge} style={{
                                        backgroundColor: siteConfig.statusColors[order.status]?.bg || '#333',
                                        color: siteConfig.statusColors[order.status]?.color || '#fff'
                                    }}>
                                        {siteConfig.statusColors[order.status]?.label || order.status}
                                    </div>

                                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <button
                                            className={styles.actionBtn}
                                            onClick={() => generateInvoice(order)}
                                        >
                                            <FaFileInvoice /> Invoice
                                        </button>
                                        {((order.amountTotal || 0) - (order.amountPaid || 0)) > 0 && (
                                            <button
                                                className={styles.actionBtn}
                                                style={{ background: '#3b82f6', color: 'white' }}
                                                onClick={() => handlePayBalance(order)}
                                            >
                                                Pay Balance (₹{(order.amountTotal || 0) - (order.amountPaid || 0)})
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {activeTab === 'ledger' && (
                        <>
                            <div className={styles.card} style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: '#22c55e' }}>
                                <h3>Total Paid</h3>
                                <div className={`${styles.amount} ${styles.paid}`}>₹{ledger.totalPaid}</div>
                            </div>
                            <div className={styles.card} style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }}>
                                <h3>Total Pending</h3>
                                <div className={`${styles.amount} ${styles.pending}`}>₹{ledger.totalPending}</div>
                            </div>

                            <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Transaction History</h3>
                            {orders.map(order => {
                                const pending = (order.amountTotal || 0) - (order.amountPaid || 0);
                                return (
                                    <div key={order._id} className={styles.card}>
                                        <div>
                                            <h3>{siteConfig.services.find(s => s.id === order.serviceType)?.title || order.serviceType}</h3>
                                            <div className={styles.cardSub}>
                                                Total: ₹{order.amountTotal || 0}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div className={styles.paid} style={{ fontSize: '0.9rem' }}>
                                                Paid: ₹{order.amountPaid || 0}
                                            </div>
                                            {pending > 0 ? (
                                                <div className={styles.pending} style={{ fontWeight: 'bold' }}>
                                                    Pending: ₹{pending}
                                                </div>
                                            ) : (
                                                <div className={styles.paid} style={{ fontWeight: 'bold' }}>
                                                    Fully Paid
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>

                {/* Digital Signature Footer for Print */}
                <div className={styles.signature} style={{ display: 'none' }}>
                    <p>Authorized Signature</p>
                    <p style={{ fontFamily: 'cursive', fontSize: '2rem', marginTop: '0.5rem' }}>{siteConfig.ownerName}</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{siteConfig.studioName}</p>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    .${styles.signature} {
                        display: block !important;
                        margin-top: 3rem;
                        padding-top: 1rem;
                        border-top: 1px solid #ddd;
                    }
                }
            `}</style>
        </div>
    );
}
