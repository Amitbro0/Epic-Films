import mongoose from 'mongoose';

const SelectionProjectSchema = new mongoose.Schema({
    clientName: { type: String, required: true },
    phone: { type: String, required: true },
    weddingId: { type: String, required: true, unique: true }, // Random ID for access
    title: { type: String, required: true }, // e.g., "Amit weds Riya"
    coverImage: { type: String }, // Optional cover image
    photos: [{
        url: { type: String, required: true },
        selected: { type: Boolean, default: false },
        comment: { type: String, default: '' }
    }],
    status: {
        type: String,
        default: 'in-progress',
        enum: ['in-progress', 'completed']
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Force recompilation if schema changed
if (mongoose.models.SelectionProject) {
    delete mongoose.models.SelectionProject;
}

export default mongoose.models.SelectionProject || mongoose.model('SelectionProject', SelectionProjectSchema);
