"use client";

import { useEffect, useState } from "react";
import { collection, getFirestore, onSnapshot, query, where } from "firebase/firestore";

import { StatusMessage } from "@/components/feedback/StatusMessage";
import { getFirebaseApp } from "@/lib/firebase/client";
import { formatDateTime } from "@/lib/format";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { EquipmentUsage } from "@/types/equipment";

export function ProjectEquipmentUsage({ projectId }: { projectId: string }) {
  const { user, loading } = useAuth();
  const [sessions, setSessions] = useState<EquipmentUsage[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    const usageQuery = query(
      collection(getFirestore(getFirebaseApp()), "equipmentUsage"),
      where("projectId", "==", projectId),
    );
    return onSnapshot(usageQuery, (snapshot) => {
      const rows = snapshot.docs.map((document) => {
        const data = document.data();
        const timestamp = (value: unknown) => {
          if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
            return value.toDate().toISOString();
          }
          return "";
        };
        return {
          usageId: document.id,
          equipmentId: String(data.equipmentId ?? ""),
          equipmentName: String(data.equipmentName ?? "Equipment"),
          userUid: String(data.userUid ?? ""),
          userName: String(data.userName ?? "Student"),
          projectId: String(data.projectId ?? projectId),
          projectTitle: String(data.projectTitle ?? ""),
          status: data.status === "COMPLETED" ? "COMPLETED" : data.status === "ACTIVE" ? "ACTIVE" : "RECORDED",
          startedAt: timestamp(data.startedAt),
          ...(typeof data.usageNumber === "number" ? { usageNumber: data.usageNumber } : {}),
          ...(data.endedAt ? { endedAt: timestamp(data.endedAt) } : {}),
        } satisfies EquipmentUsage;
      });
      rows.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
      setSessions(rows);
      setError(false);
    }, () => setError(true));
  }, [loading, projectId, user]);

  const recentUses = sessions.slice(0, 10);

  return (
    <section aria-labelledby="equipment-usage-heading" className="mt-8 rounded-lg border border-border bg-surface p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="equipment-usage-heading" className="font-display text-h4">Live Equipment Usage</h2>
          <p className="mt-1 text-small text-muted">Use records for this project update live.</p>
        </div>
        {user ? (
          <span className="inline-flex items-center gap-2 text-xs font-medium text-success"><span aria-hidden="true" className="size-2 rounded-full bg-success" />LIVE</span>
        ) : (
          <span className="text-xs text-muted">Sign in to view live sessions</span>
        )}
      </div>

      {!user && <p className="mt-5 text-small text-muted">Project details are public. Live equipment sessions are available to signed-in university users.</p>}
      {error && <StatusMessage status="warning" className="mt-4">Live equipment updates are temporarily unavailable.</StatusMessage>}
      {!error && recentUses.length === 0 && <p className="mt-5 text-small text-muted">No equipment uses have been recorded for this project.</p>}
      {recentUses.length > 0 && (
        <div className="mt-6 border-t border-border pt-5">
          <h3 className="font-medium text-ink">Recorded uses ({sessions.length})</h3>
          <ul className="mt-2 divide-y divide-border">
            {recentUses.map((session) => (
              <li key={session.usageId} className="py-3 text-small">
                <p className="font-medium text-ink">{session.equipmentName}{session.usageNumber ? ` · Use #${session.usageNumber}` : ""}</p>
                <p className="mt-1 text-muted">Used by {session.userName} · {formatDateTime(session.startedAt)}</p>
                {session.endedAt && <p className="mt-1 text-muted">Ended {formatDateTime(session.endedAt)}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
