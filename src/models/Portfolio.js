import mongoose from 'mongoose';

const PortfolioSchema = new mongoose.Schema({
    title: { type: String, required: true },
    videoId: { type: String, required: true }, // YouTube Video ID
    isVisible: { type: Boolean, default: true }, // For hide/show
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Portfolio || mongoose.model('Portfolio', PortfolioSchema);
