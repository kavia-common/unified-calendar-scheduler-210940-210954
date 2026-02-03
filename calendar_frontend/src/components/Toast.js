import React from "react";

// PUBLIC_INTERFACE
export function ToastStack({ toasts }) {
  /** Render a stack of toast notifications. */
  return (
    <div className="ToastWrap" aria-live="polite" aria-relevant="additions removals">
      {toasts.map((t) => (
        <div key={t.id} className="Toast" role="status">
          <p className="ToastTitle">{t.title}</p>
          <p className="ToastBody">{t.message}</p>
        </div>
      ))}
    </div>
  );
}
