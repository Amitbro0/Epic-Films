import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) return NextResponse.json({ message: 'Missing jobId' }, { status: 400 });

    const statusFile = path.join(os.tmpdir(), `job-${jobId}.json`);
    const zipPath = path.join(os.tmpdir(), `job-${jobId}.zip`);

    if (!fs.existsSync(statusFile) || !fs.existsSync(zipPath)) {
        return NextResponse.json({ message: 'File not found' }, { status: 404 });
    }

    const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
    const fileBuffer = fs.readFileSync(zipPath);

    // Clean up (optional: delay cleanup or rely on OS temp cleanup)
    // fs.unlinkSync(statusFile);
    // fs.unlinkSync(zipPath);

    return new NextResponse(fileBuffer, {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${status.filename || 'download.zip'}"`,
            'Content-Length': fileBuffer.length.toString(), // Crucial for browser time estimate
        },
    });
}
