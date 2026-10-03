"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { listEquipment } from "@/app/actions/equipment";
import { StatusMessage } from "@/components/feedback/StatusMessage";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { Equipment } from "@/types/equipment";

export function EquipmentDirectory() {
  const { user, loading, getIdToken } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    queueMicrotask(() => {
      setPending(true);
      void getIdToken().then(listEquipment).then((result) => {
        if (cancelled) return;
        if (result.ok) setEquipment(result.data);
        else setError(result.error);
        setPending(false);
      });
    });
    return () => { cancelled = true; };
  }, [getIdToken, loading, user]);

  if (loading) return <div aria-label="Loading equipment" className="h-52 animate-pulse rounded-lg bg-primary-tint" />;
  if (!user) {
    return (
      <div className="max-w-xl rounded-lg border border-border bg-surface p-6 md:p-8">
        <p className="text-body text-muted">Sign in with your Ahmedabad University account to view lab equipment.</p>
        <Button asChild className="mt-5"><Link href="/login?next=%2Fequipment">Sign in</Link></Button>
      </div>
    );
  }
  if (pending) return <div aria-label="Loading equipment" className="h-52 animate-pulse rounded-lg bg-primary-tint" />;
  if (error) return <StatusMessage status="error">{error}</StatusMessage>;
  if (equipment.length === 0) return <StatusMessage status="warning">No equipment has been added yet.</StatusMessage>;

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {equipment.map((item) => (
        <li key={item.equipmentId} className="rounded-lg border border-border bg-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-h4 text-ink">{item.name}</h2>
              <p className="mt-1 text-small text-muted">
                {[item.manufacturer, item.model].filter(Boolean).join(" · ") || "Manufacturer/model not listed in source"}
              </p>
              <p className="mt-1 text-small text-muted">{item.type || "Type not listed in source"}</p>
            </div>
            <span className="rounded-full bg-primary-tint px-3 py-1 text-xs font-medium text-primary">
              {item.status === "IN_USE" ? "IN USE" : item.status === "AVAILABLE" ? "AVAILABLE" : item.status}
            </span>
          </div>
          <p className="mt-3 text-small text-muted">Current status: {item.currentStatus || "Not listed in source"}</p>
          <p className="mt-2 break-all text-xs text-muted">Equipment ID: {item.equipmentId}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={`/equipment/${encodeURIComponent(item.equipmentId)}`}>View equipment &amp; QR</Link>
          </Button>
        </li>
      ))}
    </ul>
  );
}
