"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import { endEquipmentUsage, getEquipmentPage, startEquipmentUsage } from "@/app/actions/equipment";
import { StatusMessage } from "@/components/feedback/StatusMessage";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { Equipment, EquipmentProjectOption, EquipmentUsage } from "@/types/equipment";

type EquipmentPageClientProps = { equipmentId: string; equipmentUrl: string };

export function EquipmentPageClient({ equipmentId, equipmentUrl }: EquipmentPageClientProps) {
  const { user, loading, getIdToken } = useAuth();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [projects, setProjects] = useState<EquipmentProjectOption[]>([]);
  const [activeUsage, setActiveUsage] = useState<EquipmentUsage | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const result = await getEquipmentPage(await getIdToken(), equipmentId);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    setEquipment(result.data.equipment);
    setProjects(result.data.projects);
    setActiveUsage(result.data.activeUsage);
    setSeeded(result.data.seeded);
  }, [equipmentId, getIdToken]);

  useEffect(() => {
    if (!loading && user) queueMicrotask(() => { void refresh(); });
  }, [loading, refresh, user]);

  async function start() {
    setBusy(true);
    setError("");
    const result = await startEquipmentUsage(await getIdToken(), equipmentId, projectId);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      await refresh();
      return;
    }
    setActiveUsage(result.data);
    setEquipment((current) => current ? { ...current, status: "IN_USE" } : current);
  }

  async function end() {
    if (!activeUsage) return;
    setBusy(true);
    setError("");
    const result = await endEquipmentUsage(await getIdToken(), activeUsage.usageId);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      await refresh();
      return;
    }
    setActiveUsage(null);
    setEquipment((current) => current ? {
      ...current,
      status: current.currentStatus?.trim().toLowerCase() === "out of work" ? "MAINTENANCE" : "AVAILABLE",
    } : current);
  }

  if (loading) return <div aria-label="Loading equipment" className="h-52 animate-pulse rounded-lg bg-primary-tint" />;
  if (!user) {
    return (
      <div className="max-w-xl rounded-lg border border-border bg-surface p-6 md:p-8">
        <p className="text-body text-muted">Please sign in to start using this equipment.</p>
        <Button asChild className="mt-5"><Link href={`/login?next=${encodeURIComponent(`/equipment/${equipmentId}`)}`}>Sign in</Link></Button>
      </div>
    );
  }
  if (!equipment && !error) return <div aria-label="Loading equipment" className="h-52 animate-pulse rounded-lg bg-primary-tint" />;
  if (!equipment) return <StatusMessage status="error">{error || "Equipment not found."}</StatusMessage>;

  const unavailable = equipment.status === "MAINTENANCE" || equipment.status === "DISABLED" || !equipment.isActive;
  const inUse = equipment.status === "IN_USE";
  const canEnd = activeUsage?.userUid === user.uid;

  return (
    <div className="grid max-w-4xl gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <section className="rounded-lg border border-border bg-surface p-6 md:p-8">
        <p className="text-small font-medium text-primary">Equipment</p>
        <h2 className="mt-2 font-display text-h3 text-ink">{equipment.name}</h2>
        <dl className="mt-5 grid gap-3 text-small sm:grid-cols-2">
          <EquipmentValue label="Manufacturer" value={equipment.manufacturer} />
          <EquipmentValue label="Model" value={equipment.model} />
          <EquipmentValue label="Type" value={equipment.type} />
          <EquipmentValue label="Quantity" value={equipment.quantity?.toString()} />
          <EquipmentValue label="Current status" value={equipment.currentStatus} />
          <EquipmentValue label="Live status" value={inUse ? "IN_USE" : equipment.status} />
          <EquipmentValue label="Sr No." value={equipment.srNo?.toString()} />
          <EquipmentValue label="Maintenance partner" value={equipment.maintenancePartner} />
          <EquipmentValue label="Contact" value={equipment.contact} />
        </dl>
        {equipment.description && <p className="mt-4 text-body text-muted">{equipment.description}</p>}
        {equipment.detailsUrl && (
          <a href={equipment.detailsUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-small text-primary underline underline-offset-4">
            Equipment details
          </a>
        )}
        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary-tint px-3 py-1 text-small font-medium text-primary">
          <span aria-hidden="true" className={`size-2 rounded-full ${inUse ? "bg-warning" : unavailable ? "bg-muted" : "bg-success"}`} />
          {inUse ? "IN USE" : unavailable ? "UNAVAILABLE" : "AVAILABLE"}
        </p>

        {inUse && activeUsage && (
          <div className="mt-5 rounded-lg border border-border p-4">
            <p className="font-medium text-ink">Project: {activeUsage.projectTitle}</p>
            <p className="mt-1 text-small text-muted">Used by: {activeUsage.userName}</p>
            <p className="mt-1 text-small text-muted">Started: {formatTime(activeUsage.startedAt)}</p>
          </div>
        )}
        {inUse && !activeUsage && <p className="mt-4 text-small text-muted">This equipment is currently in use. Please wait until the session ends.</p>}

        {!seeded && <StatusMessage status="warning" className="mt-5">This equipment record has not been seeded in Firestore yet. Usage is disabled until then.</StatusMessage>}

        {seeded && !inUse && !unavailable && (
          <div className="mt-7">
            {projects.length === 0 ? (
              <StatusMessage status="warning">You need to be part of a project before using this equipment.</StatusMessage>
            ) : (
              <>
                <label htmlFor="equipment-project" className="text-small font-medium text-ink">Select Project</label>
                <select
                  id="equipment-project"
                  className="mt-2 block min-h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-small text-ink"
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                >
                  <option value="">Choose a project</option>
                  {projects.map((project) => <option key={project.projectId} value={project.projectId}>{project.title}</option>)}
                </select>
                <Button className="mt-4 w-full sm:w-auto" disabled={busy || !projectId} onClick={() => void start()}>
                  {busy ? "Starting…" : "Start Usage"}
                </Button>
              </>
            )}
          </div>
        )}
        {canEnd && (
          <Button variant="outline" className="mt-5 w-full sm:w-auto" disabled={busy} onClick={() => void end()}>
            {busy ? "Ending…" : "End Usage"}
          </Button>
        )}
        {error && <StatusMessage status="error" className="mt-5">{error}</StatusMessage>}
        <Button asChild variant="link" className="mt-5 px-0"><Link href="/equipment">All equipment</Link></Button>
      </section>

      <aside className="rounded-lg border border-border bg-surface p-5 text-center print:border-0">
        <h2 className="font-display text-h4">Equipment QR</h2>
        <div className="mx-auto mt-4 w-fit rounded-lg bg-white p-3">
          <QRCodeSVG value={equipmentUrl} size={256} level="M" includeMargin />
        </div>
        <p className="mt-3 font-medium text-ink">{equipment.name}</p>
        <p className="mt-1 text-xs text-muted">Equipment ID: {equipment.equipmentId}</p>
        <p className="mt-3 break-all text-xs text-muted">{equipmentUrl}</p>
        <Button variant="outline" className="mt-4 print:hidden" onClick={() => window.print()}>Print QR</Button>
      </aside>
    </div>
  );
}

function EquipmentValue({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{value || "Not listed in source"}</dd>
    </div>
  );
}

function formatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Time unavailable" : new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}
