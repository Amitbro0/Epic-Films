
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) return Response.json({ message: 'Missing jobId' }, { status: 400 });

    const statusFile = path.join(os.tmpdir(), `job-${jobId}.json`);

    if (!fs.existsSync(statusFile)) {
        return Response.json({ message: 'Job not found' }, { status: 404 });
    }

    const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
    return Response.json(status);
}
