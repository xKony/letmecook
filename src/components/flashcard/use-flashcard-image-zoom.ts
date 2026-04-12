"use client";

import { useEffect } from "react";

/**
 * Hook to manage flashcard image zoom state and keyboard handlers.
 * 
 * @param zoomedImage - The current zoomed image URL or null.
 * @param setZoomedImage - State setter for zoomed image.
 */
export function useFlashcardImageZoom(
    zoomedImage: string | null,
    setZoomedImage: (url: string | null) => void
) {
    // Close zoom modal on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && zoomedImage) {
                setZoomedImage(null);
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [zoomedImage, setZoomedImage]);

    return {
        isZoomed: !!zoomedImage,
        closeZoom: () => setZoomedImage(null),
        openZoom: (url: string) => setZoomedImage(url),
    };
}
