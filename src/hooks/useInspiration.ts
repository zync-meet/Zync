import { useState, useRef, useCallback } from 'react';
import { API_BASE_URL } from "@/lib/utils";

export interface DesignItem {
    id: string;
    source: string;
    title: string;
    image: string | null;
    link: string | null;
}

interface UseInspirationReturn {
    items: DesignItem[];
    loading: boolean;
    hasMore: boolean;
    loadMore: () => void;
    search: (query: string) => Promise<void>;
    reset: () => void;
}

const ITEMS_PER_PAGE = 15;

export const useInspiration = (): UseInspirationReturn => {

    const [allItems, setAllItems] = useState<DesignItem[]>([]);

    const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
    const [loading, setLoading] = useState(false);


    const processedIds = useRef<Set<string>>(new Set());

    const loadMore = useCallback(() => {

        setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, allItems.length));
    }, [allItems.length]);

    const reset = useCallback(() => {
        setAllItems([]);
        setDisplayCount(ITEMS_PER_PAGE);
        processedIds.current.clear();
    }, []);

    const search = useCallback(async (query: string) => {
        setLoading(true);
        reset();

        try {

            const response = await fetch(
                `${API_BASE_URL}/api/inspiration?q=${encodeURIComponent(query)}`
            );

            const data = await response.json();

            if (data.ok && Array.isArray(data.items)) {

                const uniqueItems = data.items.filter((item: DesignItem) => {
                    if (processedIds.current.has(item.id)) {return false;}
                    processedIds.current.add(item.id);
                    return true;
                });

                setAllItems(uniqueItems);
            }
        } catch (err) {
            console.error("Inspiration fetch failed:", err);
        } finally {
            setLoading(false);
        }
    }, [reset]);

    return {

        items: allItems.slice(0, displayCount),
        loading,

        hasMore: displayCount < allItems.length,
        loadMore,
        search,
        reset
    };
};
