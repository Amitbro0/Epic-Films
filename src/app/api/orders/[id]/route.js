import dbConnect from '@/lib/db';
import Order from '@/models/Order';

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

        const order = await Order.findByIdAndUpdate(id, body, { new: true });

        if (!order) {
            return Response.json({ message: 'Order not found' }, { status: 404 });
        }

        return Response.json(order);
    } catch (error) {
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
