import mongoose from 'mongoose';

const AnalyticsSchema = new mongoose.Schema({
    path: { type: String, required: true },
    referrer: { type: String, default: 'Direct' },
    device: { type: String, default: 'Desktop' }, // Mobile, Tablet, Desktop
    browser: { type: String, default: 'Unknown' },
    country: { type: String, default: 'Unknown' },
    ipHash: { type: String }, // Anonymized IP for unique visitor counting
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for faster querying
AnalyticsSchema.index({ timestamp: -1 });
AnalyticsSchema.index({ path: 1 });

export default mongoose.models.Analytics || mongoose.model('Analytics', AnalyticsSchema);
