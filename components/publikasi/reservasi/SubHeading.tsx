"use client";

import type { ReactNode } from "react";

/** Judul tiap blok di section Reservasi. */
export function SubHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-2">
      <div className="min-w-0 flex-1 basis-[220px]">
        <h3 className="font-bold">{title}</h3>
        {description && <p className="mt-0.5 text-[13px] text-ink-2">{description}</p>}
      </div>
      {action}
    </div>
  );
}
