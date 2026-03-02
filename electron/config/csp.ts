export const CONTENT_SECURITY_POLICY: Record<string, string[]> = {

    'script-src': ["'self'", "'unsafe-inline'", 'https://apis.google.com', 'https://www.googleapis.com'],


    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],


    'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],


    'img-src': ["'self'", 'data:', 'https:', 'blob:'],


    'connect-src': [
        "'self'",
        'https://*.firebaseio.com',
        'https://*.googleapis.com',
        'https://*.firebase.google.com',
        'wss://*.firebaseio.com',
        'https://identitytoolkit.googleapis.com',
        'https://securetoken.googleapis.com',
        'https://api.github.com',
        'https://github.com',
    ],


    'frame-src': ["'self'", 'https://*.firebaseapp.com', 'https://*.google.com', 'https://github.com'],


    'media-src': ["'self'", 'blob:'],


    'default-src': ["'self'"],


    'object-src': ["'none'"],


    'base-uri': ["'self'"],


    'form-action': ["'self'"],


    'frame-ancestors': ["'none'"],
};


export function buildCSPString(): string {
    return Object.entries(CONTENT_SECURITY_POLICY)
        .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
        .join('; ');
}


export const DEV_CONTENT_SECURITY_POLICY: Record<string, string[]> = {
    ...CONTENT_SECURITY_POLICY,
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://apis.google.com', 'https://www.googleapis.com'],
    'connect-src': [
        ...CONTENT_SECURITY_POLICY['connect-src'],
        'ws://localhost:*',
        'http://localhost:8081',
        'http://localhost:5000',
    ],
};


export function buildDevCSPString(): string {
    return Object.entries(DEV_CONTENT_SECURITY_POLICY)
        .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
        .join('; ');
}
