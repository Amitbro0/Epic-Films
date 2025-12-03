import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

const KEY_FILE_PATH = path.join(process.cwd(), 'service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const FOLDER_ID = '1p3fosDRYFE5BuB_5hJiutCFKCeie-xH0';

async function testUpload() {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: KEY_FILE_PATH,
            scopes: SCOPES,
        });
        const drive = google.drive({ version: 'v3', auth });

        // Create a dummy file
        const testFilePath = path.join(process.cwd(), 'test_upload.txt');
        fs.writeFileSync(testFilePath, 'Hello Google Drive! This is a test upload.');

        console.log(`Attempting to upload to folder: ${FOLDER_ID}...`);

        const response = await drive.files.create({
            requestBody: {
                name: 'test_upload.txt',
                parents: [FOLDER_ID],
            },
            media: {
                mimeType: 'text/plain',
                body: fs.createReadStream(testFilePath),
            },
            fields: 'id, name',
        });

        console.log('✅ Upload Success!');
        console.log('File ID:', response.data.id);

        // Cleanup
        fs.unlinkSync(testFilePath);

    } catch (error) {
        console.error('❌ Upload Failed:', error.message);
        if (error.response) {
            console.error('API Error:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testUpload();
