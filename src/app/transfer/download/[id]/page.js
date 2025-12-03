import dbConnect from '@/lib/db';
import Transfer from '@/models/Transfer';
import styles from './page.module.css';
import { notFound } from 'next/navigation';

export default async function DownloadPage({ params }) {
    await dbConnect();
    const transfer = await Transfer.findById(params.id);

    if (!transfer || new Date() > new Date(transfer.expiresAt)) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.icon}>⚠️</div>
                    <h2>Link Expired</h2>
                    <p>This transfer link is no longer valid.</p>
                </div>
            </div>
        );
    }

    // Format Size
    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.icon}>📦</div>
                <h1 className={styles.title}>Ready to Download</h1>

                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', margin: '2rem 0', textAlign: 'left' }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Filename</span>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{transfer.filename}</div>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Size</span>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{formatSize(transfer.size)}</div>
                    </div>
                    {transfer.message && (
                        <div style={{ marginBottom: '0.5rem' }}>
                            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Message</span>
                            <div style={{ color: '#334155' }}>{transfer.message}</div>
                        </div>
                    )}
                    <div>
                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Expires On</span>
                        <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>
                            {new Date(transfer.expiresAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <a
                    href={`/api/transfer/download/${transfer._id}`}
                    className={styles.uploadBtn}
                    style={{ display: 'block', textDecoration: 'none', lineHeight: '1.5' }}
                >
                    Download File
                </a>
            </div>
        </div>
    );
}
