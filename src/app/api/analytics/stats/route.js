
import dbConnect from '@/lib/db';
import Analytics from '@/models/Analytics';

export async function GET(req) {
    try {
        await dbConnect();

        // Date Range (Last 30 Days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const totalViews = await Analytics.countDocuments({ timestamp: { $gte: thirtyDaysAgo } });

        // Unique Visitors (Approximate via distinct IP Hash)
        const uniqueVisitors = (await Analytics.distinct('ipHash', { timestamp: { $gte: thirtyDaysAgo } })).length;

        // Top Pages
        const topPages = await Analytics.aggregate([
            { $match: { timestamp: { $gte: thirtyDaysAgo } } },
            { $group: { _id: "$path", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Traffic Sources
        const topSources = await Analytics.aggregate([
            { $match: { timestamp: { $gte: thirtyDaysAgo } } },
            { $group: { _id: "$referrer", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Device Breakdown
        const deviceStats = await Analytics.aggregate([
            { $match: { timestamp: { $gte: thirtyDaysAgo } } },
            { $group: { _id: "$device", count: { $sum: 1 } } }
        ]);

        // Views Over Time (Last 7 Days)
        const viewsOverTime = await Analytics.aggregate([
            { $match: { timestamp: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return Response.json({
            totalViews,
            uniqueVisitors,
            topPages,
            topSources,
            deviceStats,
            viewsOverTime
        });
    } catch (error) {
        console.error('Stats Error:', error);
        return Response.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
