"use client";

import { useEffect, useId, useRef } from "react";

/**
 * Bottom sheet on phone, centered 480px dialog on laptop (HANDOFF 16).
 * Native <dialog>: focus trap, Esc to close, scrim via ::backdrop.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // A tap on the scrim (the dialog box itself, outside the panel) closes it.
        if (e.target === e.currentTarget) onClose();
      }}
      className={
        "m-0 mt-auto w-full max-w-none bg-transparent p-0 text-paper " +
        "lg:m-auto lg:w-[480px]"
      }
    >
      <div
        className={
          "flex flex-col gap-4 rounded-t-md bg-surface px-4 pt-6 pb-8 " +
          "lg:rounded-md lg:p-8"
        }
      >
        <span aria-hidden className="mx-auto -mt-2 h-1 w-10 rounded-sm bg-line lg:hidden" />
        <h2 id={titleId} className="font-display text-title font-extrabold">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
