import dbConnect from '@/lib/db';
import SiteConfig from '@/models/SiteConfig';
import { siteConfig as defaultSiteConfig } from '@/config/siteConfig';
import { cookies } from 'next/headers';

export async function GET(req) {
    try {
        await dbConnect();
        let config = await SiteConfig.findOne();

        if (!config) {
            return Response.json(defaultSiteConfig);
        }

        return Response.json(config);
    } catch (error) {
        console.error('Failed to fetch site config:', error);
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req) {
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token');

    if (!token) {
        return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const body = await req.json();

        let config = await SiteConfig.findOne();
        if (!config) {
            config = await SiteConfig.create(body);
        } else {
            config.studioName = body.studioName;
            config.ownerName = body.ownerName;
            config.location = body.location;
            config.contact = body.contact;
            config.hero = body.hero;
            config.features = body.features;
            config.pricing = body.pricing;
            config.channelUrl = body.channelUrl;
            config.paymentConfig = body.paymentConfig;
            config.analytics = body.analytics;
            config.transferConfig = body.transferConfig;
            await config.save();
        }

        return Response.json(config);
    } catch (error) {
        console.error('Failed to update site config:', error);
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
