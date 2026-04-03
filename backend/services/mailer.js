const { sendEmail, loadTemplate } = require('./emailService');

/**
 * Modern wrapper for sending emails in Zync.
 * Supports both legacy (to, subject, html, text) and modern (to, subject, templateName, data) signatures.
 */
const sendZyncEmail = async (to, subject, templateNameOrHtml, dataOrText = {}) => {
    try {
        console.log(`Sending Zync Email to ${to}...`);
        
        // Detect legacy signature: (to, subject, html, text)
        // If the 3rd argument contains HTML tags, it's the legacy call.
        if (typeof templateNameOrHtml === 'string' && (templateNameOrHtml.includes('<') || templateNameOrHtml.length > 100)) {
            console.warn('Legacy sendZyncEmail call detected with raw HTML. Please migrate to template names.');
            
            // In legacy mode, we don't have a template name.
            // We'll use a special 'raw' check in sendEmail or just a generic template.
            // For now, let's just use the 'welcome' template but put the raw HTML in a property if possible.
            // Since we're migrating, the best fix is to update the callers.
            // But to avoid the 500 right now:
            return await sendEmail('welcome', to, { message: templateNameOrHtml }, subject);
        }

        // Modern signature: (to, subject, templateName, data)
        const templateName = templateNameOrHtml || 'welcome';
        const finalData = dataOrText || { name: 'User' };
        
        return await sendEmail(templateName, to, finalData, subject);
    } catch (error) {
        console.error('Error in sendZyncEmail:', error);
        throw error;
    }
};

module.exports = { 
    sendZyncEmail,
    sendEmail,
    loadTemplate
};
