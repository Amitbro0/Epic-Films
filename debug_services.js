const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '.env.local');
let mongoUri = '';
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/MONGODB_URI=(.*)/);
    if (match) {
        mongoUri = match[1].trim();
    }
}

const ServiceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: String },
    deliverables: { type: [String] },
    priceStart: { type: String },
    icon: { type: String },
    imageUrl: { type: String },
    videoId: { type: String },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
});

const Service = mongoose.models.Service || mongoose.model('Service', ServiceSchema);

async function checkServices() {
    if (!mongoUri) {
        console.error('MONGODB_URI not found in .env.local');
        return;
    }
    try {
        await mongoose.connect(mongoUri);
        const services = await Service.find({});
        console.log('--- SERVICES DUMP ---');
        services.forEach(s => {
            console.log(`Title: ${s.title}`);
            console.log(`VideoID: '${s.videoId}'`);
            console.log('---');
        });
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

checkServices();
