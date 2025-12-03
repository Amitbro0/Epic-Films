'use client';
import Link from 'next/link';
import styles from './Navbar.module.css';
import { siteConfig } from '@/config/siteConfig';
import { useState, useEffect } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 50);
    });

    return (
        <motion.nav
            className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className={`container ${styles.navContainer}`}>
                <Link href="/" className={styles.logo}>
                    {siteConfig.studioName}
                </Link>
                <div className={styles.navLinks}>
                    <Link href="/#services">Services</Link>
                    <Link href="/selection">Photo Selection</Link>
                    <Link href="/#portfolio">Portfolio</Link>
                    <Link href="/#pricing">Pricing</Link>
                    <Link href="/plik">Transfer</Link>
                    <Link href="/status">Check Status</Link>
                    <Link href="/book" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Book Now</Link>
                </div>
            </div>
        </motion.nav>
    );
}
