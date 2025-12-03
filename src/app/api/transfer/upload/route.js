
import { appendFile, writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import dbConnect from '@/lib/db';
import Transfer from '@/models/Transfer';
import SiteConfig from '@/models/SiteConfig';
import { cleanupExpiredFiles } from '@/lib/cleanup';
import { uploadToDrive } from '@/lib/drive';

export async function POST(req) {
    // Trigger cleanup asynchronously (don't wait for it)
    cleanupExpiredFiles();

    try {
        await dbConnect();
        const formData = await req.formData();

        const file = formData.get('file'); // The chunk
        const chunkIndex = parseInt(formData.get('chunkIndex'));
        const totalChunks = parseInt(formData.get('totalChunks'));
        const fileId = formData.get('fileId') || uuidv4();
        const filename = formData.get('filename');
        const totalSize = parseInt(formData.get('totalSize')); // Total file size
        const senderEmail = formData.get('senderEmail');
        const message = formData.get('message');

        // 1. Check Config Limits (Only on first chunk)
        if (chunkIndex === 0) {
            const config = await SiteConfig.findOne().sort({ createdAt: -1 });
            // FORCE UNLIMITED: Use 10000GB if config is low, or just use config if it's high.
            // But user wants "Unlimited", so let's just set a massive fallback.
            const maxSizeGB = (config?.transferConfig?.maxSizeGB && config.transferConfig.maxSizeGB > 50) ? config.transferConfig.maxSizeGB : 10000;
            const maxSizeBytes = maxSizeGB * 1024 * 1024 * 1024;

            if (totalSize > maxSizeBytes) {
                return Response.json({ error: `File too large. Limit is ${maxSizeGB}GB.` }, { status: 400 });
            }
        }

        // 2. Prepare Directory
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'transfers');
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, `${fileId}-${filename}`);

        // 3. Handle Chunk
        const buffer = Buffer.from(await file.arrayBuffer());

        if (chunkIndex === 0) {
            // First chunk: Create file
            await writeFile(filePath, buffer);
        } else {
            // Subsequent chunks: Append
            await appendFile(filePath, buffer);
        }

        // 4. Finalize if last chunk
        if (chunkIndex === totalChunks - 1) {
            const config = await SiteConfig.findOne().sort({ createdAt: -1 });
            const expiryDays = config?.transferConfig?.expiryDays || 1; // Default 1 Day
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiryDays);

            const transfer = await Transfer.create({
                fileId,
                filename,
                size: totalSize,
                path: filePath, // Keep local path
                expiresAt,
                senderEmail,
                message
            });

            return Response.json({
                success: true,
                completed: true,
                fileId,
                downloadLink: `/transfer/download/${transfer._id}`
            });
        }

        return Response.json({ success: true, fileId, chunkIndex });

    } catch (error) {
        console.error('Upload Error:', error);
        return Response.json({ error: 'Upload failed.' }, { status: 500 });
    }
}
