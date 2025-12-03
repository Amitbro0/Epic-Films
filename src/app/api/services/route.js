import dbConnect from '@/lib/db';
import Service from '@/models/Service';

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

        const services = await Service.find(query).sort({ order: 1, createdAt: 1 });
        return Response.json(services);
    } catch (error) {
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
        return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const body = await req.json();

        if (!body.title || !body.description) {
            return Response.json({ message: 'Title and Description are required' }, { status: 400 });
        }

        const service = await Service.create(body);
        return Response.json(service, { status: 201 });
    } catch (error) {
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
