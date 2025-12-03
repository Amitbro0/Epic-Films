'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
            <h2>Something went wrong!</h2>
            <p>{error.message}</p>
            <pre style={{ textAlign: 'left', background: '#eee', padding: '1rem', overflow: 'auto' }}>
                {error.stack}
            </pre>
            <button
                onClick={() => reset()}
                style={{ padding: '0.5rem 1rem', marginTop: '1rem', cursor: 'pointer' }}
            >
                Try again
            </button>
        </div>
    );
}
