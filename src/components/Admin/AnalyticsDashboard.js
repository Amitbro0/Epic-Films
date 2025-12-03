'use client';
import { useState, useEffect } from 'react';
import styles from '@/app/admin/dashboard/page.module.css';

export default function AnalyticsDashboard() {
    const [stats, setStats] = useState(null);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, configRes] = await Promise.all([
                fetch('/api/analytics/stats'),
                fetch('/api/site-config')
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (configRes.ok) setConfig(await configRes.json());
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/site-config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            if (res.ok) alert('Analytics settings updated!');
            else alert('Failed to update settings.');
        } catch (e) {
            console.error(e);
            alert('Error saving settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading Analytics...</div>;

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2>Analytics Overview (Last 30 Days)</h2>
                <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={fetchData}
                >
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <h3>Total Page Views</h3>
                    <p>{stats?.totalViews?.toLocaleString() || 0}</p>
                </div>
                <div className={styles.statCard}>
                    <h3>Unique Visitors</h3>
                    <p>{stats?.uniqueVisitors?.toLocaleString() || 0}</p>
                </div>
                <div className={styles.statCard}>
                    <h3>Avg. Views/Visitor</h3>
                    <p>{stats?.uniqueVisitors ? (stats.totalViews / stats.uniqueVisitors).toFixed(1) : 0}</p>
                </div>
            </div>

            <div className={styles.formGrid} style={{ marginTop: '2rem' }}>

                {/* Top Pages */}
                <div className={styles.card}>
                    <h3>Top Pages</h3>
                    <table className={styles.table} style={{ marginTop: '1rem' }}>
                        <thead>
                            <tr>
                                <th>Page Path</th>
                                <th>Views</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.topPages?.map((p, i) => (
                                <tr key={i}>
                                    <td>{p._id}</td>
                                    <td>{p.count}</td>
                                </tr>
                            ))}
                            {(!stats?.topPages || stats.topPages.length === 0) && (
                                <tr><td colSpan="2">No data yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Traffic Sources */}
                <div className={styles.card}>
                    <h3>Traffic Sources</h3>
                    <table className={styles.table} style={{ marginTop: '1rem' }}>
                        <thead>
                            <tr>
                                <th>Source</th>
                                <th>Visits</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.topSources?.map((s, i) => (
                                <tr key={i}>
                                    <td>{s._id}</td>
                                    <td>{s.count}</td>
                                </tr>
                            ))}
                            {(!stats?.topSources || stats.topSources.length === 0) && (
                                <tr><td colSpan="2">No data yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Device Breakdown */}
                <div className={styles.card}>
                    <h3>Device Breakdown</h3>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        {stats?.deviceStats?.map((d, i) => (
                            <div key={i} style={{
                                padding: '1rem',
                                background: '#f8fafc',
                                borderRadius: '8px',
                                flex: 1,
                                textAlign: 'center'
                            }}>
                                <strong>{d._id}</strong>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                    {d.count}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* External Analytics Settings */}
                <div className={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>External Tracking Settings</h3>
                        <button
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            onClick={handleSaveConfig}
                            disabled={saving}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        >
                            {saving ? 'Saving...' : 'Save IDs'}
                        </button>
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Google Analytics Measurement ID</label>
                        <input
                            type="text"
                            placeholder="G-XXXXXXXXXX"
                            value={config?.analytics?.googleAnalyticsId || ''}
                            onChange={(e) => setConfig(prev => ({
                                ...prev,
                                analytics: { ...prev.analytics, googleAnalyticsId: e.target.value }
                            }))}
                        />
                        <small>Create a property in Google Analytics 4 to get this ID.</small>
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Microsoft Clarity Project ID</label>
                        <input
                            type="text"
                            placeholder="e.g. jx9..."
                            value={config?.analytics?.clarityId || ''}
                            onChange={(e) => setConfig(prev => ({
                                ...prev,
                                analytics: { ...prev.analytics, clarityId: e.target.value }
                            }))}
                        />
                        <small>Required for Heatmaps & Recordings. Sign up at clarity.microsoft.com.</small>
                    </div>
                </div>

            </div>
        </div>
    );
}
