"use client";

import { useEffect, useId, useRef, type FormEvent, type ReactNode } from "react";
import Icon from "./Icon";
import { Button, cx } from "./ui";

/**
 * Dialog modal berbasis <dialog> asli: fokus terkunci di dalam dialog, Esc menutup.
 * Isi bisa di-scroll; kepala dan tombol aksi tetap terlihat.
 */
export function FormDialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  onSubmit,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onSubmit?: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const body = (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 id={titleId} className="text-lg font-extrabold tracking-tight text-navy">
            {title}
          </h2>
          {description && <div className="mt-0.5 text-sm text-ink-2">{description}</div>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="-mr-1 grid size-10 shrink-0 place-items-center rounded-xl text-ink-2 hover:bg-page"
        >
          <Icon name="close" size={20} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
      {footer && (
        <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-white px-5 py-4">{footer}</div>
      )}
    </>
  );

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={cx(
        "m-auto max-h-[min(92dvh,860px)] w-[calc(100vw-24px)] overflow-hidden rounded-[20px] bg-white p-0 text-ink shadow-2xl",
        wide ? "max-w-[720px]" : "max-w-[520px]",
      )}
    >
      {open &&
        (onSubmit ? (
          <form
            noValidate
            className="flex max-h-[min(92dvh,860px)] flex-col"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            {body}
          </form>
        ) : (
          <div className="flex max-h-[min(92dvh,860px)] flex-col">{body}</div>
        ))}
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Hapus",
  danger = true,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
}) {
  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={title}
      onSubmit={onConfirm}
      footer={
        <>
          <Button onClick={onClose}>Batal</Button>
          <Button
            type="submit"
            variant={danger ? "primary" : "primary"}
            className={danger ? "!border-danger !bg-danger hover:!bg-red-800" : undefined}
            disabled={busy}
          >
            {busy ? "Memproses…" : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-[15px] text-ink-2">{message}</p>
    </FormDialog>
  );
}
