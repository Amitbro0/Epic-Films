import { google } from 'googleapis';
import path from 'path';

const KEY_FILE_PATH = path.join(process.cwd(), 'service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const FOLDER_ID = '1p3fosDRYFE5BuB_5hJiutCFKCeie-xH0';

async function verify() {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: KEY_FILE_PATH,
            scopes: SCOPES,
        });
        const drive = google.drive({ version: 'v3', auth });

        console.log(`Checking access to folder: ${FOLDER_ID}...`);

        const res = await drive.files.get({
            fileId: FOLDER_ID,
            fields: 'name, capabilities'
        });

        console.log('Success! Folder Name:', res.data.name);
        console.log('Can Add Children:', res.data.capabilities.canAddChildren);

        if (res.data.capabilities.canAddChildren) {
            console.log('✅ Service Account has WRITE access.');
        } else {
            console.log('❌ Service Account has READ-ONLY access. Please give "Editor" role.');
        }

    } catch (error) {
        console.error('❌ Access Failed:', error.message);
        if (error.code === 404) {
            console.error('Reason: Folder not found. Either ID is wrong OR Service Account cannot see it (Not Shared).');
        }
    }
}

verify();
