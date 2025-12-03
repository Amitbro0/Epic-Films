import mongoose from 'mongoose';

const TransferSchema = new mongoose.Schema({
    fileId: { type: String, required: true, unique: true },
    filename: { type: String, required: true },
    size: { type: Number, required: true }, // In bytes
    mimeType: { type: String },
    senderEmail: { type: String },
    message: { type: String },
    path: { type: String }, // Local path (optional if on Drive)
    driveFileId: { type: String }, // Google Drive File ID
    expiresAt: { type: Date, required: true },
    downloads: { type: Number, default: 0 }
}, { timestamps: true });

// Auto-delete from DB after expiry (Note: This only deletes the DB record, file cleanup needs a separate cron/check)
TransferSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Transfer || mongoose.model('Transfer', TransferSchema);
