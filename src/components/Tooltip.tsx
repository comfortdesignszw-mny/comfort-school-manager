import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div 
      className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-gray-950 dark:bg-slate-900 border border-gray-800 dark:border-cyan-950/20 text-white text-[11px] rounded-md shadow-md whitespace-nowrap z-50 pointer-events-none font-medium tracking-wide text-center"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-950 dark:border-t-slate-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
