import mongoose from 'mongoose';

const SiteConfigSchema = new mongoose.Schema({
    studioName: { type: String, default: "Epic Film's" },
    ownerName: { type: String, default: "Amit" },
    location: { type: String, default: "Ramgarh, Jharkhand, India" },
    contact: {
        phone: { type: String, default: "+91 98765 43210" },
        email: { type: String, default: "contact@amitstudio.com" },
        upiId: { type: String, default: "" },
    },
    hero: {
        headline: { type: String, default: "Professional Wedding & Event Video Editor" },
        subheadline: { type: String, default: "Emotional, Cinematic Wedding Films that tell your story." },
    },
    features: [{
        title: { type: String },
        description: { type: String }
    }],
    pricing: [{
        category: { type: String },
        details: [{
            label: { type: String },
            price: { type: String }
        }]
    }],
    channelUrl: { type: String, default: "https://www.youtube.com/@pixamit3161" },
    paymentConfig: {
        advancePercentage: { type: Number, default: 50 },
        taxRate: { type: Number, default: 0 }, // GST %
        invoiceNote: { type: String, default: "Thank you for your business!" },
        policies: { type: String, default: "No refunds on advance payment. Full refund if cancelled within 24 hours of booking." },
        manualPayment: {
            enabled: { type: Boolean, default: true },
            upiId: { type: String, default: "" },
            qrCode: { type: String, default: "" }, // URL or Base64
            instructions: { type: String, default: "Scan the QR code or use the UPI ID to pay. Enter the Transaction ID below." }
        }
    },
    analytics: {
        googleAnalyticsId: { type: String, default: "" }, // G-XXXXXXXXXX
        clarityId: { type: String, default: "" } // Project ID
    },
    transferConfig: {
        maxSizeGB: { type: Number, default: 50 }, // Default 50GB
        expiryDays: { type: Number, default: 1 }, // Default 1 Day
        enableServerUpload: { type: Boolean, default: false } // Default OFF (P2P only)
    }
}, { timestamps: true });

// Ensure only one config document exists usually, but we'll just fetch the first one
export default mongoose.models.SiteConfig || mongoose.model('SiteConfig', SiteConfigSchema);
