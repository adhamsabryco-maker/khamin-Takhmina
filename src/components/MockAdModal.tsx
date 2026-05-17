import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface MockAdModalProps {
  imageUrl: string | null;
  targetUrl?: string | null;
  onComplete: () => void;
  onDismissed?: () => void;
}

export const MockAdModal: React.FC<MockAdModalProps> = ({ imageUrl, targetUrl, onComplete, onDismissed }) => {
  const [timeLeft, setTimeLeft] = useState(5);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanClose(true);
    }
  }, [timeLeft]);

  const handleClose = () => {
    if (canClose) {
      onComplete();
    } else if (onDismissed) {
      onDismissed();
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center z-10 w-full max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleClose}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white border border-white/20 transition-all shadow-lg backdrop-blur-md"
            >
              <X className="w-5 h-5" />
            </button>
            {!canClose && (
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white font-black border border-white/20 backdrop-blur-md shadow-lg">
                {timeLeft}
              </div>
            )}
          </div>
          <div className="bg-white/10 text-white/90 text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md shadow-lg">
            إعلان ترويجي
          </div>
        </div>

        {/* Main Image Container */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
          onClick={() => {
            if (targetUrl) {
              window.open(targetUrl, '_blank');
            }
          }}
          style={{ cursor: targetUrl ? 'pointer' : 'default' }}
          className="relative w-full max-w-[320px] md:max-w-[400px] aspect-square rounded-3xl overflow-hidden shadow-2xl mt-8 ring-1 ring-white/10"
        >
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Ad" 
              className="w-full h-full object-contain bg-black/40"
              onError={(e) => {
                 (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
          ) : (
            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
               <img src="/logo.png" className="w-32 h-32 opacity-20" alt="logo" />
            </div>
          )}
          
          {/* Progress Bar overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50">
            <motion.div 
              className="h-full bg-accent-orange"
              initial={{ width: '0%' }}
              animate={{ width: canClose ? '100%' : `${((5 - timeLeft) / 5) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>
        </motion.div>
        
        {/* Call to action text below image */}
        <div className="mt-8 text-white text-center opacity-80 text-sm font-bold">
          {canClose ? (
            <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
              شكرًا لك! أغلق الإعلان لاستلام المكافأة 🎁
            </motion.p>
          ) : (
            <p>يرجى الانتظار للحصول على المكافأة...</p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
