require('dotenv').config();
const { google } = require('googleapis');

// Configuration
const SPREADSHEET_ID = '1dSLg9N40XzLgPxogA-sHyFXhN3GL5MVWcoxxnvVug7E';

/**
 * Authenticate with Google Sheets API using environment variables
 * Required env vars: GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY
 */
const getAuth = () => {
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
        throw new Error(
            'Missing GOOGLE_SHEETS_CLIENT_EMAIL or GOOGLE_SHEETS_PRIVATE_KEY in .env'
        );
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines from .env
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return auth;
};

/**
 * Append a row to the Google Sheet
 * @param {string} name - User's name
 * @param {string} email - User's email
 * @param {string} date - Registration date (defaults to now)
 */
const appendRow = async (name, email, date = new Date().toISOString()) => {
    try {
        const auth = getAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        const request = {
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A:C', // Adjust sheet name and range as needed
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[name, email, date]],
            },
        };

        const response = await sheets.spreadsheets.values.append(request);
        console.log('Row appended successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error appending row to Google Sheet:', error);
        throw error;
    }
};

// Example usage if run directly
if (require.main === module) {
    const args = process.argv.slice(2);
    const name = args[0] || 'Test User';
    const email = args[1] || 'test@example.com';

    appendRow(name, email)
        .then(() => console.log('Done.'))
        .catch(err => console.error('Failed:', err));
}

module.exports = { appendRow };
