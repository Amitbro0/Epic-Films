
import dbConnect from '@/lib/db';
import SiteConfig from '@/models/SiteConfig';

export async function GET() {
    await dbConnect();
    const config = await SiteConfig.findOne();
    if (config) {
        config.transferConfig.maxSizeGB = 10000; // Effectively unlimited
        await config.save();
        return Response.json({ success: true, message: 'Limit updated to 10,000 GB' });
    }
    return Response.json({ error: 'Config not found' });
}
