import { useEffect } from "react";
import { auth } from "@/lib/firebase";

import { API_BASE_URL } from "@/lib/utils";

export const useUserSync = () => {
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {

                const displayName = user.displayName || "";
                const parts = displayName.trim().split(" ");
                const firstName = parts[0] || "";
                const lastName = parts.slice(1).join(" ") || "";

                try {
                    const token = await user.getIdToken();
                    const controller = new AbortController();


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
                        }),
                        signal: controller.signal
                    });
                } catch (error: any) {
                    if (error.name === 'AbortError') {return;}
                    console.error("Error syncing user data:", error);
                }
            }
        });

        return () => unsubscribe();
    }, []);
};
