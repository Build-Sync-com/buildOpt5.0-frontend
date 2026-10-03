import { useEffect, useEffectEvent, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../Icon/Icon';

/**
 * SlideOver
 *
 * Panel that slides in from the right over a dimmed page, for details and
 * forms that shouldn't navigate away. Closes on Escape and the close button;
 * backdrop clicks close it too unless `closeOnBackdrop` is off (forms turn it
 * off so a stray click can't throw away what's been typed).
 */
type SlideOverProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: string;
  description?: ReactNode;
  /** `lg` gives forms with several columns more room. */
  size?: 'md' | 'lg';
  closeOnBackdrop?: boolean;
  /** Pinned below the scrolling body - form buttons, totals. */
  footer?: ReactNode;
  children: ReactNode;
};

function SlideOver({
  open,
  onClose,
  title,
  eyebrow,
  description,
  size = 'md',
  closeOnBackdrop = true,
  footer,
  children,
}: SlideOverProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const handleEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === 'Escape') onClose();
  });

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
      previousFocus?.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="animate-fade-in absolute inset-0 bg-gray-900/40"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`animate-slide-in-right absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl focus:outline-none ${
          size === 'lg' ? 'max-w-3xl' : 'max-w-xl'
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-5 sm:px-6">
          <div className="min-w-0">
            {eyebrow && <p className="text-sm font-semibold text-blue-600">{eyebrow}</p>}
            <h2 id={titleId} className="mt-1 text-xl font-bold tracking-tight text-gray-900">
              {title}
            </h2>
            {description && <div className="mt-1 text-sm text-gray-500">{description}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="-mr-2 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">{children}</div>

        {footer && (
          <div className="border-t border-gray-200 bg-gray-50 px-5 py-4 sm:px-6">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default SlideOver;
