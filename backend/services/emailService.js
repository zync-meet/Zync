const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { google } = require('googleapis');

/**
 * Email Service for Zync
 * Handles template loading, rendering with Handlebars, and sending via Gmail API.
 */

// Configuration
const TEMPLATES_DIR = path.join(__dirname, '../email template');

// Initialize OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

/**
 * Gets the logo URL for branding emails.
 * Using a public URL instead of Base64 to prevent Gmail from clipping content (>102KB).
 * @returns {string} Public URL of the logo
 */
const getLogoUrl = () => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://zync-meet.vercel.app';
    // Use the logo_white.jpeg which is small and looks good on dark backgrounds
    return `${frontendUrl}/logo_white.jpeg`;
};

/**
 * Register Handlebars Helpers/Partials if needed
 */
const logoUrl = getLogoUrl();
Handlebars.registerHelper('zyncLogo', () => logoUrl);

/**
 * Loads and renders an email template with dynamic data.
 * @param {string} templateName - Name of the template (e.g., 'welcome')
 * @param {object} data - Dynamic data to inject into placeholders
 * @returns {string} Rendered HTML content
 */
const loadTemplate = (templateName, data = {}) => {
    try {
        const filePath = path.join(TEMPLATES_DIR, `${templateName}.html`);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Template not found: ${templateName}`);
        }

        const templateSource = fs.readFileSync(filePath, 'utf-8');
        const template = Handlebars.compile(templateSource);

        // Add default data like logo and app details
        const templateData = {
            ...data,
            logo: logoUrl,
            year: new Date().getFullYear(),
            appUrl: process.env.FRONTEND_URL || 'https://zync-meet.vercel.app'
        };

        return template(templateData);
    } catch (error) {
        console.error(`Error loading template ${templateName}:`, error);
        throw error;
    }
};

/**
 * Sends an email using Gmail API with an access token or stored credentials.
 * @param {string} templateName - Name of the template file
 * @param {string} toEmail - Recipient email address
 * @param {object} data - Data for template placeholders
 * @param {string} subject - Email subject line
 * @param {string} accessToken - (Optional) OAuth2 access token from Playground
 */
const sendEmail = async (templateName, toEmail, data, subject, accessToken = null) => {
    try {
        console.log(`Preparing email "${templateName}" for ${toEmail}...`);

        // Load and render HTML
        const htmlContent = loadTemplate(templateName, data);

        // Configure credentials
        if (accessToken) {
            oauth2Client.setCredentials({ access_token: accessToken });
        } else if (process.env.GOOGLE_REFRESH_TOKEN) {
            oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
        } else {
            throw new Error('No Gmail credentials (access_token or refresh_token) provided.');
        }

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        // Construct standardized MIME raw email message
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const emailLines = [
            `To: ${toEmail}`,
            `Subject: ${utf8Subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            `Date: ${new Date().toUTCString()}`,
            '',
            Buffer.from(htmlContent).toString('base64')
        ];

        const rawMessage = emailLines.join('\r\n');

        // Base64url encode the entire message for Gmail API
        const encodedMessage = Buffer.from(rawMessage)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // Send via Gmail API
        const response = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });

        console.log(`Email sent successfully! ID: ${response.data.id}`);
        return response.data;
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
};

module.exports = {
    loadTemplate,
    sendEmail
};
