import dbConnect from '@/lib/db';
import Portfolio from '@/models/Portfolio';

import { cookies } from 'next/headers';

export async function PUT(req, { params }) {
    // Check auth
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
        return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const { id } = params;
        const body = await req.json();

        const item = await Portfolio.findByIdAndUpdate(id, body, { new: true });

        if (!item) {
            return Response.json({ message: 'Item not found' }, { status: 404 });
        }

        return Response.json(item);
    } catch (error) {
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    // Check auth
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
        return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const { id } = params;
        await Portfolio.findByIdAndDelete(id);
        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
