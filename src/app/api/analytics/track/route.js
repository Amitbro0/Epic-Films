
import dbConnect from '@/lib/db';
import Analytics from '@/models/Analytics';
import crypto from 'crypto';

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const userAgent = req.headers.get('user-agent') || '';

        // Simple Device Detection
        let device = 'Desktop';
        if (/mobile/i.test(userAgent)) device = 'Mobile';
        else if (/tablet|ipad/i.test(userAgent)) device = 'Tablet';

        // Anonymize IP
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

        await Analytics.create({
            path: body.path,
            referrer: body.referrer || 'Direct',
            device,
            browser: userAgent, // Storing full UA for now, can parse later if needed
            ipHash
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('Tracking Error:', error);
        return Response.json({ error: 'Failed to track' }, { status: 500 });
    }
}
