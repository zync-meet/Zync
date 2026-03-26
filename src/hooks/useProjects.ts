import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/utils";
import { auth } from "@/lib/firebase";

export interface Project {
  _id: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: string;
  githubRepoName?: string;
  githubRepoOwner?: string;
  isTrackingActive?: boolean;
}

const fetchProjects = async (userId: string): Promise<Project[]> => {
    const user = auth.currentUser;
    const token = await user?.getIdToken();
    const response = await fetch(`${API_BASE_URL}/api/projects?userId=${userId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {throw new Error('Failed to fetch projects');}
    return response.json();
};

export const useProjects = () => {
    const user = auth.currentUser;
    return useQuery<Project[]>({
        queryKey: ['projects', user?.uid],
        queryFn: () => fetchProjects(user?.uid || ""),
        enabled: !!user,
    });
};

export const useProjectMutations = () => {
    const queryClient = useQueryClient();

    const createProjectMutation = useMutation({
        mutationFn: async (data: any) => {
            const user = auth.currentUser;
            const token = await user?.getIdToken();
            const response = await fetch(`${API_BASE_URL}/api/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data),
            });
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });

    const linkGitHubMutation = useMutation({
        mutationFn: async ({ projectId, repoData }: { projectId: string; repoData: any }) => {
            const user = auth.currentUser;
            const token = await user?.getIdToken();
            const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/link-github`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(repoData),
            });
            return response.json();
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
    });

    const deleteProjectMutation = useMutation({
        mutationFn: async (projectId: string) => {
            const user = auth.currentUser;
            const token = await user?.getIdToken();
            await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });

    return {
        createProject: createProjectMutation.mutateAsync,
        linkGitHub: linkGitHubMutation.mutateAsync,
        deleteProject: deleteProjectMutation.mutateAsync,
        isCreating: createProjectMutation.isPending,
        isLinking: linkGitHubMutation.isPending,
        isDeleting: deleteProjectMutation.isPending,
    };
};
