import dbConnect from '@/lib/db';
import SelectionProject from '@/models/SelectionProject';


export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const phone = searchParams.get('phone');
        const weddingId = searchParams.get('weddingId');

        if (weddingId) {
            // Client Access via Wedding ID
            const project = await SelectionProject.findOne({ weddingId: weddingId });
            if (!project) {
                return Response.json({ message: 'Invalid Wedding ID' }, { status: 404 });
            }
            return Response.json([project]); // Return as array for consistency
        }

        if (!phone) {
            // Admin Access (Fetch All)
            const projects = await SelectionProject.find({}).sort({ createdAt: -1 });
            return Response.json(projects);
        }

        // Fallback: Fetch by phone (if needed for admin search)
        const projects = await SelectionProject.find({ phone: phone }).sort({ createdAt: -1 });
        return Response.json(projects);

    } catch (error) {
        console.error('Selection fetch error:', error);
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

import { google } from 'googleapis';

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();

        // Basic validation
        if (!body.clientName || !body.phone || !body.title) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 });
        }

        let photos = [];

        // Check if photos input is a Folder Link (string) or Array
        if (typeof body.photos === 'string' && body.photos.includes('/folders/')) {
            // Handle Google Drive Folder
            const apiKey = process.env.GOOGLE_API_KEY;
            if (!apiKey || apiKey === 'YOUR_GOOGLE_API_KEY_HERE') {
                return Response.json({
                    message: 'Google Drive API Key is missing in .env.local. Please configure it to use Folder Links.'
                }, { status: 500 });
            }

            const folderIdMatch = body.photos.match(/\/folders\/([a-zA-Z0-9_-]+)/);
            if (!folderIdMatch) {
                return Response.json({ message: 'Invalid Google Drive Folder Link' }, { status: 400 });
            }
            const folderId = folderIdMatch[1];

            try {
                const drive = google.drive({ version: 'v3', auth: apiKey });
                const response = await drive.files.list({
                    q: `'${folderId}' in parents and (mimeType contains 'image/' or mimeType = 'application/vnd.google-apps.folder') and trashed = false`,
                    fields: 'files(id, name, thumbnailLink, webContentLink)',
                    pageSize: 1000, // Adjust as needed
                });

                const files = response.data.files;
                if (!files || files.length === 0) {
                    return Response.json({ message: 'No images found in this folder (or folder is not public/accessible).' }, { status: 400 });
                }

                photos = files.map(file => ({
                    url: `https://drive.google.com/uc?export=view&id=${file.id}`, // Construct direct link
                    // Alternatively use file.webContentLink or file.thumbnailLink if preferred
                }));

            } catch (driveError) {
                console.error('Google Drive API Error:', driveError);
                return Response.json({ message: 'Failed to fetch folder. Ensure API Key is valid and Folder is "Anyone with the link".' }, { status: 500 });
            }

        } else if (Array.isArray(body.photos)) {
            // Existing logic for array of objects
            photos = body.photos;
        } else {
            return Response.json({ message: 'Invalid photos format' }, { status: 400 });
        }

        // Generate Random Wedding ID (e.g., WED-1234)
        const generateId = () => 'WED-' + Math.floor(1000 + Math.random() * 9000);
        let weddingId = generateId();

        // Ensure uniqueness (simple check)
        let existing = await SelectionProject.findOne({ weddingId });
        while (existing) {
            weddingId = generateId();
            existing = await SelectionProject.findOne({ weddingId });
        }

        // Create project
        const project = await SelectionProject.create({
            clientName: body.clientName,
            phone: body.phone,
            title: body.title,
            photos: photos,
            weddingId
        });

        return Response.json({
            success: true,
            project,
            message: 'Project created successfully'
        }, { status: 201 });

    } catch (error) {
        console.error('Project creation error:', error);
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
