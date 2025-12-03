import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from '../../app/admin/dashboard/page.module.css';

export function SortableServiceItem({ service, onEdit, onDelete }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: service._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className={styles.itemCard}>
            <div className={styles.dragHandle} {...attributes} {...listeners}>
                ☰
            </div>
            {service.imageUrl && (
                <img src={service.imageUrl} alt={service.title} className={styles.itemImage} />
            )}
            <div className={styles.itemContent}>
                <h4>{service.title}</h4>
                <p className={styles.itemMeta}>{service.duration} • {service.priceStart}</p>
            </div>
            <div className={styles.itemActions}>
                <button
                    className={`${styles.actionBtn} ${styles.editBtn}`}
                    onClick={() => onEdit(service)}
                >
                    Edit
                </button>
                <button
                    className={`${styles.actionBtn} ${styles.toggleBtn}`}
                    style={{ backgroundColor: service.isVisible !== false ? '#fef08a' : '#e2e8f0', color: service.isVisible !== false ? '#854d0e' : '#475569' }}
                    onClick={() => onEdit({ ...service, isVisible: service.isVisible === false }, true)}
                >
                    {service.isVisible !== false ? 'Hide' : 'Show'}
                </button>
                <button
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    onClick={() => onDelete(service)}
                >
                    Delete
                </button>
            </div>
        </div>
    );
}
