export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const folderId = searchParams.get('folderId');

        if (!folderId) {
            return Response.json({ message: 'folderId is required' }, { status: 400 });
        }

        // Vercel deployment variables sometimes need to be accessed explicitly
        const apiKey = (process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '').trim();
        if (!apiKey) {
            return Response.json({ message: 'API Key not configured on server' }, { status: 500 });
        }

        let allFiles = [];
        let pageToken = null;

        do {
            const query = `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`;
            const url = new URL('https://www.googleapis.com/drive/v3/files');
            url.searchParams.append('q', query);
            url.searchParams.append('fields', 'nextPageToken, files(id, name, thumbnailLink)');
            url.searchParams.append('pageSize', '1000');
            url.searchParams.append('key', apiKey);
            if (pageToken) url.searchParams.append('pageToken', pageToken);

            const response = await fetch(url.toString());
            const data = await response.json();

            if (!response.ok) {
                console.error("Drive REST Error:", data);
                throw new Error(data.error?.message || 'Failed to fetch from Google Drive REST API');
            }

            const files = data.files || [];
            allFiles = allFiles.concat(files);
            pageToken = data.nextPageToken;
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
