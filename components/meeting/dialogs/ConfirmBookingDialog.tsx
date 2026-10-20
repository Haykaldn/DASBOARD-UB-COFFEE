"use client";

import { useState } from "react";
import type { Booking } from "@/lib/types";
import { FormDialog } from "../../Dialog";
import { Button, Field, inputCls } from "../../ui";
import { Summary, WaButton } from "./BookingSummary";

export function ConfirmBookingDialog({
  booking,
  onClose,
  onSubmit,
}: {
  booking: Booking | null;
  onClose: () => void;
  onSubmit: (note: string) => Promise<boolean>;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Booking | null>(null);

  const close = () => {
    setNote("");
    setDone(null);
    onClose();
  };

  const b = done ?? booking;
  if (!b) return null;

  return (
    <FormDialog
      open
      onClose={close}
      title={done ? "Booking dikonfirmasi" : "Konfirmasi booking"}
      description={done ? "Kabari pemesan lewat WhatsApp." : "Periksa data sebelum mengonfirmasi."}
      onSubmit={
        done
          ? undefined
          : async () => {
              setBusy(true);
              const ok = await onSubmit(note.trim());
              setBusy(false);
              if (ok) setDone({ ...b, status: "CONFIRMED", adminNote: note.trim() });
            }
      }
      footer={
        done ? (
          <>
            <Button onClick={close}>Tutup</Button>
            <WaButton b={done} />
          </>
        ) : (
          <>
            <Button onClick={close}>Batal</Button>
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? "Menyimpan…" : "Konfirmasi"}
            </Button>
          </>
        )
      }
    >
      <Summary b={b} />
      {!done && (
        <div className="mt-4">
          <Field label="Catatan admin" optional hint="Ikut dikirim di pesan WhatsApp ke pemesan.">
            {(id, d) => (
              <textarea
                id={id}
                aria-describedby={d}
                rows={3}
                maxLength={300}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: Proyektor sudah kami siapkan."
                className={`${inputCls} py-2.5`}
              />
            )}
          </Field>
        </div>
      )}
    </FormDialog>
  );
}
