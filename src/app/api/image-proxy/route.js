export const runtime = 'edge';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('id');
    const width = searchParams.get('w') || '800';

    if (!fileId) {
        return new Response('Missing file id', { status: 400 });
    }

    try {
        // Use Google's lh3 endpoint directly (no redirect needed server-side)
        const imageUrl = `https://lh3.googleusercontent.com/d/${fileId}=w${width}`;

        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        if (!response.ok) {
            // Fallback: try the thumbnail endpoint
            const fallbackUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
            const fallbackRes = await fetch(fallbackUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                redirect: 'follow',
            });

            if (!fallbackRes.ok) {
                return new Response('Image not found', { status: 404 });
            }

            const fallbackBody = fallbackRes.body;
            return new Response(fallbackBody, {
                headers: {
                    'Content-Type': fallbackRes.headers.get('content-type') || 'image/jpeg',
                    'Cache-Control': 'public, max-age=86400, s-maxage=86400',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }

        const body = response.body;
        return new Response(body, {
            headers: {
                'Content-Type': response.headers.get('content-type') || 'image/jpeg',
                'Cache-Control': 'public, max-age=86400, s-maxage=86400',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        return new Response('Failed to fetch image', { status: 500 });
    }
}
