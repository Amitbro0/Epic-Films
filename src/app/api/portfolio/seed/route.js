import dbConnect from '@/lib/db';
import Portfolio from '@/models/Portfolio';
import { siteConfig } from '@/config/siteConfig';

import { cookies } from 'next/headers';

export async function POST(req) {
    // Check auth
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
        return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();

        // Clear existing? No, just append or check duplicates? 
        // For simplicity, we will just insert them. User can delete duplicates.

        const items = siteConfig.portfolio.map(p => ({
            title: p.title,
            videoId: p.videoId
        }));

        await Portfolio.insertMany(items);

        return Response.json({ success: true, message: 'Imported successfully' });
    } catch (error) {
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
