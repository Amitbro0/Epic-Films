
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return Response.json({ error: "No file received." }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = "qr-code.png"; // Overwrite the existing one or use unique name

        // Save to public directory
        const filePath = path.join(process.cwd(), 'public', filename);
        await writeFile(filePath, buffer);

        return Response.json({
            message: "Success",
            path: "/" + filename
        });
    } catch (error) {
        console.error("Upload Error:", error);
        return Response.json({ error: "Failed to upload file." }, { status: 500 });
    }
}
