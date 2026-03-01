import { google } from 'googleapis';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const folderId = searchParams.get('folderId');

        if (!folderId) {
            return Response.json({ message: 'folderId is required' }, { status: 400 });
        }

        // Vercel deployment variables sometimes need to be accessed explicitly
        const apiKey = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
        if (!apiKey) {
            return Response.json({ message: 'API Key not configured on server' }, { status: 500 });
        }

        const drive = google.drive({ version: 'v3', auth: apiKey });

        let allFiles = [];
        let pageToken = null;

        do {
            const response = await drive.files.list({
                q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
                fields: 'nextPageToken, files(id, name, thumbnailLink)',
                pageSize: 1000,
                pageToken: pageToken || undefined,
            });

            const files = response.data.files || [];
            allFiles = allFiles.concat(files);
            pageToken = response.data.nextPageToken;
        } while (pageToken);

        const photos = allFiles.map((file, index) => ({
            id: file.id,
            name: file.name,
            thumbnailUrl: `https://drive.google.com/thumbnail?id=${file.id}&sz=w600`,
            fullUrl: `https://drive.google.com/thumbnail?id=${file.id}&sz=w1200`,
            index: index,
        }));

        return Response.json({
            success: true,
            count: photos.length,
            photos: photos,
        });

    } catch (error) {
        console.error('Drive Photos API Error:', error);
        return Response.json({
            message: 'Failed to fetch photos: ' + (error.message || 'Unknown error')
        }, { status: 500 });
    }
}
