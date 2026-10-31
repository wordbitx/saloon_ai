"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/components/dash/admin";

export type Entity = "chairs" | "staff" | "services" | "clients";

/** Generic tenant-scoped CRUD client (mutations admin-only, API bhi guard karti hai) */
export function useCrud<T extends { id: string }>(entity: Entity) {
  const { setDeniedMessage } = useAdmin();
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/crud/${entity}`, { cache: "no-store" });
      if (res.ok) {
        const d = await res.json();
        setRows(d.rows as T[]);
        setError(null);
      } else {
        setError("Data load nahi hua.");
      }
    } finally {
      setLoading(false);
    }
  }, [entity]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(
    async (payload: Record<string, unknown>, id?: string) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(`/api/crud/${entity}`, {
          method: id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, ...(id ? { id } : {}) }),
        });
        const d = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setDeniedMessage(d.note ?? "Admin login zaroori hai.");
          return { ok: false, message: "Admin login zaroori hai (Admin page → PIN 2468)." };
        }
        if (!res.ok) return { ok: false, message: d.message ?? d.error ?? "Save nahi hua." };
        await load();
        return { ok: true };
      } finally {
        setBusy(false);
      }
    },
    [entity, load, setDeniedMessage],
  );

  const remove = useCallback(
    async (id: string) => {
      setBusy(true);
      try {
        const res = await fetch(`/api/crud/${entity}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        const d = await res.json().catch(() => ({}));
        if (res.status === 401) return { ok: false, message: d.note ?? "Admin login zaroori hai." };
        if (!res.ok) return { ok: false, message: d.error ?? "Delete nahi hua." };
        await load();
        return { ok: true };
      } finally {
        setBusy(false);
      }
    },
    [entity, load],
  );

  return { rows, setRows, loading, busy, error, load, save, remove };
}