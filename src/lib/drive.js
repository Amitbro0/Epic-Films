import { google } from 'googleapis';
import path from 'path';

const KEY_FILE_PATH = path.join(process.cwd(), 'service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];

// User provided Folder ID
const FOLDER_ID = '1p3fosDRYFE5BuB_5hJiutCFKCeie-xH0';

let auth;
if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        auth = new google.auth.GoogleAuth({
            credentials,
            scopes: SCOPES,
        });
    } catch (e) {
        console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON", e);
    }
}

if (!auth) {
    auth = new google.auth.GoogleAuth({
        keyFile: KEY_FILE_PATH,
        scopes: SCOPES,
    });
}

const drive = google.drive({ version: 'v3', auth });

export async function uploadToDrive(filePath, filename, mimeType) {
    try {
        const response = await drive.files.create({
            requestBody: {
                name: filename,
                parents: [FOLDER_ID],
            },
            media: {
                mimeType: mimeType || 'application/octet-stream',
                body: (await import('fs')).createReadStream(filePath),
            },
            fields: 'id, webViewLink, webContentLink',
        });
        return response.data;
    } catch (error) {
        console.error('Drive Upload Error:', error);
        throw error;
    }
}

export async function deleteFromDrive(fileId) {
    try {
        await drive.files.delete({
            fileId: fileId,
        });
        return true;
    } catch (error) {
        console.error('Drive Delete Error:', error);
        return false;
    }
}

export async function getFileStream(fileId) {
    try {
        const response = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'stream' }
        );
        return response.data;
    } catch (error) {
        console.error('Drive Stream Error:', error);
        throw error;
    }
}
