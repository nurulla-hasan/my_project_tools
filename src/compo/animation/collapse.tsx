
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

interface CollapseProps {
    isOpen: boolean;
    children: ReactNode;
    className?: string;
}

export const Collapse = ({ isOpen, children, className }: CollapseProps) => {
    return (
        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.98, y: -5 }}
                    animate={{ opacity: 1, height: "auto", scale: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, scale: 0.98, y: -5 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className={`overflow-hidden origin-top ${className || ""}`}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
