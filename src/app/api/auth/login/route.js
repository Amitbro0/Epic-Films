
import { cookies } from 'next/headers';

export async function POST(req) {
    const body = await req.json();
    const { username, password } = body;

    // Simple hardcoded check for now. In production, check DB and hash password.
    if (username === 'admin' && password === 'admin123') {
        // Set a cookie
        cookies().set('admin_token', 'valid_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });
        return Response.json({ success: true });
    }

    return Response.json({ message: 'Invalid credentials' }, { status: 401 });
}
