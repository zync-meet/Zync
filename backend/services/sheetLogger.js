const { google } = require('googleapis');
const path = require('path');

// Configuration
const SPREADSHEET_ID = '1dSLg9N40XzLgPxogA-sHyFXhN3GL5MVWcoxxnvVug7E';
// Adjust path to point to root of the project where google.sheets.json is located
// Assuming this script runs from backend/services/ or backend/
const KEY_FILE_PATH = path.join(__dirname, '../../google.sheets.json');

/**
 * Authenticate with Google Sheets API using Service Account
 */
const getAuth = () => {
    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_FILE_PATH,
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
            range: 'Sheet1!A:C', // Adjust Sheet name and range as needed
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
