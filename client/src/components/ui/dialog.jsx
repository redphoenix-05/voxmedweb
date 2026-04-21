import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function Dialog({ open, onClose, children }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => e.target === overlayRef.current && onClose?.()}
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-50 w-full max-w-lg max-h-[85vh] overflow-auto rounded-xl bg-card p-6 shadow-lg border animate-in fade-in-0 zoom-in-95">
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, children, ...props }) {
  return <div className={cn('flex flex-col space-y-1.5 mb-4', className)} {...props}>{children}</div>;
}

export function DialogTitle({ className, children, ...props }) {
  return <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props}>{children}</h2>;
}

export function DialogFooter({ className, children, ...props }) {
  return <div className={cn('flex justify-end gap-2 mt-6', className)} {...props}>{children}</div>;
}
