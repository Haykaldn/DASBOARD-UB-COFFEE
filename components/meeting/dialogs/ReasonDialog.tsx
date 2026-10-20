"use client";

import { useState } from "react";
import { formatDateLong, hhmm } from "@/lib/format";
import type { Booking } from "@/lib/types";
import { FormDialog } from "../../Dialog";
import { Button, Field, inputCls } from "../../ui";

/** Tolak / batalkan booking (dengan alasan), atau hapus blokir jadwal. */
export function ReasonDialog({
  booking,
  mode,
  onClose,
  onSubmit,
}: {
  booking: Booking | null;
  mode: "reject" | "cancel";
  onClose: () => void;
  onSubmit: (reason: string) => Promise<boolean>;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!booking) return null;

  const isBlock = booking.isInternal;
  const required = mode === "reject";
  const title = mode === "reject" ? "Tolak booking" : isBlock ? "Hapus blokir jadwal" : "Batalkan booking";
  const close = () => {
    setReason("");
    setError(null);
    onClose();
  };

  return (
    <FormDialog
      open
      onClose={close}
      title={title}
      description={
        isBlock ? "Slot akan terbuka lagi untuk booking dari website." : `${booking.name} · ${booking.code}`
      }
      onSubmit={async () => {
        if (required && reason.trim().length < 5) {
          setError("Alasan wajib diisi (minimal 5 karakter).");
          return;
        }
        setBusy(true);
        const ok = await onSubmit(reason.trim());
        setBusy(false);
        if (ok) close();
      }}
      footer={
        <>
          <Button onClick={close}>Kembali</Button>
          <Button type="submit" variant="primary" className="!border-danger !bg-danger hover:!bg-red-800" disabled={busy}>
            {busy ? "Menyimpan…" : mode === "reject" ? "Tolak" : isBlock ? "Hapus blokir" : "Batalkan booking"}
          </Button>
        </>
      }
    >
      {!isBlock && (
        <p className="mb-4 text-sm text-ink-2">
          {formatDateLong(booking.date)} · {hhmm(booking.start)} – {hhmm(booking.end)} · {booking.pax} orang
        </p>
      )}
      {!isBlock && (
        <Field
          label={mode === "reject" ? "Alasan penolakan" : "Alasan pembatalan"}
          optional={!required}
          hint="Disampaikan ke pemesan lewat WhatsApp."
          error={error}
        >
          {(id, d) => (
            <textarea
              id={id}
              aria-describedby={d}
              aria-invalid={!!error}
              rows={3}
              maxLength={300}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              className={`${inputCls} py-2.5`}
            />
          )}
        </Field>
      )}
      {isBlock && (
        <p className="text-[15px] text-ink-2">
          Hapus blokir “{booking.purpose}” pada {formatDateLong(booking.date)}, {hhmm(booking.start)} – {hhmm(booking.end)}?
        </p>
      )}
    </FormDialog>
  );
}
