'use client';
import Hero from '@/components/Hero';
import ServiceCard from '@/components/ServiceCard';
import PricingSection from '@/components/PricingSection';
import { siteConfig } from '@/config/siteConfig';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { motion } from 'framer-motion';

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2
        }
    }
};

export default function Home() {
    const [portfolioItems, setPortfolioItems] = useState(siteConfig.portfolio);
    const [services, setServices] = useState(siteConfig.services);
    const [config, setConfig] = useState(siteConfig);
    const [playingVideo, setPlayingVideo] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Portfolio
                const portRes = await fetch('/api/portfolio');
                if (portRes.ok) {
                    const portData = await portRes.json();
                    if (portData.length > 0) setPortfolioItems(portData);
                }

                // Fetch Services
                const servRes = await fetch('/api/services');
                if (servRes.ok) {
                    const servData = await servRes.json();
                    if (servData.length > 0) setServices(servData);
                }

                // Fetch Site Config
                const configRes = await fetch('/api/site-config');
                if (configRes.ok) {
                    const configData = await configRes.json();
                    setConfig(prev => ({ ...prev, ...configData }));
                }
            } catch (error) {
                console.error('Failed to fetch data', error);
            }
        };
        fetchData();
    }, []);

    return (
        <>
            <Hero config={config} />

            {/* Features Section */}
            <section className={styles.featuresSection}>
                <div className="container">
                    <motion.h2
                        className="section-title"
                        {...fadeInUp}
                    >
                        Why Choose Us?
                    </motion.h2>
                    <motion.div
                        className={styles.featuresGrid}
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                    >
                        {config.features.map((feature, index) => (
                            <motion.div
                                key={index}
                                className={styles.featureCard}
                                variants={fadeInUp}
                            >
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className={styles.servicesSection}>
                {/* Video Background */}
                <div className={styles.videoBackground}>
                    <iframe
                        src="https://www.youtube.com/embed/fjsrcmwVfFU?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&playlist=fjsrcmwVfFU&start=10"
                        title="Background Video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className={styles.bgVideoFrame}
                    ></iframe>
                    <div className={styles.videoOverlay}></div>
                </div>

                <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                    <motion.div {...fadeInUp} className="text-center mb-4">
                        <h2 className={styles.servicesTitle}>OUR SERVICES</h2>
                        <p className={styles.servicesSubtitle}>Professional editing for every occasion.</p>
                    </motion.div>
                    <div className={styles.servicesGrid}>
                        {/* Photo Selection Service Card */}
                        <ServiceCard service={{
                            id: 'photo-selection',
                            title: 'Photo Selection',
                            description: 'Select your favorite photos from your event. Login with your Wedding ID.',
                            imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop',
                            icon: 'FaPhotoVideo',
                            link: '/selection',
                            priceStart: 'Free for Clients',
                            duration: 'Instant Access'
                        }} />

                        {services.map((service) => (
                            <ServiceCard key={service._id || service.id} service={service} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Portfolio Section */}
            <section id="portfolio" className={styles.portfolioSection}>
                <div className="container">
                    <motion.div {...fadeInUp} className="text-center mb-4">
                        <h2 className="section-title">Portfolio</h2>
                        <p className="section-subtitle">Check out our latest work.</p>
                    </motion.div>
                    <div className={styles.portfolioGrid}>
                        {portfolioItems.map((item) => (
                            <motion.div
                                key={item._id || item.id}
                                className={styles.portfolioItem}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                whileHover={{ y: -10 }}
                            >
                                <div className={styles.thumbnailWrapper}>
                                    {playingVideo === (item._id || item.id) ? (
                                        <iframe
                                            src={`https://www.youtube.com/embed/${item.videoId}?autoplay=1`}
                                            title={item.title}
                                            className={styles.videoFrame}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    ) : (
                                        <>
                                            <img
                                                src={item.thumbnail || `https://img.youtube.com/vi/${item.videoId}/maxresdefault.jpg`}
                                                alt={item.title}
                                                className={styles.thumbnail}
                                            />
                                            <div className={styles.playOverlay}>
                                                <button
                                                    className={styles.playButton}
                                                    onClick={() => setPlayingVideo(item._id || item.id)}
                                                    aria-label="Play Video"
                                                >
                                                    ▶
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <h3>{item.title}</h3>
                            </motion.div>
                        ))}
                    </div>
                    <div className="text-center mt-4">
                        <a href={config.channelUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                            Visit Channel (Pixamit)
                        </a>
                    </div>
                </div>
            </section >

            <PricingSection config={config} />

            {/* CTA Section */}
            <section className={styles.ctaSection}>
                <motion.div
                    className="container text-center"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <h2>Ready to get started?</h2>
                    <p>Book your editing slot today and let us create magic.</p>
                    <Link href="/book" className="btn btn-primary mt-4">Book Now</Link>
                </motion.div>
            </section>
        </>
    );
}
