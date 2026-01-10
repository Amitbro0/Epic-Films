'use client';
import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';

export default function P2PReceiverPage({ params }) {
    const senderId = params.id;
    const [status, setStatus] = useState('Connecting to Sender...');
    const [connected, setConnected] = useState(false);
    const [fileInfo, setFileInfo] = useState(null);
    const [progress, setProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [transferComplete, setTransferComplete] = useState(false);
    const [completedFiles, setCompletedFiles] = useState([]);

    const peerRef = useRef(null);
    const connRef = useRef(null);
    const receivedChunks = useRef([]);
    const receivedSize = useRef(0);

    useEffect(() => {
        const initPeer = async () => {
            const { Peer } = await import('peerjs');
            const peer = new Peer();

            peer.on('open', () => {
                setStatus('Connecting...');
                const conn = peer.connect(senderId);
                connRef.current = conn;

                conn.on('open', () => {
                    setConnected(true);
                    setStatus('Connected! Waiting for files...');
                    setupConnection(conn);
                });

                conn.on('error', (err) => {
                    setStatus('Connection Error');
                    console.error(err);
                });
            });

            peerRef.current = peer;
        };

        initPeer();

        return () => {
            if (peerRef.current) peerRef.current.destroy();
        };
    }, [senderId]);

    const setupConnection = (conn) => {
        conn.on('data', (data) => {
            if (data.type === 'file-info') {
                setFileInfo(data);
                setStatus(`Ready to Download: ${data.name}`);
                // Auto-accept for smoother UX in multi-file, or ask user?
                // For now, let's ask user for the first file, then maybe auto?
                // User requested "ak baar me me jitna salect kar ke du sab bheje", so auto-accept after start is better.
                if (completedFiles.length > 0) {
                    startDownload(data);
                } else {
                    // Initialize buffer for first file too if waiting for user click
                    receivedChunks.current = new Uint8Array(data.size);
                    receivedSize.current = 0;
                }
            } else if (data.type === 'chunk') {
                handleChunk(data);
            } else if (data.type === 'file-complete') {
                finalizeDownload();
            } else if (data.type === 'transfer-complete') {
                setTransferComplete(true);
                setStatus('All Files Received!');
            }
        });
    };

    const startDownload = (info = fileInfo) => {
        if (!connRef.current || !info) return;

        // Re-initialize buffer if needed (e.g. for auto-download)
        if (receivedChunks.current.byteLength !== info.size) {
            receivedChunks.current = new Uint8Array(info.size);
            receivedSize.current = 0;
        }

        connRef.current.send({ type: 'accept', fileIndex: info.index });
        setIsDownloading(true);
        setStatus(`Downloading ${info.name}...`);
    };

    const handleChunk = (data) => {
        // data.data is an ArrayBuffer, data.offset is the position to write it
        const chunkBytes = new Uint8Array(data.data);

        // Ensure the buffer is initialized and large enough
        if (!receivedChunks.current || receivedChunks.current.length < data.offset + chunkBytes.length) {
            console.error("Buffer not initialized or too small for incoming chunk!");
            return;
        }

        // Write the chunk data into the pre-allocated buffer at the specified offset
        receivedChunks.current.set(chunkBytes, data.offset);

        // Track progress based on the latest byte received (assuming sequential)
        const currentBytes = data.offset + chunkBytes.length;
        const percent = Math.round((currentBytes / fileInfo.size) * 100);
        setProgress(percent);

        if (currentBytes >= fileInfo.size) {
            finalizeDownload();
        }
    };

    const finalizeDownload = () => {

        const blob = new Blob(receivedChunks.current);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileInfo.name;
        a.click();

        setCompletedFiles(prev => [...prev, fileInfo.name]);

        // Reset for next file
        receivedChunks.current = [];
        receivedSize.current = 0;
        setProgress(0);
        setFileInfo(null);
        setIsDownloading(false);

        // Request next file
        connRef.current.send({ type: 'next-file' });
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Secure P2P Transfer</h1>
                <p className={styles.status}>{status}</p>

                {fileInfo && !isDownloading && !transferComplete && (
                    <div style={{ margin: '2rem 0' }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>{fileInfo.name}</h3>
                        <p style={{ color: '#94a3b8' }}>{(fileInfo.size / (1024 * 1024)).toFixed(2)} MB</p>
                        <p style={{ fontSize: '0.9rem', color: '#64748b' }}>File {fileInfo.index + 1} of {fileInfo.totalFiles}</p>
                        <button className={styles.downloadBtn} onClick={() => startDownload()}>
                            Start Download ⬇️
                        </button>
                    </div>
                )}

                {/* Progress Popup */}
                {isDownloading && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modalContent}>
                            <div className={styles.loader}></div>
                            <div className={styles.progressText}>{progress}%</div>
                            <div className={styles.progressSub}>Downloading {fileInfo?.name}...</div>
                            <div style={{ marginTop: '1rem', width: '100%', background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px' }}>
                                <div style={{ width: `${progress}%`, background: 'var(--accent-color)', height: '100%', borderRadius: '3px', transition: 'width 0.2s' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                {transferComplete && (
                    <div style={{ marginTop: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <h2>All Files Received!</h2>
                        <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', margin: '1rem 0', maxHeight: '150px', overflowY: 'auto' }}>
                            {completedFiles.map((f, i) => (
                                <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 0' }}>{f}</div>
                            ))}
                        </div>
                        <button
                            className={styles.downloadBtn}
                            onClick={() => window.location.href = '/plik'}
                            style={{ marginTop: '2rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
                        >
                            Send Files
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
