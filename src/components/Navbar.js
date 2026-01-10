'use client';
import Link from 'next/link';
import styles from './Navbar.module.css';
import { siteConfig } from '@/config/siteConfig';
import { useState, useEffect } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
            <div className={`container ${styles.navContainer}`}>
                <Link href="/" className={styles.logo}>
                    Epic Films
                </Link>

                <div className={styles.hamburger} onClick={toggleMobileMenu}>
                    <span className={styles.bar}></span>
                    <span className={styles.bar}></span>
                    <span className={styles.bar}></span>
                </div>

                <div className={`${styles.navLinks} ${isMobileMenuOpen ? styles.active : ''}`}>
                    <Link href="#services" onClick={() => setIsMobileMenuOpen(false)}>Services</Link>
                    <Link href="#portfolio" onClick={() => setIsMobileMenuOpen(false)}>Portfolio</Link>
                    <Link href="/plik" onClick={() => setIsMobileMenuOpen(false)}>Transfer</Link>
                    <Link href="/status" onClick={() => setIsMobileMenuOpen(false)}>Track Order</Link>
                    <Link href="#contact" className="btn btn-primary" onClick={() => setIsMobileMenuOpen(false)}>Book Now</Link>
                </div>
            </div>
        </nav>
    );
}
