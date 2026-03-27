import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/utils";

export const useUserSync = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const displayName = user.displayName || "";
                const parts = displayName.trim().split(" ");
                const firstName = parts[0] || "";
                const lastName = parts.slice(1).join(" ") || "";

                try {
                    const token = await user.getIdToken();
                    
                    // Sync user data with backend
                    const syncRes = await fetch(`${API_BASE_URL}/api/users/sync`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName,
                            photoURL: user.photoURL,
                            firstName,
                            lastName,
                        })
                    });
                    if (!syncRes.ok) {
                        throw new Error(`User sync failed: ${syncRes.status}`);
                    }

                    // Prefetch essential data (same query key as useMe)
                    await queryClient.prefetchQuery({
                        queryKey: ['me', user.uid],
                        queryFn: async () => {
                            const res = await fetch(`${API_BASE_URL}/api/users/me`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (!res.ok) {
                                if (res.status === 404) {return null;}
                                throw new Error('Failed to fetch user data');
                            }
                            const data = await res.json();
                            if (!data || typeof data !== 'object' || !data.uid) {
                                throw new Error('Invalid user data');
                            }
                            return data;
                        }
                    });

                    // We don't prefetch GitHub data here yet because we don't know if they are connected
                    // But we can invalidate the 'me' query so that hooks using it will refetch
                    queryClient.invalidateQueries({ queryKey: ['me'] });

                } catch (error: any) {
                    console.error("Error syncing user data:", error);
                    void queryClient.invalidateQueries({ queryKey: ['me'] });
                }
            }
        });

        return () => unsubscribe();
    }, [queryClient]);
};
