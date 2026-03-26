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
                    await fetch(`${API_BASE_URL}/api/users/sync`, {
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

                    // Prefetch essential data to populate the cache immediately
                    queryClient.prefetchQuery({
                        queryKey: ['me'],
                        queryFn: async () => {
                            const res = await fetch(`${API_BASE_URL}/api/users/me`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            return res.json();
                        }
                    });

                    // We don't prefetch GitHub data here yet because we don't know if they are connected
                    // But we can invalidate the 'me' query so that hooks using it will refetch
                    queryClient.invalidateQueries({ queryKey: ['me'] });

                } catch (error: any) {
                    console.error("Error syncing user data:", error);
                }
            }
        });

        return () => unsubscribe();
    }, [queryClient]);
};
