'use client';

import { useState } from 'react';
import styles from './page.module.css';
import { FaHeart, FaRegHeart, FaComment, FaCheck, FaImages, FaArrowLeft } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function SelectionPage() {
    const [weddingId, setWeddingId] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [projects, setProjects] = useState([]);
    const [currentProject, setCurrentProject] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'selected'
    const [loading, setLoading] = useState(false);
    const [activePhoto, setActivePhoto] = useState(null); // For fullscreen preview

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`/api/selection?weddingId=${weddingId.trim()}`);
            const data = await res.json();
            if (res.ok) {
                setProjects(data);
                setIsLoggedIn(true);
                if (data.length === 1) setCurrentProject(data[0]);
            } else {
                alert(data.message || 'Invalid Wedding ID');
            }
        } catch (err) {
            alert('Error logging in');
        } finally {
            setLoading(false);
        }
    };

    const toggleLike = async (photoId, e) => {
        if (e) e.stopPropagation();
        // Optimistic update
        const updatedPhotos = currentProject.photos.map(p => {
            if (p._id === photoId) return { ...p, selected: !p.selected };
            return p;
        });
        setCurrentProject({ ...currentProject, photos: updatedPhotos });

        // API Call
        await fetch(`/api/selection/${currentProject._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoId, action: 'toggle-like' })
        });
    };

    const handleComment = async (photoId, comment, e) => {
        if (e) e.stopPropagation();
        // Optimistic update
        const updatedPhotos = currentProject.photos.map(p => {
            if (p._id === photoId) return { ...p, comment };
            return p;
        });
        setCurrentProject({ ...currentProject, photos: updatedPhotos });

        // API Call
        await fetch(`/api/selection/${currentProject._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoId, action: 'comment', comment })
        });
    };

    const finishSelection = async () => {
        if (confirm('Are you ready to submit your selection? The studio will be notified.')) {
            await fetch(`/api/selection/${currentProject._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' })
            });
            alert('Selection confirmed! Thank you.');
        }
    };

    const getDirectImageUrl = (url) => {
        if (!url) return '';
        try {
            if (url.includes('drive.google.com')) {
                const idMatch = url.match(/[-\w]{25,}/);
                if (idMatch) {
                    return `https://drive.google.com/thumbnail?id=${idMatch[0]}&sz=w1200`;
                }
            }
            return url;
        } catch (e) {
            return url;
        }
    };

    if (!isLoggedIn) {
        return (
            <div className={styles.appContainer}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className={styles.loginCard}
                >
                    <div className={styles.loginIconContainer}>
                        <FaImages className={styles.loginIcon} />
                    </div>
                    <h2 className={styles.loginTitle}>Client Gallery</h2>
                    <p className={styles.loginSubtitle}>Access your premium photo collection</p>
                    <form onSubmit={handleLogin} className={styles.loginForm}>
                        <div className={styles.inputGroup}>
                            <input
                                type="text"
                                placeholder="Enter Access Code (e.g. WED-1234)"
                                value={weddingId}
                                onChange={(e) => setWeddingId(e.target.value)}
                                className={styles.modernInput}
                                required
                            />
                        </div>
                        <button type="submit" className={styles.primaryButton} disabled={loading}>
                            {loading ? <span className={styles.loader}></span> : 'View Collection'}
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    if (!currentProject) {
        return (
            <div className={styles.appContainer}>
                <div className={styles.topHeader}>
                    <h2>Your Events</h2>
                </div>
                <div className={styles.projectList}>
                    {projects.map((p, i) => (
                        <motion.div
                            key={p._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={styles.projectCard}
                            onClick={() => setCurrentProject(p)}
                        >
                            <div className={styles.projectCardContent}>
                                <h3>{p.title}</h3>
                                <div className={styles.projectMeta}>
                                    <span>{p.photos.length} Photos</span>
                                    <span>{p.photos.filter(ph => ph.selected).length} Selected</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    }

    const displayedPhotos = filter === 'selected'
        ? currentProject.photos.filter(p => p.selected)
        : currentProject.photos;

    const selectedCount = currentProject.photos.filter(p => p.selected).length;
    const progressPercentage = (selectedCount / currentProject.photos.length) * 100;

    return (
        <div className={styles.galleryContainer}>
            {/* Header / App Bar */}
            <motion.div
                className={styles.appHeader}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                <div className={styles.headerTop}>
                    {projects.length > 1 && (
                        <button className={styles.iconButton} onClick={() => setCurrentProject(null)}>
                            <FaArrowLeft />
                        </button>
                    )}
                    <h2 className={styles.headerTitle}>{currentProject.title}</h2>
                </div>

                <div className={styles.headerBottom}>
                    <div className={styles.tabsWrapper}>
                        <button
                            className={`${styles.tabBtn} ${filter === 'all' ? styles.activeTab : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </button>
                        <button
                            className={`${styles.tabBtn} ${filter === 'selected' ? styles.activeTab : ''}`}
                            onClick={() => setFilter('selected')}
                        >
                            Selected ({selectedCount})
                        </button>
                    </div>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>
            </motion.div>

            {/* Photo Grid */}
            <div className={styles.masonryGrid}>
                <AnimatePresence>
                    {displayedPhotos.map((photo, index) => (
                        <motion.div
                            layout
                            key={photo._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            className={`${styles.photoCard} ${photo.selected ? styles.selectedCard : ''}`}
                            onClick={() => setActivePhoto(photo)}
                        >
                            <img
                                src={getDirectImageUrl(photo.url)}
                                alt="Gallery Item"
                                className={styles.photoImg}
                                loading="lazy"
                                referrerPolicy="no-referrer"
                            />

                            <div className={styles.photoOverlay}>
                                <button
                                    className={`${styles.actionBtn} ${styles.likeBtn} ${photo.selected ? styles.liked : ''}`}
                                    onClick={(e) => toggleLike(photo._id, e)}
                                >
                                    {photo.selected ? <FaHeart /> : <FaRegHeart />}
                                </button>

                                <button
                                    className={`${styles.actionBtn} ${styles.commentBtn} ${photo.comment ? styles.hasComment : ''}`}
                                    onClick={(e) => {
                                        const c = prompt('Add note for editor:', photo.comment || '');
                                        if (c !== null) handleComment(photo._id, c, e);
                                    }}
                                >
                                    <FaComment />
                                    {photo.comment && <span className={styles.commentDot}></span>}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {displayedPhotos.length === 0 && (
                    <div className={styles.emptyState}>
                        <FaRegHeart className={styles.emptyIcon} />
                        <p>No photos found in this view.</p>
                    </div>
                )}
            </div>

            {/* Fullscreen Preview Modal */}
            <AnimatePresence>
                {activePhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={styles.fullscreenModal}
                        onClick={() => setActivePhoto(null)}
                    >
                        <button className={styles.closePreviewBtn}>&times;</button>
                        <img
                            src={getDirectImageUrl(activePhoto.url)}
                            alt="Preview"
                            className={styles.fullscreenImg}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <div className={styles.fullscreenControls} onClick={(e) => e.stopPropagation()}>
                            <button
                                className={`${styles.fullActionBtn} ${activePhoto.selected ? styles.likedText : ''}`}
                                onClick={() => toggleLike(activePhoto._id)}
                            >
                                {activePhoto.selected ? <FaHeart /> : <FaRegHeart />}
                                <span>{activePhoto.selected ? 'Selected' : 'Select'}</span>
                            </button>
                            <button
                                className={styles.fullActionBtn}
                                onClick={() => {
                                    const c = prompt('Add note:', activePhoto.comment || '');
                                    if (c !== null) handleComment(activePhoto._id, c);
                                }}
                            >
                                <FaComment />
                                <span>Note</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Button for Finish */}
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={styles.fab}
                onClick={finishSelection}
                title="Submit Selection"
            >
                <FaCheck />
                <span className={styles.fabText}>Finish</span>
            </motion.button>
        </div>
    );
}
