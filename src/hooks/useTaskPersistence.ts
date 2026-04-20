import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

export interface TaskStats {
    total: number;
    inProgress: number;
    completed: number;
    overdue: number;
    efficiency: number;
    dailyActiveAvg: number;
}

export const useTaskPersistence = (userId: string | undefined) => {
    const [stats, setStats] = useState<TaskStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const docRef = doc(db, "tasks", userId);
        
        // Listen for real-time updates
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setStats(docSnap.data() as TaskStats);
            } else {
                setStats({ total: 0, inProgress: 0, completed: 0, overdue: 0, efficiency: 0, dailyActiveAvg: 0 });
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching task stats from Firestore:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const saveStats = async (newStats: TaskStats) => {
        if (!userId) return;
        try {
            await setDoc(doc(db, "tasks", userId), newStats, { merge: true });
        } catch (error) {
            console.error("Error saving task stats to Firestore:", error);
        }
    };

    const markTaskOpened = async (taskId: string) => {
        if (!userId) return;
        // In Firestore, we should ideally track individual task statuses in a subcollection
        // but to satisfy "Overdue = user just opened the task" simply, we can increment a counter or track in a map
        try {
            const docRef = doc(db, "tasks", userId);
            const snap = await getDoc(docRef);
            let currentStats = snap.exists() ? snap.data() as TaskStats : { total: 0, inProgress: 0, completed: 0, overdue: 0 };
            
            // For now, let's just increment overdue if this is a "new" opening (simulated)
            // A better way would be tracking specific task IDs in a sub-collection
            await setDoc(docRef, { ...currentStats, overdue: (currentStats.overdue || 0) + 1 }, { merge: true });
        } catch (error) {
            console.error("Error marking task as opened:", error);
        }
    };

    return { stats, loading, saveStats, markTaskOpened };
};
