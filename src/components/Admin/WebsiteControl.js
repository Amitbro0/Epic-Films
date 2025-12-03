'use client';
import { useState, useEffect } from 'react';
import styles from '@/app/admin/dashboard/page.module.css'; // Reuse dashboard styles

export default function WebsiteControl() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/site-config');
            const data = await res.json();
            setConfig(data);
        } catch (error) {
            console.error('Failed to fetch config', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/site-config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            if (res.ok) {
                alert('Website configuration updated successfully!');
            } else {
                alert('Failed to update configuration.');
            }
        } catch (error) {
            console.error('Failed to save config', error);
            alert('Error saving configuration.');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (section, field, value) => {
        setConfig(prev => {
            if (section) {
                return {
                    ...prev,
                    [section]: {
                        ...prev[section],
                        [field]: value
                    }
                };
            } else {
                return {
                    ...prev,
                    [field]: value
                };
            }
        });
    };

    const handleFeatureChange = (index, field, value) => {
        const newFeatures = [...config.features];
        newFeatures[index][field] = value;
        setConfig(prev => ({ ...prev, features: newFeatures }));
    };

    if (loading) return <div>Loading configuration...</div>;
    if (!config) return <div>Error loading configuration.</div>;

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2>Website Control</h2>
                <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className={styles.formGrid}>
                {/* General Info */}
                <div className={styles.card}>
                    <h3>General Information</h3>
                    <div className={styles.inputGroup}>
                        <label>Studio Name</label>
                        <input
                            type="text"
                            value={config.studioName}
                            onChange={(e) => handleChange(null, 'studioName', e.target.value)}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Owner Name</label>
                        <input
                            type="text"
                            value={config.ownerName}
                            onChange={(e) => handleChange(null, 'ownerName', e.target.value)}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Location</label>
                        <input
                            type="text"
                            value={config.location}
                            onChange={(e) => handleChange(null, 'location', e.target.value)}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>YouTube Channel URL</label>
                        <input
                            type="text"
                            value={config.channelUrl}
                            onChange={(e) => handleChange(null, 'channelUrl', e.target.value)}
                        />
                    </div>
                </div>

                {/* Contact Info */}
                <div className={styles.card}>
                    <h3>Contact Details</h3>
                    <div className={styles.inputGroup}>
                        <label>Phone</label>
                        <input
                            type="text"
                            value={config.contact?.phone || ''}
                            onChange={(e) => handleChange('contact', 'phone', e.target.value)}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Email</label>
                        <input
                            type="text"
                            value={config.contact?.email || ''}
                            onChange={(e) => handleChange('contact', 'email', e.target.value)}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>UPI ID (for payments)</label>
                        <input
                            type="text"
                            value={config.contact?.upiId || ''}
                            onChange={(e) => handleChange('contact', 'upiId', e.target.value)}
                        />
                    </div>
                </div>

                {/* Hero Section */}
                <div className={styles.card}>
                    <h3>Hero Section</h3>
                    <div className={styles.inputGroup}>
                        <label>Headline</label>
                        <input
                            type="text"
                            value={config.hero?.headline || ''}
                            onChange={(e) => handleChange('hero', 'headline', e.target.value)}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Subheadline</label>
                        <textarea
                            value={config.hero?.subheadline || ''}
                            onChange={(e) => handleChange('hero', 'subheadline', e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                {/* File Transfer Settings */}
                <div className={styles.card}>
                    <h3>File Transfer Settings</h3>
                    <div className={styles.inputGroup}>
                        <label>Max File Size (GB)</label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={config.transferConfig?.maxSizeGB || 2}
                            onChange={(e) => handleChange('transferConfig', 'maxSizeGB', Number(e.target.value))}
                        />
                        <small>Recommended: 2-5 GB to prevent server crash.</small>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Expiry Days</label>
                        <input
                            type="number"
                            min="1"
                            max="30"
                            value={config.transferConfig?.expiryDays || 7}
                            onChange={(e) => handleChange('transferConfig', 'expiryDays', Number(e.target.value))}
                        />
                        <small>Files are auto-deleted after this many days.</small>
                    </div>
                    <div className={styles.inputGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="checkbox"
                            checked={config.transferConfig?.enableServerUpload || false}
                            onChange={(e) => handleChange('transferConfig', 'enableServerUpload', e.target.checked)}
                            style={{ width: 'auto' }}
                        />
                        <label style={{ margin: 0 }}>Enable Server Upload (Backup Mode)</label>
                    </div>
                    <small style={{ display: 'block', marginTop: '5px', color: '#64748b' }}>
                        If unchecked, only P2P Transfer will be visible to users.
                    </small>
                </div>

                {/* Features */}
                <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
                    <h3>Features</h3>
                    <div className={styles.featuresGrid}>
                        {config.features?.map((feature, index) => (
                            <div key={index} className={styles.featureItem}>
                                <div className={styles.inputGroup}>
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        value={feature.title}
                                        onChange={(e) => handleFeatureChange(index, 'title', e.target.value)}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Description</label>
                                    <textarea
                                        value={feature.description}
                                        onChange={(e) => handleFeatureChange(index, 'description', e.target.value)}
                                        rows={2}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
