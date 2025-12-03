import fs from 'fs/promises';
import Transfer from '@/models/Transfer';
import dbConnect from '@/lib/db';

export async function cleanupExpiredFiles() {
    try {
        await dbConnect();
        const now = new Date();

        // Find expired files
        const expiredTransfers = await Transfer.find({ expiresAt: { $lt: now } });

        if (expiredTransfers.length === 0) return;

        console.log(`Found ${expiredTransfers.length} expired files. Cleaning up...`);

        for (const transfer of expiredTransfers) {
            try {
                // Delete file from disk
                if (transfer.path) {
                    await fs.unlink(transfer.path);
                    console.log(`Deleted file: ${transfer.path}`);
                }
            } catch (err) {
                // Ignore error if file doesn't exist (already deleted)
                if (err.code !== 'ENOENT') {
                    console.error(`Failed to delete file ${transfer.path}:`, err);
                }
            }

            // Delete record from DB
            await Transfer.findByIdAndDelete(transfer._id);
        }
    } catch (error) {
        console.error('Cleanup Error:', error);
    }
}
