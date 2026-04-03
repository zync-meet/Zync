import type { User } from 'firebase/auth';
import type { NavigateFunction } from 'react-router-dom';
import { API_BASE_URL } from '@/lib/utils';

/** Show Welcome flow for accounts created within this window (first visit only). */
const NEW_USER_WINDOW_MS = 48 * 60 * 60 * 1000;

const welcomeDoneKey = (uid: string) => `zync_welcome_done_${uid}`;

async function fetchMeWithRetry(token: string, attempts = 5): Promise<Record<string, unknown> | null> {
    for (let i = 0; i < attempts; i++) {
        const res = await fetch(`${API_BASE_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            return (await res.json()) as Record<string, unknown>;
        }
        if (res.status === 404 && i < attempts - 1) {
            await new Promise((r) => setTimeout(r, 400 * (i + 1)));
            continue;
        }
        return null;
    }
    return null;
}

/**
 * After Firebase auth succeeds, send users to `/welcome` (new accounts) or `/dashboard`.
 * Retries `/me` briefly so Mongo upsert from `useUserSync` can finish.
 */
export async function postLoginRedirect(navigate: NavigateFunction, user: User): Promise<void> {
    try {
        const token = await user.getIdToken();
        const me = await fetchMeWithRetry(token);
        if (!me?.createdAt) {
            navigate('/dashboard', { replace: true });
            return;
        }
        const created = new Date(String(me.createdAt)).getTime();
        if (Number.isNaN(created)) {
            navigate('/dashboard', { replace: true });
            return;
        }
        const isFreshAccount = Date.now() - created < NEW_USER_WINDOW_MS;
        const done = typeof localStorage !== 'undefined' && localStorage.getItem(welcomeDoneKey(user.uid));

        if (isFreshAccount && !done) {
            navigate('/welcome', { replace: true });
        } else {
            navigate('/dashboard', { replace: true });
        }
    } catch {
        navigate('/dashboard', { replace: true });
    }
}

export function markWelcomeComplete(uid: string): void {
    try {
        localStorage.setItem(welcomeDoneKey(uid), '1');
    } catch {
        /* ignore */
    }
}
