import dbConnect from '@/lib/db';
import Transfer from '@/models/Transfer';
import styles from './page.module.css';

export default async function DownloadPage({ params }) {
    await dbConnect();
    const transfer = await Transfer.findById(params.id);

    if (!transfer || new Date() > new Date(transfer.expiresAt)) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.icon}>⚠️</div>
                    <h2 className={styles.title} style={{ fontSize: '2rem' }}>Link Expired</h2>
                    <p style={{ color: '#94a3b8' }}>This transfer link is no longer valid.</p>
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

                <div className={styles.fileDetails}>
                    <div className={styles.detailRow}>
                        <span className={styles.label}>Filename</span>
                        <div className={styles.value}>{transfer.filename}</div>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.label}>Size</span>
                        <div className={styles.value}>{formatSize(transfer.size)}</div>
                    </div>
                    {transfer.message && (
                        <div className={styles.detailRow}>
                            <span className={styles.label}>Message</span>
                            <div className={styles.value} style={{ fontWeight: '400' }}>{transfer.message}</div>
                        </div>
                    )}
                    <div className={styles.detailRow}>
                        <span className={styles.label}>Expires On</span>
                        <div className={styles.value} style={{ color: '#ef4444' }}>
                            {new Date(transfer.expiresAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <a
                    href={`/api/transfer/download/${transfer._id}`}
                    className={styles.uploadBtn}
                >
                    Download File
                </a>
            </div>
        </div>
    );
}
