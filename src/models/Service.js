import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: String },
    deliverables: { type: [String] }, // Array of strings
    priceStart: { type: String },
    icon: { type: String }, // Optional icon name
    imageUrl: { type: String }, // URL for service image
    videoId: { type: String }, // YouTube Video ID for background
    order: { type: Number, default: 0 }, // For reordering
    isVisible: { type: Boolean, default: true }, // For hide/show
    createdAt: { type: Date, default: Date.now },
});

// Force schema update by deleting cached model in dev
if (process.env.NODE_ENV !== 'production' && mongoose.models.Service) {
    delete mongoose.models.Service;
}

export default mongoose.models.Service || mongoose.model('Service', ServiceSchema);
