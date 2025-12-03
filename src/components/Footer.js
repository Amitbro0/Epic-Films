import styles from './Footer.module.css';
import { siteConfig } from '@/config/siteConfig';
import Link from 'next/link';
import { FaInstagram, FaYoutube, FaWhatsapp } from 'react-icons/fa';
import dbConnect from '@/lib/db';
import SiteConfig from '@/models/SiteConfig';

export default async function Footer() {
    let config = siteConfig;
    try {
        await dbConnect();
        const dbConfig = await SiteConfig.findOne();
        if (dbConfig) {
            config = { ...siteConfig, ...dbConfig.toObject() };
        }
    } catch (e) {
        console.error('Footer config fetch error:', e);
    }

    return (
        <footer className={styles.footer}>
            <div className={`container ${styles.container}`}>
                <div className={styles.column}>
                    <h3>{config.studioName}</h3>
                    <p>{config.hero.subheadline}</p>
                </div>
                <div className={styles.column}>
                    <h4>Quick Links</h4>
                    <Link href="/#services">Services</Link>
                    <Link href="/#portfolio">Portfolio</Link>
                    <Link href="/book">Book Now</Link>
                </div>
                <div className={styles.column}>
                    <h4>Contact</h4>
                    <p>{config.location}</p>
                    <p>{config.contact.phone}</p>
                    <p>{config.contact.email}</p>
                </div>
                <div className={styles.column}>
                    <h4>Follow Us</h4>
                    <div className={styles.socials}>
                        <a href="#" className={styles.socialIcon}><FaInstagram /></a>
                        <a href="#" className={styles.socialIcon}><FaYoutube /></a>
                        <a href="#" className={styles.socialIcon}><FaWhatsapp /></a>
                    </div>
                </div>
            </div>
            <div className={styles.copyright}>
                <p>&copy; {new Date().getFullYear()} {config.studioName}. All rights reserved.</p>
            </div>
        </footer>
    );
}
