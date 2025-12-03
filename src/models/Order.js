import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    clientName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    eventType: { type: String, required: true },
    serviceType: { type: String, required: true }, // e.g., 'full-film', 'highlight'
    message: { type: String },
    driveLink: { type: String },
    status: { type: String, default: 'pending' }, // pending, in-progress, completed, delivered

    // Payment Fields
    paymentStatus: { type: String, default: 'pending' }, // pending, partial, paid, failed
    amountTotal: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    amountDue: { type: Number, default: 0 },
    invoiceNumber: { type: String },
    transactions: [{
        id: String, // Razorpay Payment ID
        orderId: String, // Razorpay Order ID
        amount: Number,
        date: { type: Date, default: Date.now },
        status: String, // success, failed
        method: String // card, upi, etc.
    }],
    isPhotographer: { type: Boolean, default: false },
    photographerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Prevent recompilation of model in development
export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
