'use client';
import Link from 'next/link';
import styles from './Hero.module.css';
import { siteConfig } from '@/config/siteConfig';
import { motion } from 'framer-motion';

export default function Hero({ config }) {
    const heroConfig = config?.hero || siteConfig.hero;

    return (
        <section className={styles.hero}>
            <div className={styles.overlay}></div>
            <div className={styles.backgroundImage} style={{ backgroundImage: `url('/images/hero_background.jpg')` }}></div>

            <div className={`container ${styles.content}`}>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className={styles.headline}
                >
                    {heroConfig.headline}
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={styles.subheadline}
                >
                    {heroConfig.subheadline}
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className={styles.ctaGroup}
                >
                    <Link href="#portfolio" className="btn btn-primary">View Portfolio</Link>
                    <Link href="/book" className="btn btn-outline">Book Editing Now</Link>
                </motion.div>
            </div>
        </section>
    );
}
