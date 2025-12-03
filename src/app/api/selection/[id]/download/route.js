import { google } from 'googleapis';
import dbConnect from '@/lib/db';
import SelectionProject from '@/models/SelectionProject';
import { NextResponse } from 'next/server';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import fs from 'fs';
import path from 'path';

const logFile = path.join(process.cwd(), 'download-debug.log');

function log(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

export async function GET(req, { params }) {
    try {
        log(`Starting download for project ${params.id}`);
        await dbConnect();
        const project = await SelectionProject.findById(params.id);

        if (!project) {
            log('Project not found');
            return Response.json({ message: 'Project not found' }, { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type'); // 'selected' or 'commented'
        log(`Download type: ${type}`);

        // Filter photos based on type
        let targetPhotos = [];
        if (type === 'selected') {
            targetPhotos = project.photos.filter(p => p.selected);
        } else if (type === 'commented') {
            targetPhotos = project.photos.filter(p => p.comment && p.comment.trim() !== '');
        } else {
            return Response.json({ message: 'Invalid download type' }, { status: 400 });
        }

        log(`Found ${targetPhotos.length} photos`);

        if (targetPhotos.length === 0) {
            return Response.json({ message: `No ${type} photos found.` }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            log('API Key missing');
            return Response.json({ message: 'Google API Key missing' }, { status: 500 });
        }

        const drive = google.drive({ version: 'v3', auth: apiKey });

        const stream = new PassThrough();
        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.pipe(stream);

        for (let i = 0; i < targetPhotos.length; i++) {
            const photo = targetPhotos[i];
            const fileName = `Photo_${i + 1}.jpg`;

            let fileId = null;
            // Match /d/ID/ OR id=ID (handling ?id= or &id=)
            const idMatch = photo.url.match(/\/d\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)/);
            if (idMatch) {
                fileId = idMatch[1] || idMatch[2];
            }

            if (fileId) {
                try {
                    log(`Processing ${fileName} (ID: ${fileId})`);
                    const response = await drive.files.get(
                        { fileId, alt: 'media' },
                        { responseType: 'stream' }
                    );
                    log(`API Success for ${fileId}`);
                    archive.append(response.data, { name: fileName });

                    if (type === 'commented' && photo.comment) {
                        archive.append(Buffer.from(photo.comment), { name: `Photo_${i + 1}_Comment.txt` });
                    }

                } catch (err) {
                    log(`API Failed for ${fileId}: ${err.message}`);

                    // Fallback: Try fetching via public URL
                    try {
                        log(`Attempting fallback for ${fileId}`);
                        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
                        const res = await fetch(downloadUrl);

                        if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);

                        const arrayBuffer = await res.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);

                        log(`Fallback Success for ${fileId}`);
                        archive.append(buffer, { name: fileName });

                        if (type === 'commented' && photo.comment) {
                            archive.append(Buffer.from(photo.comment), { name: `Photo_${i + 1}_Comment.txt` });
                        }

                    } catch (fallbackErr) {
                        log(`Fallback Failed for ${fileId}: ${fallbackErr.message}`);
                        archive.append(Buffer.from(`Error downloading file: ${err.message} | Fallback: ${fallbackErr.message}`), { name: `ERROR_${fileName}.txt` });
                    }
                }
            } else {
                log(`Could not extract ID from URL: ${photo.url}`);
            }
        }

        archive.finalize();
        log('Archive finalized');

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${project.title.replace(/\s+/g, '_')}_${type}.zip"`,
            },
        });

    } catch (error) {
        log(`Critical Error: ${error.message}`);
        console.error('Download error:', error);
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
