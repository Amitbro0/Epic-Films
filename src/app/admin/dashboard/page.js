'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { siteConfig } from '@/config/siteConfig';
import styles from './page.module.css';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableServiceItem } from '@/components/Admin/SortableServiceItem';
import WebsiteControlComponent from '@/components/Admin/WebsiteControl';
import AnalyticsDashboard from '@/components/Admin/AnalyticsDashboard';
import PaymentDashboard from '@/components/Admin/PaymentDashboard';

// ... (existing imports)

// ... inside component ...


export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [orders, setOrders] = useState([]);
    const [downloadJob, setDownloadJob] = useState(null); // { id, progress, status, total, current }
    const [portfolioItems, setPortfolioItems] = useState([]);
    const [services, setServices] = useState([]);
    const [selectionProjects, setSelectionProjects] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [editingService, setEditingService] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event) {
        const { active, over } = event;

        if (active.id !== over.id) {
            setServices((items) => {
                const oldIndex = items.findIndex((item) => item._id === active.id);
                const newIndex = items.findIndex((item) => item._id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Call API to save order
                fetch('/api/services/reorder', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderedIds: newItems.map(i => i._id) })
                });

                return newItems;
            });
        }
    }

    useEffect(() => {
        fetchOrders();
        fetchPortfolio();
        fetchServices();
        fetchSelectionProjects();
    }, []);

    const fetchServices = async () => {
        try {
            const res = await fetch('/api/services');
            const data = await res.json();
            setServices(data);
        } catch (error) {
            console.error('Failed to fetch services', error);
        }
    };

    const fetchPortfolio = async () => {
        try {
            const res = await fetch('/api/portfolio');
            const data = await res.json();
            setPortfolioItems(data);
        } catch (error) {
            console.error('Failed to fetch portfolio', error);
        }
    };

    const fetchSelectionProjects = async () => {
        try {
            const res = await fetch('/api/selection');
            const data = await res.json();
            setSelectionProjects(data);
        } catch (error) {
            console.error('Failed to fetch selection projects', error);
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/admin/orders');
            if (res.status === 401) {
                router.push('/admin/login');
                return;
            }
            const data = await res.json();
            setOrders(data);
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`/api/orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                fetchOrders(); // Refresh
            }
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    const updatePayment = async (id, amountPaid) => {
        try {
            const res = await fetch(`/api/orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amountPaid }),
            });
            if (res.ok) {
                fetchOrders(); // Refresh
            }
        } catch (error) {
            console.error('Failed to update payment', error);
        }
    };

    // Poll for download status
    useEffect(() => {
        let interval;
        if (downloadJob && downloadJob.status !== 'completed' && downloadJob.status !== 'error') {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/selection/download/status?jobId=${downloadJob.id}`);
                    if (res.ok) {
                        const status = await res.json();
                        setDownloadJob(prev => ({ ...prev, ...status }));

                        if (status.status === 'completed') {
                            clearInterval(interval);
                            // Trigger download
                            window.location.href = `/api/selection/download/serve?jobId=${downloadJob.id}`;
                            setTimeout(() => setDownloadJob(null), 2000); // Close modal after delay
                        } else if (status.status === 'error') {
                            clearInterval(interval);
                            alert('Download Error: ' + status.message);
                            setDownloadJob(null);
                        }
                    }
                } catch (e) {
                    console.error(e);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [downloadJob]);

    const startDownload = async (projectId, type) => {
        try {
            setDownloadJob({ id: null, progress: 0, status: 'starting', total: 0, current: 0 });
            const res = await fetch('/api/selection/download/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, type })
            });
            const data = await res.json();
            if (res.ok) {
                setDownloadJob({ id: data.jobId, progress: 0, status: 'starting', total: 0, current: 0 });
            } else {
                alert('Failed to start: ' + data.message);
                setDownloadJob(null);
            }
        } catch (e) {
            alert('Error starting download');
            setDownloadJob(null);
        }
    };

    if (loading) return <div className="container text-center mt-4">Loading...</div>;

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        completed: orders.filter(o => o.status === 'completed').length,
        revenue: orders.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0),
    };

    return (
        <div className={styles.dashboard}>
            {/* Download Progress Modal */}
            {downloadJob && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '400px', textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '1rem', color: '#333' }}>
                            {downloadJob.status === 'completed' ? 'Download Ready!' : 'Preparing ZIP...'}
                        </h3>

                        <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden', marginBottom: '1rem' }}>
                            <div style={{
                                width: `${downloadJob.progress}%`,
                                height: '100%',
                                background: '#3b82f6',
                                transition: 'width 0.3s ease'
                            }}></div>
                        </div>

                        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                            {downloadJob.status === 'processing'
                                ? `Processing photo ${downloadJob.current} of ${downloadJob.total} (${downloadJob.progress}%)`
                                : downloadJob.status === 'starting' ? 'Initializing...' : 'Finalizing...'}
                        </p>
                    </div>
                </div>
            )}
            {/* Sidebar */}
            <div className={styles.sidebar}>
                <h2>Epic Admin</h2>
                <div
                    className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.active : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    Dashboard
                </div>
                <div
                    className={`${styles.navItem} ${activeTab === 'services' ? styles.active : ''}`}
                    onClick={() => setActiveTab('services')}
                >
                    Services
                </div>
                <div
                    className={`${styles.navItem} ${activeTab === 'portfolio' ? styles.active : ''}`}
                    onClick={() => setActiveTab('portfolio')}
                >
                    Portfolio
                </div>
                <div
                    className={`${styles.navItem} ${activeTab === 'selection' ? styles.active : ''}`}
                    onClick={() => setActiveTab('selection')}
                >
                    Photo Selection
                </div>
                <div
                    className={`${styles.navItem} ${activeTab === 'analytics' ? styles.active : ''}`}
                    onClick={() => setActiveTab('analytics')}
                >
                    Analytics
                </div>
                <div
                    className={`${styles.navItem} ${activeTab === 'website' ? styles.active : ''}`}
                    onClick={() => setActiveTab('website')}
                >
                    Website Control
                </div>
                <div
                    className={`${styles.navItem} ${activeTab === 'payments' ? styles.active : ''}`}
                    onClick={() => setActiveTab('payments')}
                >
                    Payments
                </div>
                <div style={{ marginTop: 'auto' }}>
                    <button onClick={() => router.push('/')} className={`${styles.btn} ${styles.btnOutline}`} style={{ width: '100%', color: '#fff', borderColor: '#475569' }}>
                        View Site
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className={styles.mainContent}>
                <div className={styles.header}>
                    <h1>Dashboard Overview</h1>
                    <div className={styles.userProfile}>
                        <span>Admin</span>
                    </div>
                </div>

                {activeTab === 'dashboard' && (
                    <>
                        {/* Stats Cards */}
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <h3>Total Orders</h3>
                                <p>{stats.total}</p>
                            </div>
                            <div className={styles.statCard}>
                                <h3>Pending</h3>
                                <p>{stats.pending}</p>
                            </div>
                            <div className={styles.statCard}>
                                <h3>Completed</h3>
                                <p>{stats.completed}</p>
                            </div>
                            <div className={styles.statCard}>
                                <h3>Revenue</h3>
                                <p>₹{stats.revenue.toLocaleString()}</p>
                            </div>
                        </div>



                        <div className={styles.sectionHeader} style={{ marginTop: '4rem' }}>
                            <h2>Recent Orders</h2>
                        </div>

                        {/* Orders Table */}
                        <div className={styles.tableCard}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Client</th>
                                        <th>Service</th>
                                        <th>Status</th>
                                        <th>Payment</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order._id}>
                                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <div className={styles.clientInfo}>
                                                    <strong>{order.clientName}</strong>
                                                    <span>{order.phone}</span>
                                                </div>
                                            </td>
                                            <td>{siteConfig.services.find(s => s.id === order.serviceType)?.title || order.serviceType}</td>
                                            <td>
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => updateStatus(order._id, e.target.value)}
                                                    className={styles.statusSelect}
                                                    style={{
                                                        backgroundColor: siteConfig.statusColors[order.status]?.bg,
                                                        color: siteConfig.statusColors[order.status]?.color
                                                    }}
                                                >
                                                    {Object.keys(siteConfig.statusColors).map(key => (
                                                        <option key={key} value={key}>{siteConfig.statusColors[key].label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <div className={styles.paymentControl}>
                                                    <span>₹{order.amountPaid}</span>
                                                    <button
                                                        className={styles.smallBtn}
                                                        style={{ background: '#e2e8f0', color: '#334155' }}
                                                        onClick={() => {
                                                            const amount = prompt('Enter new total amount paid:', order.amountPaid);
                                                            if (amount !== null) updatePayment(order._id, Number(amount));
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            </td>
                                            <td>
                                                <a href={order.driveLink} target="_blank" rel="noopener noreferrer" className={styles.linkBtn}>Drive Link</a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
                {activeTab === 'services' && (
                    <>
                        {/* Services Management Section */}
                        <div className={styles.sectionHeader}>
                            <h2>Services Management</h2>
                            {services.length === 0 && (
                                <button
                                    className={`${styles.btn} ${styles.btnOutline}`}
                                    onClick={async () => {
                                        if (!confirm('Import default services from config?')) return;
                                        await fetch('/api/services/seed', { method: 'POST' });
                                        fetchServices();
                                    }}
                                >
                                    Import Default Services
                                </button>
                            )}
                        </div>

                        <div className={styles.managementGrid}>
                            <div className={styles.formCard}>
                                <h3>{editingService ? 'Edit Service' : 'Add New Service'}</h3>
                                <div className={styles.inputGroup}>
                                    <label>Service Title</label>
                                    <input
                                        type="text"
                                        id="svcTitle"
                                        defaultValue={editingService ? editingService.title : ''}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Description</label>
                                    <textarea
                                        id="svcDesc"
                                        rows="3"
                                        defaultValue={editingService ? editingService.description : ''}
                                    ></textarea>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Duration</label>
                                    <input
                                        type="text"
                                        id="svcDuration"
                                        defaultValue={editingService ? editingService.duration : ''}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Starting Price</label>
                                    <input
                                        type="text"
                                        id="svcPrice"
                                        defaultValue={editingService ? editingService.priceStart : ''}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Image URL</label>
                                    <input
                                        type="text"
                                        id="svcImage"
                                        defaultValue={editingService ? editingService.imageUrl : ''}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Background Video ID (YouTube)</label>
                                    <input
                                        type="text"
                                        id="svcVideoId"
                                        placeholder="e.g. ScMzIvxBSi4"
                                        defaultValue={editingService ? editingService.videoId : ''}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Deliverables (comma separated)</label>
                                    <textarea
                                        id="svcDeliverables"
                                        rows="2"
                                        defaultValue={editingService ? (editingService.deliverables || []).join(', ') : ''}
                                    ></textarea>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        className={`${styles.btn} ${styles.btnPrimary}`}
                                        style={{ flex: 1 }}
                                        onClick={async () => {
                                            const title = document.getElementById('svcTitle').value;
                                            const description = document.getElementById('svcDesc').value;
                                            const duration = document.getElementById('svcDuration').value;
                                            const priceStart = document.getElementById('svcPrice').value;
                                            const imageUrl = document.getElementById('svcImage').value;
                                            const videoId = document.getElementById('svcVideoId').value;
                                            const deliverablesStr = document.getElementById('svcDeliverables').value;

                                            if (!title || !description) return alert('Title and Description are required');

                                            const deliverables = deliverablesStr ? deliverablesStr.split(',').map(s => s.trim()) : [];

                                            // Helper to extract YouTube ID
                                            const extractVideoId = (url) => {
                                                if (!url) return '';
                                                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                                                const match = url.match(regExp);
                                                return (match && match[2].length === 11) ? match[2] : url;
                                            };

                                            const cleanVideoId = extractVideoId(videoId);
                                            const body = { title, description, duration, priceStart, imageUrl, videoId: cleanVideoId, deliverables };

                                            try {
                                                let res;
                                                if (editingService) {
                                                    res = await fetch(`/api/services/${editingService._id}`, {
                                                        method: 'PUT',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify(body)
                                                    });
                                                } else {
                                                    res = await fetch('/api/services', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify(body)
                                                    });
                                                }

                                                if (res.ok) {
                                                    setEditingService(null);
                                                    document.getElementById('svcTitle').value = '';
                                                    document.getElementById('svcDesc').value = '';
                                                    document.getElementById('svcDuration').value = '';
                                                    document.getElementById('svcPrice').value = '';
                                                    document.getElementById('svcImage').value = '';
                                                    document.getElementById('svcVideoId').value = '';
                                                    document.getElementById('svcDeliverables').value = '';
                                                    fetchServices();
                                                }
                                            } catch (e) { console.error(e); }
                                        }}
                                    >
                                        {editingService ? 'Update' : 'Add'}
                                    </button>
                                    {editingService && (
                                        <button
                                            className={`${styles.btn} ${styles.btnOutline}`}
                                            onClick={() => {
                                                setEditingService(null);
                                                document.getElementById('svcTitle').value = '';
                                                document.getElementById('svcDesc').value = '';
                                                document.getElementById('svcDuration').value = '';
                                                document.getElementById('svcPrice').value = '';
                                                document.getElementById('svcImage').value = '';
                                                document.getElementById('svcVideoId').value = '';
                                                document.getElementById('svcDeliverables').value = '';
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className={styles.listGrid}>
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={services.map(s => s._id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {services.map(service => (
                                            <SortableServiceItem
                                                key={service._id}
                                                service={service}
                                                onEdit={async (s, isToggle = false) => {
                                                    if (isToggle) {
                                                        try {
                                                            await fetch(`/api/services/${s._id}`, {
                                                                method: 'PUT',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ isVisible: s.isVisible })
                                                            });
                                                            fetchServices();
                                                        } catch (e) { console.error(e); }
                                                    } else {
                                                        setEditingService(s);
                                                        document.getElementById('svcTitle').value = s.title;
                                                        document.getElementById('svcDesc').value = s.description;
                                                        document.getElementById('svcDuration').value = s.duration || '';
                                                        document.getElementById('svcPrice').value = s.priceStart || '';
                                                        document.getElementById('svcImage').value = s.imageUrl || '';
                                                        document.getElementById('svcVideoId').value = s.videoId || '';
                                                        document.getElementById('svcDeliverables').value = (s.deliverables || []).join(', ');
                                                    }
                                                }}
                                                onDelete={async (s) => {
                                                    if (!confirm('Delete this service?')) return;
                                                    await fetch(`/api/services/${s._id}`, { method: 'DELETE' });
                                                    fetchServices();
                                                }}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            </div>
                        </div>

                    </>
                )}
                {activeTab === 'portfolio' && (
                    <>
                        {/* Portfolio Management Section */}
                        <div className={styles.sectionHeader}>
                            <h2>Portfolio Management</h2>
                            {portfolioItems.length === 0 && (
                                <button
                                    className={`${styles.btn} ${styles.btnOutline}`}
                                    onClick={async () => {
                                        if (!confirm('Import default videos from config?')) return;
                                        await fetch('/api/portfolio/seed', { method: 'POST' });
                                        fetchPortfolio();
                                    }}
                                >
                                    Import Default Videos
                                </button>
                            )}
                        </div>

                        <div className={styles.managementGrid}>
                            <div className={styles.formCard}>
                                <h3>{editingItem ? 'Edit Video' : 'Add New Video'}</h3>
                                <div className={styles.inputGroup}>
                                    <label>Video Title</label>
                                    <input
                                        type="text"
                                        id="newTitle"
                                        defaultValue={editingItem ? editingItem.title : ''}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>YouTube Video ID</label>
                                    <input
                                        type="text"
                                        id="newVideoId"
                                        defaultValue={editingItem ? editingItem.videoId : ''}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        className={`${styles.btn} ${styles.btnPrimary}`}
                                        style={{ flex: 1 }}
                                        onClick={async () => {
                                            const title = document.getElementById('newTitle').value;
                                            const videoIdInput = document.getElementById('newVideoId').value;
                                            if (!title || !videoIdInput) return alert('Please fill both fields');

                                            // Helper to extract YouTube ID
                                            const extractVideoId = (url) => {
                                                if (!url) return '';
                                                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                                                const match = url.match(regExp);
                                                return (match && match[2].length === 11) ? match[2] : url;
                                            };

                                            const videoId = extractVideoId(videoIdInput);

                                            try {
                                                let res;
                                                if (editingItem) {
                                                    res = await fetch(`/api/portfolio/${editingItem._id}`, {
                                                        method: 'PUT',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ title, videoId })
                                                    });
                                                } else {
                                                    res = await fetch('/api/portfolio', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ title, videoId })
                                                    });
                                                }

                                                if (res.ok) {
                                                    document.getElementById('newTitle').value = '';
                                                    document.getElementById('newVideoId').value = '';
                                                    setEditingItem(null);
                                                    fetchPortfolio();
                                                }
                                            } catch (e) { console.error(e); }
                                        }}
                                    >
                                        {editingItem ? 'Update' : 'Add'}
                                    </button>
                                    {editingItem && (
                                        <button
                                            className={`${styles.btn} ${styles.btnOutline}`}
                                            onClick={() => {
                                                setEditingItem(null);
                                                document.getElementById('newTitle').value = '';
                                                document.getElementById('newVideoId').value = '';
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className={styles.listGrid}>
                                {portfolioItems.map(item => (
                                    <div key={item._id} className={styles.itemCard}>
                                        <img
                                            src={`https://img.youtube.com/vi/${item.videoId}/default.jpg`}
                                            alt={item.title}
                                            className={styles.itemImage}
                                        />
                                        <div className={styles.itemContent}>
                                            <h4>{item.title}</h4>
                                            <p className={styles.itemMeta}>{item.videoId}</p>
                                        </div>
                                        <div className={styles.itemActions}>
                                            <button
                                                className={`${styles.actionBtn} ${styles.editBtn}`}
                                                onClick={() => {
                                                    setEditingItem(item);
                                                    document.getElementById('newTitle').value = item.title;
                                                    document.getElementById('newVideoId').value = item.videoId;
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${styles.toggleBtn}`}
                                                style={{ backgroundColor: item.isVisible !== false ? '#fef08a' : '#e2e8f0', color: item.isVisible !== false ? '#854d0e' : '#475569' }}
                                                onClick={async () => {
                                                    try {
                                                        await fetch(`/api/portfolio/${item._id}`, {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ isVisible: item.isVisible === false })
                                                        });
                                                        fetchPortfolio();
                                                    } catch (e) { console.error(e); }
                                                }}
                                            >
                                                {item.isVisible !== false ? 'Hide' : 'Show'}
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                onClick={async () => {
                                                    if (!confirm('Delete this video?')) return;
                                                    await fetch(`/api/portfolio/${item._id}`, { method: 'DELETE' });
                                                    fetchPortfolio();
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </>
                )}
                {activeTab === 'selection' && (
                    <>
                        {/* Photo Selection Management Section */}
                        <div className={styles.sectionHeader} style={{ marginTop: '4rem' }}>
                            <h2>Photo Selection Management</h2>
                        </div>

                        <div className={styles.managementGrid}>
                            <div className={styles.formCard}>
                                <h3>Create New Project</h3>
                                <div className={styles.inputGroup}>
                                    <label>Client Name</label>
                                    <input type="text" id="selClient" placeholder="e.g. Amit Kumar" />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Phone Number</label>
                                    <input type="text" id="selPhone" placeholder="e.g. 9999999999" />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Project Title</label>
                                    <input type="text" id="selTitle" placeholder="e.g. Amit weds Riya" />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Photo URLs (One per line) OR Google Drive Folder Link</label>
                                    <textarea id="selPhotos" rows="5" placeholder="Paste a Google Drive Folder Link (e.g. https://drive.google.com/drive/folders/...) OR direct image links"></textarea>
                                </div>
                                <button
                                    className={`${styles.btn} ${styles.btnPrimary}`}
                                    style={{ width: '100%' }}
                                    onClick={async () => {
                                        const clientName = document.getElementById('selClient').value;
                                        const phone = document.getElementById('selPhone').value;
                                        const title = document.getElementById('selTitle').value;
                                        const photosStr = document.getElementById('selPhotos').value;

                                        if (!clientName || !phone || !title || !photosStr) return alert('All fields are required');

                                        // Check if it's a folder link
                                        let photosPayload;
                                        if (photosStr.includes('/folders/')) {
                                            photosPayload = photosStr.trim(); // Send string for backend to handle
                                        } else {
                                            photosPayload = photosStr.split('\n').filter(url => url.trim() !== '').map(url => ({ url: url.trim() }));
                                        }

                                        try {
                                            const res = await fetch('/api/selection', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ clientName, phone, title, photos: photosPayload })
                                            });

                                            const data = await res.json();

                                            if (res.ok) {
                                                alert('Project Created! ' + (data.project.photos.length ? `${data.project.photos.length} photos added.` : ''));
                                                document.getElementById('selClient').value = '';
                                                document.getElementById('selPhone').value = '';
                                                document.getElementById('selTitle').value = '';
                                                document.getElementById('selPhotos').value = '';
                                                fetchSelectionProjects();
                                            } else {
                                                alert('Failed to create project');
                                            }
                                        } catch (e) { console.error(e); }
                                    }}
                                >
                                    Create Project
                                </button>
                            </div>

                            <div className={styles.listGrid}>
                                {selectionProjects.map(project => {
                                    const selectedCount = project.photos.filter(p => p.selected).length;
                                    return (
                                        <div key={project._id} className={styles.itemCard}>
                                            <div className={styles.itemContent}>
                                                <h4>{project.title}</h4>
                                                <p className={styles.itemMeta}>
                                                    <strong>ID: {project.weddingId}</strong><br />
                                                    {project.clientName} • {project.phone}
                                                </p>
                                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                                    <span className={styles.statusBadge} style={{ background: '#dbeafe', color: '#1e40af' }}>
                                                        {project.photos.length} Photos
                                                    </span>
                                                    <span className={styles.statusBadge} style={{ background: '#dcfce7', color: '#166534' }}>
                                                        {selectedCount} Selected
                                                    </span>
                                                </div>
                                                <details style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                                                    <summary style={{ cursor: 'pointer' }}>View Photo Links</summary>
                                                    <div style={{ marginTop: '0.5rem', maxHeight: '100px', overflowY: 'auto', background: '#f1f5f9', padding: '0.5rem', borderRadius: '4px' }}>
                                                        {project.photos.map((p, i) => (
                                                            <div key={i} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {i + 1}. {p.url}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </details>
                                            </div>
                                            <div className={styles.itemActions}>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.editBtn}`}
                                                    onClick={() => {
                                                        const selectedPhotos = project.photos.filter(p => p.selected).map(p => p.url).join('\n');
                                                        if (selectedPhotos) {
                                                            // Create a blob and download
                                                            const blob = new Blob([selectedPhotos], { type: 'text/plain' });
                                                            const url = window.URL.createObjectURL(blob);
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = `${project.title}-selected.txt`;
                                                            a.click();
                                                        } else {
                                                            alert('No photos selected yet.');
                                                        }
                                                    }}
                                                >
                                                    Download List
                                                </button>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <button
                                                        className={`${styles.actionBtn} ${styles.editBtn}`}
                                                        style={{ background: '#3b82f6', color: 'white', fontSize: '0.8rem' }}
                                                        onClick={() => startDownload(project._id, 'selected')}
                                                    >
                                                        Download Selected (ZIP)
                                                    </button>
                                                    <button
                                                        className={`${styles.actionBtn} ${styles.editBtn}`}
                                                        style={{ background: '#8b5cf6', color: 'white', fontSize: '0.8rem' }}
                                                        onClick={() => startDownload(project._id, 'commented')}
                                                    >
                                                        Download Commented (ZIP)
                                                    </button>
                                                </div>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                    onClick={async () => {
                                                        if (!confirm('Delete this project?')) return;
                                                        try {
                                                            const res = await fetch(`/api/selection/${project._id}`, { method: 'DELETE' });
                                                            if (res.ok) {
                                                                fetchSelectionProjects();
                                                            } else {
                                                                alert('Failed to delete project');
                                                            }
                                                        } catch (e) {
                                                            console.error(e);
                                                            alert('Error deleting project');
                                                        }
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </>
                )}
                {activeTab === 'analytics' && <AnalyticsDashboard />}
                {activeTab === 'website' && <WebsiteControlComponent />}
                {activeTab === 'payments' && <PaymentDashboard />}
            </div>
        </div >
    );
}
