import { google } from 'googleapis';
import dbConnect from '@/lib/db';
import SelectionProject from '@/models/SelectionProject';

import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import os from 'os';

const logFile = path.join(process.cwd(), 'job-debug.log');
function log(msg) {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
}

// Helper to update job status
const updateStatus = (jobId, status) => {
    try {
        const statusFile = path.join(os.tmpdir(), `job-${jobId}.json`);
        fs.writeFileSync(statusFile, JSON.stringify(status));
        log(`Status updated for ${jobId}: ${status.status} ${status.progress}%`);
    } catch (e) {
        log(`Failed to update status for ${jobId}: ${e.message}`);
    }
};

export async function POST(req) {
    try {
        log('Received start request');
        const body = await req.json();
        const { projectId, type } = body;
        log(`Project: ${projectId}, Type: ${type}`);

        if (!projectId || !type) {
            return Response.json({ message: 'Missing projectId or type' }, { status: 400 });
        }

        const jobId = Date.now().toString();
        const zipPath = path.join(os.tmpdir(), `job-${jobId}.zip`);
        log(`Job ID: ${jobId}, Zip Path: ${zipPath}`);

        // Initialize status
        updateStatus(jobId, { status: 'starting', progress: 0, total: 0, current: 0 });

        // Start background process (FIRE AND FORGET)
        (async () => {
            try {
                log(`Starting background process for ${jobId}`);
                await dbConnect();
                const project = await SelectionProject.findById(projectId);
                if (!project) throw new Error('Project not found');

                let targetPhotos = [];
                if (type === 'selected') {
                    targetPhotos = project.photos.filter(p => p.selected);
                } else if (type === 'commented') {
                    targetPhotos = project.photos.filter(p => p.comment && p.comment.trim() !== '');
                }
                log(`Found ${targetPhotos.length} photos`);

                updateStatus(jobId, { status: 'processing', progress: 0, total: targetPhotos.length, current: 0 });

                const apiKey = process.env.GOOGLE_API_KEY;
                const drive = google.drive({ version: 'v3', auth: apiKey });

                const output = fs.createWriteStream(zipPath);
                const archive = archiver('zip', { zlib: { level: 9 } });

                output.on('close', () => {
                    log(`Zip finalized for ${jobId}`);
                    updateStatus(jobId, { status: 'completed', progress: 100, filename: `${project.title.replace(/\s+/g, '_')}_${type}.zip` });
                });

                output.on('error', (err) => {
                    log(`Output stream error for ${jobId}: ${err.message}`);
                    updateStatus(jobId, { status: 'error', message: 'File write error' });
                });

                archive.on('error', (err) => {
                    log(`Archiver error for ${jobId}: ${err.message}`);
                    updateStatus(jobId, { status: 'error', message: 'Archiver error' });
                });

                archive.pipe(output);

                for (let i = 0; i < targetPhotos.length; i++) {
                    const photo = targetPhotos[i];
                    const fileName = `Photo_${i + 1}.jpg`;

                    // Extract ID
                    let fileId = null;
                    const idMatch = photo.url.match(/\/d\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)/);
                    if (idMatch) fileId = idMatch[1] || idMatch[2];

                    if (fileId) {
                        try {
                            log(`Processing ${i + 1}/${targetPhotos.length}: ${fileId}`);
                            // Try API first
                            const response = await drive.files.get(
                                { fileId, alt: 'media' },
                                { responseType: 'stream' }
                            );
                            archive.append(response.data, { name: fileName });

                            if (type === 'commented' && photo.comment) {
                                archive.append(Buffer.from(photo.comment), { name: `Photo_${i + 1}_Comment.txt` });
                            }
                        } catch (err) {
                            log(`API failed for ${fileId}: ${err.message}. Trying fallback.`);
                            // Fallback
                            try {
                                const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
                                const res = await fetch(downloadUrl);
                                if (!res.ok) throw new Error(`Fetch status: ${res.status}`);
                                const buffer = Buffer.from(await res.arrayBuffer());
                                archive.append(buffer, { name: fileName });

                                if (type === 'commented' && photo.comment) {
                                    archive.append(Buffer.from(photo.comment), { name: `Photo_${i + 1}_Comment.txt` });
                                }
                            } catch (fallbackErr) {
                                log(`Fallback failed for ${fileId}: ${fallbackErr.message}`);
                                archive.append(Buffer.from(`Error: ${err.message}`), { name: `ERROR_${fileName}.txt` });
                            }
                        }
                    }

                    // Update Progress
                    const percent = Math.round(((i + 1) / targetPhotos.length) * 100);
                    updateStatus(jobId, { status: 'processing', progress: percent, total: targetPhotos.length, current: i + 1 });
                }

                log(`Finalizing archive for ${jobId}`);
                await archive.finalize();

            } catch (error) {
                console.error('Job Error:', error);
                log(`Job Error for ${jobId}: ${error.message}`);
                updateStatus(jobId, { status: 'error', message: error.message });
            }
        })();

        return Response.json({ success: true, jobId });

    } catch (error) {
        log(`Start Route Error: ${error.message}`);
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
