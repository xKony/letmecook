"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useApp } from "@/lib/app-context";

/**
 * Props for the FlashcardZoomModal component.
 */
interface FlashcardZoomModalProps {
    /** The URL of the image to display in zoomed view. */
    zoomedImage: string | null;
    /** Callback to close the zoom modal. */
    onClose: () => void;
}

/**
 * Renders a full-screen modal for zooming into a flashcard image.
 * Uses Framer Motion for entrance/exit animations.
 * 
 * @param props - Component props.
 * @returns The rendered zoom modal or null.
 */
export function FlashcardZoomModal({
    zoomedImage,
    onClose,
}: FlashcardZoomModalProps) {
    const { t } = useApp();

    return (
        <AnimatePresence>
            {zoomedImage && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                    onClick={onClose}
                >
                    <motion.img
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        src={zoomedImage}
                        alt="Zoomed flashcard image"
                        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        aria-label={t("common.close")}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <p className="absolute bottom-4 text-white/50 text-sm">
                        {t("study.zoomHint")}
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
