import dbConnect from '@/lib/db';
import Service from '@/models/Service';

import { cookies } from 'next/headers';

export async function PUT(req) {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
        return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const { orderedIds } = await req.json();

        if (!orderedIds || !Array.isArray(orderedIds)) {
            return Response.json({ message: 'Invalid data' }, { status: 400 });
        }

        // Bulk update
        const updates = orderedIds.map((id, index) => {
            return Service.findByIdAndUpdate(id, { order: index });
        });

        await Promise.all(updates);

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
