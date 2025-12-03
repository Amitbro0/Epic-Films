import dbConnect from '@/lib/db';
import Service from '@/models/Service';

import { cookies } from 'next/headers';

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { id } = params;
        const service = await Service.findById(id);
        if (!service) {
            return Response.json({ message: 'Service not found' }, { status: 404 });
        }
        return Response.json(service);
    } catch (error) {
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
        return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const { id } = params;
        const body = await req.json();

        const service = await Service.findByIdAndUpdate(id, body, { new: true });

        if (!service) {
            return Response.json({ message: 'Service not found' }, { status: 404 });
        }

        return Response.json(service);
    } catch (error) {
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
        return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const { id } = params;
        await Service.findByIdAndDelete(id);
        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
