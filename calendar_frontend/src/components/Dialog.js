import React, { useEffect } from "react";

// PUBLIC_INTERFACE
export function Dialog({ title, isOpen, onClose, children }) {
  /** Accessible dialog with backdrop; closes on ESC/backdrop click. */
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="DialogBackdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="Dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="DialogHeader">
          <h3>{title}</h3>
          <button className="Btn" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="DialogBody">{children}</div>
      </div>
    </div>
  );
}
