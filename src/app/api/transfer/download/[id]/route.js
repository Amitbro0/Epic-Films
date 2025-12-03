
import { createReadStream, statSync } from 'fs';
import dbConnect from '@/lib/db';
import Transfer from '@/models/Transfer';

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const transfer = await Transfer.findById(params.id);

        if (!transfer) {
            return Response.json({ error: 'File not found or expired.' }, { status: 404 });
        }

        // Check Expiry
        if (new Date() > new Date(transfer.expiresAt)) {
            return Response.json({ error: 'Link expired.' }, { status: 410 });
        }

        if (!transfer.path) {
            return Response.json({ error: 'File path missing.' }, { status: 404 });
        }
        const stats = statSync(transfer.path);
        const stream = createReadStream(transfer.path);

        // Increment Download Count
        transfer.downloads += 1;
        await transfer.save();

        return new Response(stream, {
            headers: {
                'Content-Disposition': `attachment; filename="${encodeURIComponent(transfer.filename)}"; filename*=UTF-8''${encodeURIComponent(transfer.filename)}`,
                'Content-Length': stats.size,
                'Content-Type': 'application/octet-stream',
            },
        });

    } catch (error) {

        console.error('Download Error Details:', error);
        console.error('Stack:', error.stack);
        return Response.json({ error: 'Download failed: ' + error.message }, { status: 500 });
    }
}
