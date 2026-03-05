import { API_BASE_URL } from '../lib/utils';
import { auth } from '../lib/firebase';
const API_URL = `${API_BASE_URL}/api/projects`;

export interface Project {
    _id: string;
    name: string;
    description: string;
    ownerId: string;
    steps: any[];
    createdAt: string;
    githubRepoName?: string;
    githubRepoOwner?: string;
}

export interface TaskSearchResult {
    id: string;
    title: string;
    projectId: string;
    projectName: string;
    status: string;
    stepName: string;
}

const getAuthHeaders = async () => {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const fetchProjects = async (userId: string): Promise<Project[]> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}?ownerId=${userId}`, { headers });
    if (!response.ok) {return [];}
    return response.json();
};

export const searchTasks = async (query: string, userId: string): Promise<TaskSearchResult[]> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/tasks/search?query=${encodeURIComponent(query)}&userId=${userId}`, { headers });
    if (!response.ok) {return [];}
    return response.json();
};

export const createQuickTask = async (projectId: string, title: string, description?: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/${projectId}/quick-task`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, description })
    });
    if (!response.ok) {throw new Error('Failed to create task');}
    return response.json();
};
