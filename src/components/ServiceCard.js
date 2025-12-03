'use client';
import styles from './ServiceCard.module.css';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaVideo, FaCamera, FaFilm, FaPhotoVideo } from 'react-icons/fa';

const icons = {
    FaVideo, FaCamera, FaFilm, FaPhotoVideo
};

export default function ServiceCard({ service }) {
    const Icon = service.icon && icons[service.icon] ? icons[service.icon] : FaVideo;

    return (
        <Link href={service.link || `/services/${service._id || service.id}`} style={{ textDecoration: 'none', height: '100%', display: 'block' }}>
            <motion.div
                className={styles.card}
                whileHover={{ y: -10 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
            >
                <div className={styles.imageContainer}>
                    {service.videoId ? (
                        <iframe
                            className={styles.serviceVideo}
                            src={`https://www.youtube.com/embed/${service.videoId}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&playlist=${service.videoId}`}
                            title={service.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    ) : (
                        <>
                            {service.imageUrl && service.imageUrl.startsWith('http') ? (
                                <img
                                    src={service.imageUrl}
                                    alt={service.title}
                                    className={styles.serviceImage}
                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                                />
                            ) : null}
                            <div className={styles.placeholderImage} style={{ display: service.imageUrl && service.imageUrl.startsWith('http') ? 'none' : 'block' }}></div>
                        </>
                    )}
                    <div className={styles.overlay}>
                        <div className={styles.titleWrapper}>
                            <div className={styles.iconWrapper}>
                                <Icon className={styles.icon} />
                            </div>
                            <h3>{service.title}</h3>
                        </div>
                    </div>
                </div>

                <div className={styles.content}>
                    <p className={styles.description}>{service.description}</p>
                    {service.deliverables && service.deliverables.length > 0 && (
                        <ul className={styles.deliverables}>
                            {service.deliverables.map((item, index) => (
                                <li key={index}>• {item}</li>
                            ))}
                        </ul>
                    )}
                    <div className={styles.details}>
                        <span className={styles.duration}>{service.duration}</span>
                        <span className={styles.price}>{service.priceStart}</span>
                    </div>
                </div>
            </motion.div >
        </Link>
    );
}
