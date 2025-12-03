import dbConnect from '@/lib/db';
import Service from '@/models/Service';
import { siteConfig } from '@/config/siteConfig';

import { cookies } from 'next/headers';

export async function POST(req) {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
        return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();

        // Map config services to model structure
        const services = siteConfig.services.map(s => ({
            title: s.title,
            description: s.description,
            duration: s.duration,
            deliverables: s.deliverables,
            priceStart: s.priceStart,
            imageUrl: s.imageUrl,
            icon: s.icon
        }));

        await Service.insertMany(services);

        return Response.json({ success: true, message: 'Services imported successfully' });
    } catch (error) {
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
