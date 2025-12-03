import dbConnect from '@/lib/db';
import Order from '@/models/Order';

import { cookies } from 'next/headers';

export async function GET(req) {
    // Check auth
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
        return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const orders = await Order.find({}).sort({ createdAt: -1 });
        return Response.json(orders);
    } catch (error) {
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
