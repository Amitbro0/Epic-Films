'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaArrowLeft } from 'react-icons/fa';

export default function ServiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchService = async () => {
            try {
                const res = await fetch(`/api/services/${params.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setService(data);
                } else {
                    router.push('/404');
                }
            } catch (error) {
                console.error('Failed to fetch service', error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchService();
        }
    }, [params.id, router]);

    if (loading) {
        return (
            <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!service) return null;

    return (
        <div className={styles.container}>
            {/* Hero Section with Video Background */}
            <div className={styles.heroSection}>
                <div className={styles.videoBackground}>
                    {service.videoId ? (
                        <iframe
                            className={styles.bgVideoFrame}
                            src={`https://www.youtube.com/embed/${service.videoId}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&playlist=${service.videoId}`}
                            title={service.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    ) : (
                        service.imageUrl && (
                            <img
                                src={service.imageUrl}
                                alt={service.title}
                                className={styles.bgVideoFrame}
                                style={{ transform: 'scale(1)' }}
                            />
                        )
                    )}
                    <div className={styles.heroOverlay}></div>
                </div>

                <motion.div
                    className={styles.heroContent}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className={styles.title}>{service.title}</h1>
                    <p className={styles.subtitle}>{service.duration} • Starting at {service.priceStart}</p>
                </motion.div>
            </div>

            {/* Content Section */}
            <div className={styles.contentSection}>
                <div className={styles.mainContent}>
                    <Link href="/#services" className={styles.backLink}>
                        <FaArrowLeft /> Back to Services
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2>About This Service</h2>
                        <p className={styles.description}>{service.description}</p>

                        {service.deliverables && service.deliverables.length > 0 && (
                            <div className={styles.deliverablesSection}>
                                <h3>What's Included</h3>
                                <ul className={styles.deliverablesList}>
                                    {service.deliverables.map((item, index) => (
                                        <li key={index}>
                                            <FaCheckCircle className={styles.checkIcon} />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Sidebar Booking Card */}
                <div className={styles.sidebar}>
                    <motion.div
                        className={styles.bookingCard}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className={styles.priceLabel}>Starting Price</div>
                        <div className={styles.price}>{service.priceStart}</div>
                        <div className={styles.duration}>{service.duration}</div>

                        <Link
                            href={`/book?serviceId=${service._id}`}
                            className={styles.bookBtn}
                        >
                            Book Now
                        </Link>

                        <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
                            Secure your slot today. fast turnaround time.
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
