import { net } from 'electron';


const CONNECTIVITY_TIMEOUT_MS = 5000;


const CONNECTIVITY_CHECK_URL = 'https://www.google.com';


export async function isOnline(): Promise<boolean> {

    if (!net.isOnline()) {
        return false;
    }


    try {
        return await new Promise<boolean>((resolve) => {
            const request = net.request({
                method: 'HEAD',
                url: CONNECTIVITY_CHECK_URL,
            });

            const timeout = setTimeout(() => {
                request.abort();
                resolve(false);
            }, CONNECTIVITY_TIMEOUT_MS);

            request.on('response', () => {
                clearTimeout(timeout);
                resolve(true);
            });

            request.on('error', () => {
                clearTimeout(timeout);
                resolve(false);
            });

            request.end();
        });
    } catch {
        return false;
    }
}


export function isSafeUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}


export function getHostname(url: string): string | null {
    try {
        return new URL(url).hostname;
    } catch {
        return null;
    }
}
