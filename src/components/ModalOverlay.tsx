import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { usePopupModalManager } from '@/hooks/usePopupModalManager.ts';

export function ModalOverlay() {
  const popupManager = usePopupModalManager();
  const shouldShowModal = popupManager.modals.length > 0;

  return createPortal(
    <AnimatePresence>
      {shouldShowModal && (
        <motion.div
          initial={{ backdropFilter: 'blur(0px)', opacity: 0 }}
          animate={{ backdropFilter: 'blur(10px)', opacity: 1 }}
          exit={{ backdropFilter: 'blur(0px)', opacity: 0, transition: { delay: 0.15 } }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-black/60"
        />
      )}
    </AnimatePresence>,
    document.getElementById('overlay') as HTMLDivElement,
  );
}
