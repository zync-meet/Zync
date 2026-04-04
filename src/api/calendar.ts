import { API_BASE_URL } from '../lib/utils';
import { auth } from '../lib/firebase';

const API_URL = `${API_BASE_URL}/api/calendar`;

export interface Holiday {
    date: string;
    localName: string;
    name: string;
    countryCode: string;
    fixed: boolean;
    global: boolean;
    types: string[];
}

export interface Country {
    countryCode: string;
    name: string;
}

const getAuthHeaders = async () => {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
};

export const fetchHolidays = async (year: number, countryCode: string): Promise<Holiday[]> => {
    const headers = await getAuthHeaders();
    const response = await fetch(
        `${API_URL}/holidays?year=${year}&countryCode=${encodeURIComponent(countryCode)}`,
        { headers },
    );
    if (!response.ok) {
        console.error('Failed to fetch holidays:', response.status);
        return [];
    }
    return response.json();
};

export const fetchCountries = async (): Promise<Country[]> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/countries`, { headers });
    if (!response.ok) {
        console.error('Failed to fetch countries:', response.status);
        return [];
    }
    return response.json();
};
