import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // In a real app, hash this!
    role: { type: String, default: 'admin', enum: ['admin', 'photographer'] },
    name: { type: String },
    studioName: { type: String },
    phone: { type: String },
    email: { type: String },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
