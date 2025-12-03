'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { siteConfig } from '@/config/siteConfig';
import styles from './page.module.css';

function BookingForm() {
    const searchParams = useSearchParams();
    const preSelectedServiceId = searchParams.get('serviceId');

    const [services, setServices] = useState(siteConfig.services);
    const [config, setConfig] = useState(siteConfig);
    const [formData, setFormData] = useState({
        clientName: '',
        phone: '',
        email: '',
        eventType: 'wedding',
        serviceType: preSelectedServiceId || siteConfig.services[0].id,
        message: '',
        driveLink: '',
    });
    const [loading, setLoading] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [dbOrderId, setDbOrderId] = useState(null); // The actual DB ID
    const [error, setError] = useState(null);
    const [step, setStep] = useState(1); // 1: Form, 2: Payment Choice, 3: Success
    const [showManualPayment, setShowManualPayment] = useState(false);
    const [transactionId, setTransactionId] = useState('');

    useEffect(() => {
        // Fetch dynamic data
        const fetchData = async () => {
            try {
                const [servRes, configRes] = await Promise.all([
                    fetch('/api/services'),
                    fetch('/api/site-config')
                ]);
                if (servRes.ok) {
                    const sData = await servRes.json();
                    if (sData.length > 0) setServices(sData);
                }
                if (configRes.ok) {
                    const cData = await configRes.json();
                    setConfig(prev => ({
                        ...prev,
                        ...cData,
                        paymentConfig: {
                            ...prev.paymentConfig,
                            ...(cData.paymentConfig || {}),
                            manualPayment: {
                                ...(prev.paymentConfig?.manualPayment || {}),
                                ...(cData.paymentConfig?.manualPayment || {})
                            }
                        }
                    }));
                }
            } catch (e) { console.error(e); }
        };
        fetchData();
    }, []);

    // Load Razorpay Script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setStep(2); // Move to payment choice
    };

    const handleManualSubmit = async () => {
        if (!transactionId) {
            alert('Please enter the Transaction ID / UTR Number.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    paymentStatus: 'verification_pending', // Special status
                    amountTotal: Number(services.find(s => s.id === formData.serviceType)?.priceStart.replace(/[^0-9]/g, '')) || 0,
                    transactions: [{
                        id: transactionId,
                        amount: 0, // Admin will verify
                        date: new Date(),
                        status: 'pending',
                        method: 'manual_upi'
                    }]
                })
            });
            if (res.ok) {
                setStep(3);
            } else {
                alert('Booking failed. Please try again.');
            }
        } catch (e) {
            console.error(e);
            alert('An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async (isAdvance) => {
        setLoading(true);
        setError(null);

        try {
            if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
                alert("Online payment is not configured. Please use 'Pay Later' or contact admin.");
                setLoading(false);
                return;
            }

            const selectedService = services.find(s => s.id === formData.serviceType) || services[0];
            // Parse price string to number (remove non-numeric chars)
            const price = Number(selectedService.priceStart.replace(/[^0-9]/g, '')) || 0;

            // 1. Create Order in Razorpay
            const res = await fetch('/api/payment/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: price,
                    serviceDetails: { ...formData, price }, // Pass details to calculate advance
                    isAdvance
                })
            });
            const orderData = await res.json();

            if (!res.ok) throw new Error(orderData.message);

            // 2. Open Razorpay
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // We need to expose this env var
                amount: orderData.amount,
                currency: orderData.currency,
                name: config.studioName,
                description: `Payment for ${selectedService.title}`,
                order_id: orderData.id,
                handler: async function (response) {
                    // 3. Verify Payment & Create Order in DB
                    const verifyRes = await fetch('/api/payment/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            bookingDetails: {
                                ...formData,
                                amountTotal: price,
                                amountPaid: 0 // Will be updated by backend
                            },
                            amountPaid: orderData.amountToPay
                        })
                    });

                    const verifyData = await verifyRes.json();
                    if (verifyRes.ok) {
                        setDbOrderId(verifyData.orderId); // Use the DB ID for reference if needed, but we usually show a friendly ID
                        // We need to fetch the created order to get the friendly 'orderId' (e.g. ORD-...) if we generated one, 
                        // or just use the DB ID. The previous logic returned a custom ID. 
                        // Let's assume the backend 'verify' returns the DB _id. 
                        // If we want the friendly ID, we should return it from backend.
                        // For now, let's just show success.
                        setStep(3);
                    } else {
                        alert('Payment Verification Failed: ' + verifyData.message);
                    }
                },
                prefill: {
                    name: formData.clientName,
                    email: formData.email,
                    contact: formData.phone
                },
                theme: {
                    color: "#3b82f6"
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.open();

        } catch (err) {
            console.error(err);
            setError('Payment initiation failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (step === 3) {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <h1 className="section-title">Booking Confirmed!</h1>
                <div className={styles.successCard}>
                    <p>Thank you, <strong>{formData.clientName}</strong>!</p>
                    <p>Your booking has been placed successfully.</p>
                    <p>We have received your payment.</p>
                    <p>You can check your status anytime using your phone number.</p>

                    <a
                        href={`https://wa.me/919939064764?text=Hello, I just placed an order!%0AName: ${formData.clientName}%0APlease confirm.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.whatsappBtn}
                    >
                        Send Confirmation via WhatsApp
                    </a>
                </div>
            </div>
        );
    }

    const handleManualBooking = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    paymentStatus: 'pending',
                    amountTotal: Number(services.find(s => s.id === formData.serviceType)?.priceStart.replace(/[^0-9]/g, '')) || 0
                })
            });
            if (res.ok) {
                setStep(3);
            } else {
                alert('Booking failed. Please try again.');
            }
        } catch (e) {
            console.error(e);
            alert('An error occurred.');
        } finally {
            setLoading(false);
        }
    };



    if (step === 2) {
        const selectedService = services.find(s => s.id === formData.serviceType) || services[0];
        const price = Number(selectedService.priceStart.replace(/[^0-9]/g, '')) || 0;
        const manualConfig = config.paymentConfig?.manualPayment || {};

        // Hardcoded fallback to ensure it works
        const finalUpiId = manualConfig.upiId || config.contact?.upiId || "9939064764@ibl";
        const finalQrCode = (manualConfig.qrCode && !manualConfig.qrCode.includes('drive.google.com'))
            ? manualConfig.qrCode
            : "/qr-code.png";
        const finalInstructions = manualConfig.instructions || "Scan the QR code or use the UPI ID to pay. Enter the Transaction ID below.";

        const getDirectImageLink = (url) => {
            if (!url) return '';
            if (url.includes('drive.google.com')) {
                const idMatch = url.match(/\/d\/(.+?)(\/|$|\?)/);
                if (idMatch && idMatch[1]) {
                    return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
                }
            }
            return url;
        };

        return (
            <div className="container" style={{ padding: '4rem 0', maxWidth: '600px' }}>
                <h1 className="section-title">Scan & Pay</h1>
                <div className={styles.formContainer} style={{ textAlign: 'center' }}>
                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>{selectedService.title}</h3>
                        <p className="mb-4" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Total Amount: ₹{price}</p>

                        {finalQrCode && (
                            <>
                                <img
                                    src={getDirectImageLink(finalQrCode)}
                                    alt="Payment QR"
                                    style={{ maxWidth: '200px', borderRadius: '8px', marginBottom: '1rem', display: 'block', margin: '0 auto 1rem auto' }}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </>
                        )}
                        <p style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem', color: '#0f172a' }}>
                            {finalUpiId}
                        </p>
                        <p style={{ color: '#64748b' }}>{finalInstructions}</p>
                    </div>

                    <div className={styles.formGroup} style={{ textAlign: 'left' }}>
                        <label>Enter Transaction ID / UTR Number</label>
                        <input
                            type="text"
                            placeholder="e.g. 1234567890"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </div>

                    <button
                        className={styles.paymentBtn}
                        style={{ background: '#22c55e', marginTop: '1rem' }}
                        onClick={handleManualSubmit}
                        disabled={loading}
                    >
                        <div className={styles.btnContent} style={{ justifyContent: 'center' }}>
                            <span>Confirm Payment</span>
                        </div>
                    </button>

                    <button
                        className={styles.textBtn}
                        onClick={() => setStep(1)}
                        style={{ marginTop: '2rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                    >
                        &larr; Back to Details
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <h1 className="section-title">Book Your Edit</h1>
            <div className={styles.formContainer}>
                <form onSubmit={handleFormSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Name</label>
                        <input type="text" name="clientName" required onChange={handleChange} value={formData.clientName} />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Phone Number</label>
                        <input type="tel" name="phone" required onChange={handleChange} value={formData.phone} />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Email (Optional)</label>
                        <input type="email" name="email" onChange={handleChange} value={formData.email} />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Event Type</label>
                        <select name="eventType" onChange={handleChange} value={formData.eventType}>
                            <option value="wedding">Wedding</option>
                            <option value="engagement">Engagement</option>
                            <option value="pre-wedding">Pre-Wedding</option>
                            <option value="birthday">Birthday</option>
                            <option value="corporate">Corporate</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Service Required</label>
                        <select name="serviceType" value={formData.serviceType} onChange={handleChange}>
                            {services.map(s => (
                                <option key={s.id} value={s.id}>{s.title} ({s.priceStart})</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Google Drive Link (Footage)</label>
                        <input type="url" name="driveLink" placeholder="https://drive.google.com/..." onChange={handleChange} value={formData.driveLink} />
                        <small style={{ color: '#94a3b8' }}>Make sure the link is accessible to anyone with the link.</small>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Special Notes / Message</label>
                        <textarea name="message" rows="4" onChange={handleChange} value={formData.message}></textarea>
                    </div>

                    <button type="submit" className="btn btn-primary">
                        Proceed to Payment
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function BookingPage() {
    return (
        <Suspense fallback={<div className="container text-center mt-4">Loading booking form...</div>}>
            <BookingForm />
        </Suspense>
    );
}
