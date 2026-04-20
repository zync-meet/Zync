import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
    doc, 
    setDoc, 
    updateDoc, 
    arrayUnion, 
    query, 
    collection, 
    where, 
    onSnapshot 
} from "firebase/firestore";

export interface TeamMetadata {
    id: string;
    name: string;
    leaderId: string;
    members: string[];
    inviteCode: string;
    logoId?: string;
}

export const useTeamPersistence = (userId: string | undefined) => {
    const [myTeams, setMyTeams] = useState<TeamMetadata[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        // Fetch teams where user is leader OR member
        const q = query(
            collection(db, "teams"),
            where("members", "array-contains", userId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const teams: TeamMetadata[] = [];
            snapshot.forEach((doc) => {
                teams.push({ id: doc.id, ...doc.data() } as TeamMetadata);
            });
            setMyTeams(teams);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching teams from Firestore:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const createTeamSync = async (teamId: string, name: string, leaderId: string, inviteCode: string, logoId?: string) => {
        try {
            await setDoc(doc(db, "teams", teamId), {
                name,
                leaderId,
                members: [leaderId],
                inviteCode,
                logoId: logoId || "rocket"
            });
        } catch (error) {
            console.error("Error syncing team to Firestore:", error);
        }
    };

    const joinTeamSync = async (inviteCode: string, userId: string) => {
        try {
            // Find team by invite code
            const q = query(collection(db, "teams"), where("inviteCode", "==", inviteCode));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                snapshot.forEach(async (teamDoc) => {
                    await updateDoc(doc(db, "teams", teamDoc.id), {
                        members: arrayUnion(userId)
                    });
                });
            });
            // Note: In a real production app, we'd use a server-side function or a one-time get
            // but for this sync logic, we'll keep it simple for now.
        } catch (error) {
            console.error("Error joining team in Firestore:", error);
        }
    };

    return { myTeams, loading, createTeamSync, joinTeamSync };
};
