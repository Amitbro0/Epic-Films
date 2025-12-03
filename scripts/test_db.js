import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

console.log('Testing MongoDB Connection...');
console.log('URI:', MONGODB_URI ? MONGODB_URI.replace(/:([^:@]+)@/, ':****@') : 'Undefined');

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing!');
    process.exit(1);
}

import SiteConfig from '../src/models/SiteConfig.js';

// ... (connection code)

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ MongoDB Connected Successfully!');

        try {
            console.log('Testing SiteConfig Model...');
            const config = await SiteConfig.findOne();
            console.log('✅ SiteConfig Query Success:', config ? 'Found' : 'Not Found');
            process.exit(0);
        } catch (err) {
            console.error('❌ Model Query Failed:', err);
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Failed:', err.message);
        process.exit(1);
    });
