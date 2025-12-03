'use client';

import { useState } from 'react';
import styles from './page.module.css';
import { FaHeart, FaRegHeart, FaComment, FaCheck } from 'react-icons/fa';

export default function SelectionPage() {
    const [weddingId, setWeddingId] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [projects, setProjects] = useState([]);
    const [currentProject, setCurrentProject] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'selected'
    const [loading, setLoading] = useState(false);

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

    const toggleLike = async (photoId) => {
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

    const handleComment = async (photoId, comment) => {
        // Optimistic update
        const updatedPhotos = currentProject.photos.map(p => {
            if (p._id === photoId) return { ...p, comment };
            return p;
        });
        setCurrentProject({ ...currentProject, photos: updatedPhotos });

        // API Call (Debounce ideally, but simple for now)
        await fetch(`/api/selection/${currentProject._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoId, action: 'comment', comment })
        });
    };

    const finishSelection = async () => {
        if (confirm('Are you sure you want to mark selection as completed?')) {
            await fetch(`/api/selection/${currentProject._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' })
            });
            alert('Selection marked as completed! Admin will be notified.');
        }
    };

    if (!isLoggedIn) {
        return (
            <div className={styles.container}>
                <div className={styles.loginCard}>
                    <h2>Photo Selection Login</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Enter your Wedding ID to view your gallery.</p>
                    <form onSubmit={handleLogin}>
                        <input
                            type="text"
                            placeholder="Enter Wedding ID (e.g. WED-1234)"
                            value={weddingId}
                            onChange={(e) => setWeddingId(e.target.value)}
                            style={{ width: '100%', padding: '10px', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #333' }}
                            required
                        />
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Accessing...' : 'View Gallery'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (!currentProject) {
        return (
            <div className={styles.container}>
                <h2>Select a Project</h2>
                <div className={styles.grid}>
                    {projects.map(p => (
                        <div key={p._id} className={styles.loginCard} onClick={() => setCurrentProject(p)} style={{ cursor: 'pointer' }}>
                            <h3>{p.title}</h3>
                            <p>{p.photos.length} Photos</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const displayedPhotos = filter === 'selected'
        ? currentProject.photos.filter(p => p.selected)
        : currentProject.photos;

    const selectedCount = currentProject.photos.filter(p => p.selected).length;

    const getDirectImageUrl = (url) => {
        if (!url) return '';
        try {
            // Handle Google Drive links
            if (url.includes('drive.google.com')) {
                // Matches /d/ID, id=ID, file/d/ID
                const idMatch = url.match(/[-\w]{25,}/);
                if (idMatch) {
                    return `https://drive.google.com/thumbnail?id=${idMatch[0]}&sz=w1000`; // Use thumbnail API for better reliability
                }
            }
            return url;
        } catch (e) {
            return url;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h2 style={{ fontSize: '1.2rem' }}>{currentProject.title}</h2>
                    <div className={styles.stats}>
                        <span className={styles.statBadge}>{selectedCount} Selected</span>
                        <span className={styles.statBadge}>{currentProject.photos.length} Total</span>
                    </div>
                </div>
                <button className={styles.finishBtn} onClick={finishSelection}>
                    Finish <FaCheck />
                </button>
            </div>

            <div className={styles.filterBar}>
                <button
                    className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All Photos
                </button>
                <button
                    className={`${styles.filterBtn} ${filter === 'selected' ? styles.active : ''}`}
                    onClick={() => setFilter('selected')}
                >
                    Selected Only
                </button>
            </div>

            <div className={styles.grid}>
                {displayedPhotos.map(photo => (
                    <div key={photo._id} className={`${styles.photoCard} ${photo.selected ? styles.selected : ''}`}>
                        <img
                            src={getDirectImageUrl(photo.url)}
                            alt="Selection"
                            className={styles.photo}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/400x400?text=Image+Load+Error';
                            }}
                        />

                        <div className={styles.overlay}>
                            <button
                                className={`${styles.likeBtn} ${photo.selected ? styles.active : ''}`}
                                onClick={() => toggleLike(photo._id)}
                            >
                                {photo.selected ? <FaHeart /> : <FaRegHeart />}
                            </button>
                            <button className={styles.commentBtn} onClick={() => {
                                const c = prompt('Enter comment:', photo.comment);
                                if (c !== null) handleComment(photo._id, c);
                            }}>
                                <FaComment />
                            </button>
                        </div>
                        {photo.comment && (
                            <div style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                💬
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
