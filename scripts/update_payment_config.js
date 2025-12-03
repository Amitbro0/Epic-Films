const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
const SiteConfig = require('../src/models/SiteConfig');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

async function updateConfig() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const config = await SiteConfig.findOne();
        if (config) {
            config.paymentConfig.manualPayment = {
                enabled: true,
                upiId: '9939064764@ibl',
                qrCode: 'https://drive.google.com/file/d/1R58G4ggil_6KsD-Pw3a3B7O3cFND-0ft/view?usp=drive_link',
                instructions: 'Scan the QR code or use the UPI ID to pay. Enter the Transaction ID below.'
            };

            // Also update contact UPI just in case
            if (config.contact) {
                config.contact.upiId = '9939064764@ibl';
            }

            await config.save();
            console.log('Payment config updated successfully!');
        } else {
            console.log('No SiteConfig found to update.');
        }

    } catch (error) {
        console.error('Error updating config:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

updateConfig();
