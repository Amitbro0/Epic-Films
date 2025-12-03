import dbConnect from '@/lib/db';
import Portfolio from '@/models/Portfolio';

import { cookies } from 'next/headers';

export async function GET(req) {
    try {
        await dbConnect();

        // Check if admin
        const cookieStore = cookies();
        const token = cookieStore.get('admin_token');
        const isAdmin = !!token;

        let query = {};
        if (!isAdmin) {
            query = { isVisible: { $ne: false } };
        }

        const items = await Portfolio.find(query).sort({ createdAt: -1 });
        return Response.json(items);
    } catch (error) {
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    // Check auth
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
        return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const body = await req.json();

        if (!body.title || !body.videoId) {
            return Response.json({ message: 'Title and Video ID are required' }, { status: 400 });
        }

        const item = await Portfolio.create(body);
        return Response.json(item, { status: 201 });
    } catch (error) {
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
