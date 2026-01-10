'use client';
import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';

export default function PlikPage() {
    // Mode State
    const [mode, setMode] = useState('server'); // 'server' | 'p2p'

    // Server State
    const [file, setFile] = useState(null); // Keep single file for server for now to avoid breaking it
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [downloadLink, setDownloadLink] = useState(null);
    const [error, setError] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    // P2P State
    const [role, setRole] = useState('sender'); // 'sender' | 'receiver'
    const [peerId, setPeerId] = useState(null);
    const [targetId, setTargetId] = useState(''); // Kept for receiver input
    const [p2pFiles, setP2pFiles] = useState([]); // Array of files
    const [currentFileIndex, setCurrentFileIndex] = useState(0);
    const [p2pStatus, setP2pStatus] = useState('');
    const [p2pProgress, setP2pProgress] = useState(0);

    const fileInputRef = useRef(null);
    const peerRef = useRef(null);
    const connRef = useRef(null);
    const receivedChunks = useRef([]);
    const receivedSize = useRef(0);
    const transferState = useRef({
        file: null,
        offset: 0,
        busy: false
    });
    const currentReceivingFile = useRef(null);

    // --- Common Handlers ---
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            if (mode === 'p2p') {
                setP2pFiles(Array.from(e.dataTransfer.files));
                resetP2PState();
            } else {
                setFile(e.dataTransfer.files[0]);
                resetServerState();
            }
        }
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            if (mode === 'p2p') {
                setP2pFiles(Array.from(e.target.files));
                resetP2PState();
            } else {
                setFile(e.target.files[0]);
                resetServerState();
            }
        }
    };

    const resetServerState = () => {
        setError(null);
        setDownloadLink(null);
        setProgress(0);
    };

    const resetP2PState = () => {
        setCurrentFileIndex(0);
        setP2pProgress(0);
        setP2pStatus('');
        receivedChunks.current = [];
        receivedSize.current = 0;
        currentReceivingFile.current = null;
        transferState.current = { file: null, offset: 0, busy: false };
    };

    // --- Server Logic ---
    const uploadToServer = async () => {
        if (!file) return;
        setUploading(true);
        setProgress(0);
        setError(null);

        const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        let fileId = null;

        try {
            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(file.size, start + CHUNK_SIZE);
                const chunk = file.slice(start, end);
                const formData = new FormData();
                formData.append('file', chunk);
                formData.append('chunkIndex', i);
                formData.append('totalChunks', totalChunks);
                formData.append('filename', file.name);
                formData.append('totalSize', file.size);
                if (fileId) formData.append('fileId', fileId);

                const res = await fetch('/api/transfer/upload', { method: 'POST', body: formData });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    console.error("Upload failed:", res.status, errData);
                    throw new Error(errData.error || `Upload failed with status ${res.status}`);
                }

                const data = await res.json();
                if (data.fileId) fileId = data.fileId;

                setProgress(Math.round(((i + 1) / totalChunks) * 100));

                if (data.completed) {
                    setDownloadLink(`${window.location.origin}${data.downloadLink}`);
                }
            }
        } catch (err) {
            console.error(err);
            setError(err.message || "Something went wrong during upload.");
        } finally {
            setUploading(false);
        }
    };

    // --- P2P Logic ---
    const initPeer = async () => {
        if (peerRef.current) return;

        setP2pStatus('Initializing Peer...');
        const { Peer } = await import('peerjs');
        const peer = new Peer();

        peer.on('open', (id) => {
            setPeerId(id);
            setP2pStatus('Ready to Connect');
        });

        peer.on('connection', (conn) => {
            connRef.current = conn;
            setP2pStatus('Connected to Peer!');
            setupConnection(conn);
        });

        peer.on('error', (err) => {
            setError('P2P Error: ' + err.type);
            setP2pStatus('Error');
        });

        peerRef.current = peer;
    };

    const setupConnection = (conn) => {
        conn.on('data', (data) => {
            if (data.type === 'file-info') {
                currentReceivingFile.current = {
                    name: data.name,
                    size: data.size,
                    index: data.index,
                    totalFiles: data.totalFiles
                };
                const confirm = window.confirm(`Receive file ${data.index + 1} of ${data.totalFiles}: ${data.name} (${(data.size / 1024 / 1024).toFixed(2)} MB)?`);
                if (confirm) {
                    conn.send({ type: 'accept', fileIndex: data.index });
                    setP2pStatus(`Receiving ${data.name}...`);
                    receivedChunks.current = [];
                    receivedSize.current = 0;
                } else {
                    conn.send({ type: 'reject', fileIndex: data.index });
                    setP2pStatus('File transfer rejected.');
                    currentReceivingFile.current = null;
                }
            } else if (data.type === 'accept') {
                // Receiver accepted file, start sending chunks
                const fileToSend = p2pFiles[data.fileIndex];
                if (fileToSend) {
                    startP2PSending(conn, fileToSend);
                }
            } else if (data.type === 'chunk-ack') {
                sendNextChunk(conn);
            } else if (data.type === 'chunk') {
                handleP2PChunk(data);
            } else if (data.type === 'file-complete') {
                // Sender finished sending a file, receiver should save it
                if (currentReceivingFile.current) {
                    const blob = new Blob(receivedChunks.current);
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = currentReceivingFile.current.name;
                    a.click();
                    URL.revokeObjectURL(url); // Clean up the URL

                    setP2pStatus(`Downloaded ${currentReceivingFile.current.name}!`);
                    receivedChunks.current = [];
                    receivedSize.current = 0;

                    // Check if there are more files to receive
                    if (currentReceivingFile.current.index + 1 < currentReceivingFile.current.totalFiles) {
                        conn.send({ type: 'next-file' }); // Request next file info
                    } else {
                        setP2pStatus('All files received!');
                        currentReceivingFile.current = null;
                    }
                }
            } else if (data.type === 'next-file') {
                // Receiver finished download, move to next
                const nextIndex = currentFileIndex + 1;
                if (nextIndex < p2pFiles.length) {
                    setCurrentFileIndex(nextIndex);
                    sendFileInfo(nextIndex);
                } else {
                    setP2pStatus('All Files Sent!');
                    conn.send({ type: 'transfer-complete' });
                }
            } else if (data.type === 'transfer-complete') {
                setP2pStatus('All files transferred successfully!');
            }
        });

        conn.on('close', () => {
            setP2pStatus('Connection Closed');
            connRef.current = null;
        });
    };

    const connectToPeer = () => {
        if (!targetId || !peerRef.current) return;
        setP2pStatus('Connecting...');
        const conn = peerRef.current.connect(targetId);
        connRef.current = conn;

        conn.on('open', () => {
            setP2pStatus('Connected!');
            setupConnection(conn);
        });
    };

    const startP2PSending = (conn, file) => {
        setP2pStatus(`Sending ${file.name}...`);

        const CHUNK_SIZE = 16 * 1024; // 16KB - Safe MTU
        // High watermark: 1MB. If buffer > 1MB, we pause.
        // Low watermark: 256KB. We resume when buffer < 256KB.
        const MAX_BUFFERED_AMOUNT = 1 * 1024 * 1024;

        let offset = 0;
        const reader = new FileReader();

        // We'll use a recursive function to drive the loop
        const sendLoop = () => {
            if (!connRef.current || !conn.open) return;

            if (conn.bufferedAmount > MAX_BUFFERED_AMOUNT) {
                // Buffer full, wait a bit and check again
                setTimeout(sendLoop, 50);
                return;
            }

            if (offset >= file.size) {
                conn.send({ type: 'file-complete' });
                return;
            }

            // Read and send next chunk
            const slice = file.slice(offset, offset + CHUNK_SIZE);
            reader.readAsArrayBuffer(slice);
        };

        reader.onload = (e) => {
            if (!connRef.current) return;

            try {
                conn.send({
                    type: 'chunk',
                    data: e.target.result,
                    offset: offset,
                    total: file.size
                });

                offset += e.target.result.byteLength;
                setP2pProgress(Math.round((offset / file.size) * 100));

                // Immediately try to send next chunk (the loop handles backpressure)
                sendLoop();
            } catch (err) {
                console.error("Send Error:", err);
                // If send fails (e.g. buffer full error), wait and retry
                setTimeout(sendLoop, 100);
            }
        };

        // Start the loop
        sendLoop();
    };

    const handleP2PChunk = (data) => {
        receivedChunks.current.push(data.data);
        receivedSize.current += data.data.byteLength;
        setP2pProgress(Math.round((receivedSize.current / data.total) * 100));
    };

    const sendFileInfo = (index = 0) => {
        if (!connRef.current || !p2pFiles[index]) return;

        const file = p2pFiles[index];
        setCurrentFileIndex(index);

        connRef.current.send({
            type: 'file-info',
            name: file.name,
            size: file.size,
            index: index,
            totalFiles: p2pFiles.length
        });
        setP2pStatus(`Waiting for acceptance for ${file.name}...`);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert("Copied!");
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Warp Speed Transfer</h1>
                <p className={styles.subtitle}>Secure. Fast. Limitless.</p>

                <div className={styles.toggleContainer}>
                    <button
                        className={`${styles.toggleBtn} ${mode === 'server' ? styles.active : ''}`}
                        onClick={() => setMode('server')}
                    >
                        ☁️ Server Upload
                    </button>
                    <button
                        className={`${styles.toggleBtn} ${mode === 'p2p' ? styles.active : ''}`}
                        onClick={() => { setMode('p2p'); initPeer(); }}
                    >
                        ⚡ P2P Direct
                    </button>
                </div>

                {mode === 'server' ? (
                    // --- SERVER UI ---
                    !downloadLink ? (
                        <>
                            <div
                                className={`${styles.dropzone} ${dragActive ? styles.dragActive : ''}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleChange}
                                    style={{ display: 'none' }}
                                />
                                <div className={styles.icon}>🚀</div>
                                {file ? (
                                    <div className={styles.fileInfo}>
                                        <div className={styles.fileName}>{file.name}</div>
                                        <div className={styles.fileSize}>{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                                    </div>
                                ) : (
                                    <p>Drag & Drop or Click to Upload</p>
                                )}
                            </div>

                            {uploading && (
                                <div className={styles.progressContainer}>
                                    <div className={styles.progressBar} style={{ width: `${progress}%` }}></div>
                                    <div className={styles.progressText}>
                                        <span>Uploading...</span>
                                        <span>{progress}%</span>
                                    </div>
                                </div>
                            )}

                            <button
                                className={styles.uploadBtn}
                                onClick={uploadToServer}
                                disabled={!file || uploading}
                            >
                                {uploading ? 'Transmitting...' : 'Initiate Transfer'}
                            </button>

                            {error && <div className={styles.error}>{error}</div>}
                        </>
                    ) : (
                        <div className={styles.success}>
                            <div className={styles.icon}>✨</div>
                            <h3>Transfer Complete!</h3>
                            <p>Your file is ready to share.</p>

                            <div className={styles.linkBox}>
                                <input type="text" value={downloadLink} readOnly className={styles.linkInput} />
                                <button onClick={() => copyToClipboard(downloadLink)} className={styles.copyBtn}>Copy</button>
                            </div>

                            <button
                                className={styles.uploadBtn}
                                onClick={() => {
                                    setFile(null);
                                    setDownloadLink(null);
                                    setProgress(0);
                                }}
                                style={{ marginTop: '2rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
                            >
                                Send Another File
                            </button>
                        </div>
                    )
                ) : (
                    // --- P2P UI ---
                    <div className={styles.p2pContainer}>
                        {!peerId ? (
                            <div style={{ color: '#fff' }}>Initializing P2P Network...</div>
                        ) : (
                            <>
                                <div className={styles.tabs}>
                                    <button
                                        className={`${styles.tabBtn} ${role === 'sender' ? styles.activeTab : ''}`}
                                        onClick={() => setRole('sender')}
                                    >
                                        Send File
                                    </button>
                                    <button
                                        className={`${styles.tabBtn} ${role === 'receiver' ? styles.activeTab : ''}`}
                                        onClick={() => setRole('receiver')}
                                    >
                                        Receive File
                                    </button>
                                </div>

                                {role === 'sender' && (
                                    <>
                                        <div className={styles.idBox}>
                                            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Share this Link to Receive Files</p>
                                            <div className={styles.code} style={{ fontSize: '1rem', overflowWrap: 'break-word' }}>
                                                {`${typeof window !== 'undefined' ? window.location.origin : ''}/transfer/p2p/${peerId}`}
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(`${window.location.origin}/transfer/p2p/${peerId}`)}
                                                className={styles.copyBtn}
                                                style={{ width: '100%' }}
                                            >
                                                Copy Link
                                            </button>
                                        </div>

                                        <div
                                            className={`${styles.dropzone} ${dragActive ? styles.dragActive : ''}`}
                                            onDragEnter={handleDrag}
                                            onDragLeave={handleDrag}
                                            onDragOver={handleDrag}
                                            onDrop={handleDrop}
                                            onClick={() => fileInputRef.current.click()}
                                            style={{ padding: '2rem 1rem' }}
                                        >
                                            <input
                                                type="file"
                                                multiple
                                                ref={fileInputRef}
                                                onChange={handleChange}
                                                style={{ display: 'none' }}
                                            />
                                            {p2pFiles.length > 0 ? (
                                                <div className={styles.fileInfo}>
                                                    <div className={styles.fileName}>{p2pFiles.length} Files Selected</div>
                                                    <div className={styles.fileSize}>
                                                        {p2pFiles.map(f => f.name).join(', ').slice(0, 50)}...
                                                    </div>
                                                </div>
                                            ) : (
                                                <p>Select Multiple Files to Send</p>
                                            )}
                                        </div>

                                        {p2pStatus && <div style={{ marginTop: '1rem', color: 'var(--accent-color)' }}>{p2pStatus}</div>}

                                        {p2pProgress > 0 && (
                                            <div className={styles.progressContainer}>
                                                <div className={styles.progressBar} style={{ width: `${p2pProgress}%` }}></div>
                                                <div className={styles.progressText}>
                                                    <span>Sending File {currentFileIndex + 1}/{p2pFiles.length}</span>
                                                    <span>{p2pProgress}%</span>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            className={styles.uploadBtn}
                                            onClick={() => sendFileInfo(0)}
                                            disabled={p2pFiles.length === 0 || !connRef.current}
                                            style={{ marginTop: '1rem' }}
                                        >
                                            {connRef.current ? 'Send Files' : 'Waiting for Receiver...'}
                                        </button>
                                        {!connRef.current && <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>Share the link. Transfer starts when receiver connects.</p>}
                                    </>
                                )}

                                {role === 'receiver' && (
                                    <>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            placeholder="Enter Sender's ID"
                                            value={targetId}
                                            onChange={(e) => setTargetId(e.target.value)}
                                        />
                                        <button
                                            className={styles.uploadBtn}
                                            onClick={connectToPeer}
                                            disabled={!targetId}
                                        >
                                            Connect to Sender
                                        </button>

                                        {p2pStatus && <div style={{ marginTop: '1rem', color: 'var(--accent-color)' }}>{p2pStatus}</div>}

                                        {p2pProgress > 0 && currentReceivingFile.current && (
                                            <div className={styles.progressContainer}>
                                                <div className={styles.progressBar} style={{ width: `${p2pProgress}%` }}></div>
                                                <div className={styles.progressText}>
                                                    <span>Receiving File {currentReceivingFile.current.index + 1}/{currentReceivingFile.current.totalFiles}</span>
                                                    <span>{p2pProgress}%</span>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
