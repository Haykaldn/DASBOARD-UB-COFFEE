"use client";

import type { ReactNode } from "react";
import { isPast, statusLabel, statusTone } from "@/lib/booking";
import { formatDateTime } from "@/lib/format";
import type { Booking } from "@/lib/types";
import { FormDialog } from "../../Dialog";
import { Button, StatusChip } from "../../ui";
import { Summary, WaButton } from "./BookingSummary";

export function DetailDialog({
  booking,
  onClose,
  onConfirm,
  onReject,
  onCancel,
  onMark,
}: {
  booking: Booking | null;
  onClose: () => void;
  onConfirm: () => void;
  onReject: () => void;
  onCancel: () => void;
  onMark: (to: "COMPLETED" | "NO_SHOW") => void;
}) {
  if (!booking) return null;
  const b = booking;
  const past = isPast(b);

  let actions: ReactNode = <Button onClick={onClose}>Tutup</Button>;
  if (b.status === "PENDING") {
    actions = (
      <>
        <Button variant="danger" onClick={onReject}>
          Tolak
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          Konfirmasi
        </Button>
      </>
    );
  } else if (b.status === "CONFIRMED" && b.isInternal) {
    actions = (
      <>
        <Button onClick={onClose}>Tutup</Button>
        <Button variant="danger" onClick={onCancel}>
          Hapus blokir
        </Button>
      </>
    );
  } else if (b.status === "CONFIRMED") {
    actions = (
      <>
        <Button variant="danger" onClick={onCancel}>
          Batalkan
        </Button>
        <Button onClick={() => onMark("NO_SHOW")} disabled={!past}>
          Tidak Hadir
        </Button>
        <Button onClick={() => onMark("COMPLETED")} disabled={!past}>
          Tandai Selesai
        </Button>
        <WaButton b={b} label="Kirim WA" />
      </>
    );
  } else if (!b.isInternal && (b.status === "REJECTED" || b.status === "CANCELLED")) {
    actions = (
      <>
        <Button onClick={onClose}>Tutup</Button>
        <WaButton b={b} label="Kirim WA" />
      </>
    );
  }

  return (
    <FormDialog
      open
      onClose={onClose}
      wide
      title={b.isInternal ? "Detail blokir jadwal" : "Detail booking"}
      description={<StatusChip tone={statusTone(b)}>{statusLabel(b)}</StatusChip>}
      footer={actions}
    >
      <Summary b={b} />
      {b.status === "CONFIRMED" && !b.isInternal && !past && (
        <p className="mt-3 text-[13px] text-ink-3">
          “Tandai Selesai” dan “Tidak Hadir” aktif setelah jadwal berakhir.
        </p>
      )}
      {b.adminNote && (
        <div className="mt-4">
          <h3 className="mb-1 text-sm font-semibold">Catatan admin</h3>
          <p className="text-sm break-words text-ink-2">{b.adminNote}</p>
        </div>
      )}
      <div className="mt-5">
        <h3 className="mb-2 text-sm font-semibold">Riwayat status</h3>
        <ol className="space-y-3 border-l-2 border-line pl-4">
          {b.history
            .slice()
            .reverse()
            .map((h, i) => (
              <li key={i} className="relative text-sm">
                <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-sidebar-active" aria-hidden="true" />
                <p className="font-semibold">{h.label}</p>
                <p className="text-[13px] text-ink-3">
                  {formatDateTime(h.at)} · {h.by}
                </p>
                {h.note && <p className="mt-0.5 break-words text-ink-2">{h.note}</p>}
              </li>
            ))}
        </ol>
      </div>
    </FormDialog>
  );
}
