"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BoxIcon, CheckCircle2Icon, Clock3Icon, RotateCcwIcon, SearchIcon } from "lucide-react";

import { borrowInventoryItem, getInventoryData, returnInventoryItem, updateInventoryStock } from "@/app/actions/inventory";
import { Container } from "@/components/layout/Container";
import { StatusMessage } from "@/components/feedback/StatusMessage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { formatDateTime } from "@/lib/format";
import { InventoryItemImage } from "@/components/sections/InventoryItemImage";
import type { InventoryItem, InventoryLoan } from "@/types/inventory";

type Props = { initialItems: InventoryItem[] };

function stockState(item: InventoryItem) {
  if (!item.borrowable) return { text: "Lab use only", variant: "secondary" as const };
  if (item.stockNeedsReview) return { text: "Stock check needed", variant: "warning" as const };
  if (!item.availableQuantity) return { text: "Out of stock", variant: "destructive" as const };
  return { text: `${item.availableQuantity} available`, variant: "success" as const };
}

export function InventoryBorrowing({ initialItems }: Props) {
  const { user, loading, getIdToken } = useAuth();
  const [items, setItems] = useState(initialItems);
  const [loans, setLoans] = useState<InventoryLoan[]>([]);
  const [projects, setProjects] = useState<{ projectId: string; title: string }[]>([]);
  const [projectId, setProjectId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [stockValues, setStockValues] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    const result = await getInventoryData(user ? await getIdToken() : null);
    if (!result.ok) { setError(result.error); return; }
    setError(""); setItems(result.data.items); setLoans(result.data.loans); setProjects(result.data.projects); setIsAdmin(result.data.isAdmin);
    setProjectId((current) => result.data.projects.some((project) => project.projectId === current) ? current : result.data.projects[0]?.projectId ?? "");
  }, [getIdToken, user]);
  useEffect(() => { if (!loading) queueMicrotask(() => { void refresh(); }); }, [loading, refresh]);
  useEffect(() => {
    if (loading) return;
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 30_000);
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, [loading, refresh]);

  const categories = useMemo(() => ["All categories", ...Array.from(new Set(items.map((item) => item.category))).sort(),], [items]);
  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    return items.filter((item) => (category === "All categories" || item.category === category)
      && (!q || [item.name, item.category, item.description, item.sourceReference].some((value) => value.toLocaleLowerCase().includes(q))))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [category, items, search]);
  const active = loans.filter((loan) => loan.status === "BORROWED" || loan.status === "APPROVED");
  const returned = loans.filter((loan) => loan.status === "RETURNED");

  async function borrow(item: InventoryItem) {
    setBusy(item.itemId); setError(""); setNotice("");
    const result = await borrowInventoryItem(await getIdToken(), item.itemId, quantities[item.itemId] ?? 1, projectId);
    setBusy("");
    if (!result.ok) { setError(result.error); await refresh(); return; }
    setNotice(`${result.data.quantity} × ${item.name} checked out and recorded.`); await refresh();
  }
  async function returnItem(loan: InventoryLoan) {
    setBusy(loan.loanId); setError(""); setNotice("");
    const result = await returnInventoryItem(await getIdToken(), loan.loanId);
    setBusy("");
    if (!result.ok) { setError(result.error); await refresh(); return; }
    setNotice(`${loan.itemName} return recorded.`); await refresh();
  }
  async function saveStock(item: InventoryItem) {
    setBusy(item.itemId); setError(""); setNotice("");
    const result = await updateInventoryStock(await getIdToken(), item.itemId, stockValues[item.itemId] ?? item.totalQuantity);
    setBusy("");
    if (!result.ok) { setError(result.error); return; }
    setNotice(`Stock count for ${item.name} updated.`); await refresh();
  }

  return <section className="py-10 md:py-14"><Container>
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
          <div><p className="eyebrow">Lab stock list</p><h2 className="mt-2 font-display text-h3 text-ink">Browse inventory</h2><p className="mt-2 text-small text-muted">{filtered.length} of {items.length} items</p></div>
          <div className="relative w-full sm:max-w-xs"><SearchIcon aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inventory" aria-label="Search by item name, category or details" className="min-h-10 w-full rounded-lg border border-border bg-surface py-2 pr-3 pl-9 text-small text-ink placeholder:text-muted" /></div>
        </div>
        <div className="flex gap-2 overflow-x-auto py-4" aria-label="Filter by category">{categories.map((entry) => <Button key={entry} size="sm" variant={category === entry ? "secondary" : "outline"} onClick={() => setCategory(entry)}>{entry}</Button>)}</div>
        {user && <div className="mb-4 max-w-lg"><label htmlFor="inventory-project" className="text-small font-medium text-ink">Project for this borrowing</label>{projects.length ? <select id="inventory-project" value={projectId} onChange={(event) => setProjectId(event.target.value)} className="mt-2 min-h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-small text-ink">{projects.map((project) => <option key={project.projectId} value={project.projectId}>{project.title}</option>)}</select> : <p className="mt-2 text-small text-muted">Join or create a project before borrowing inventory.</p>}</div>}
        {notice && <StatusMessage status="success" className="mb-4">{notice}</StatusMessage>}{error && <StatusMessage status="error" className="mb-4">{error}</StatusMessage>}
        <div className="divide-y divide-border border-y border-border">
          {filtered.map((item) => { const stock = stockState(item); return <article key={item.itemId} className="grid gap-4 py-5 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-center">
            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-primary-tint sm:w-24"><InventoryItemImage item={item} /></div>
            <div className="min-w-0"><p className="eyebrow">{item.category}</p><div className="mt-1 flex flex-wrap items-center gap-2"><h3 className="font-display text-h4 text-ink">{item.name}</h3><Badge variant={stock.variant}>{stock.text}</Badge></div><p className="mt-1 text-small text-muted">{item.description}</p><p className="mt-2 text-xs text-muted">{item.stockNeedsReview ? "Source workbook has no confirmed count; checkout is paused until stock is verified." : `${item.totalQuantity} listed in total`}{item.sourceReference ? ` · Source ref ${item.sourceReference}` : ""}</p>{item.detailsUrl && <a href={item.detailsUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-primary underline underline-offset-4">Product details ↗</a>}</div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">{item.borrowable && !item.stockNeedsReview && item.availableQuantity > 0 && <><label className="sr-only" htmlFor={`qty-${item.itemId}`}>Quantity for {item.name}</label><input id={`qty-${item.itemId}`} type="number" min={1} max={item.availableQuantity} value={quantities[item.itemId] ?? 1} onChange={(e) => setQuantities((q) => ({ ...q, [item.itemId]: Math.min(item.availableQuantity, Math.max(1, Number(e.target.value) || 1)) }))} className="h-8 w-16 rounded-lg border border-border bg-surface px-2 text-small" />{user ? <Button size="sm" disabled={busy === item.itemId || !projectId} onClick={() => void borrow(item)}>{busy === item.itemId ? "Recording…" : "Borrow"}</Button> : <Button asChild size="sm"><Link href={`/login?next=${encodeURIComponent("/inventory")}`}>Sign in to borrow</Link></Button>}</>}{isAdmin && item.borrowable && <div className="flex items-center gap-1"><label className="sr-only" htmlFor={`stock-${item.itemId}`}>Set stock for {item.name}</label><input id={`stock-${item.itemId}`} type="number" min={0} max={100000} value={stockValues[item.itemId] ?? item.totalQuantity} onChange={(e) => setStockValues((s) => ({ ...s, [item.itemId]: Math.max(0, Number(e.target.value) || 0) }))} className="h-8 w-16 rounded-lg border border-border bg-surface px-2 text-xs" /><Button size="xs" variant="outline" disabled={busy === item.itemId} onClick={() => void saveStock(item)}>Update stock</Button></div>}</div>
          </article>; })}
          {!filtered.length && <p className="py-10 text-center text-body text-muted">No inventory items match your search.</p>}
        </div>
      </div>

      <aside className="h-fit rounded-lg border border-border bg-surface p-5 lg:sticky lg:top-24">
        <div className="flex items-center gap-2"><BoxIcon aria-hidden="true" className="size-5 text-primary" /><h2 className="font-display text-h4 text-ink">My borrowings</h2></div>
        {loading ? <div className="mt-5 h-20 animate-pulse rounded-lg bg-primary-tint" /> : !user ? <div className="mt-4"><p className="text-small text-muted">Sign in with your Ahmedabad University account to borrow items and view your history.</p><Button asChild className="mt-4"><Link href={`/login?next=${encodeURIComponent("/inventory")}`}>Sign in</Link></Button></div> : <>
          <p className="mt-2 text-xs text-muted">Borrowing immediately records your university account, selected project, item and quantity. You can record the return here.</p>
          {isAdmin && <p className="mt-3 rounded-lg bg-primary-tint p-3 text-xs text-primary-dark">Lab administrator view: borrowing records from all students are visible here. Stock updates preserve quantities already on loan.</p>}
          <div className="mt-5"><p className="eyebrow">Currently borrowed ({active.length})</p>{!active.length ? <p className="mt-2 text-small text-muted">Nothing currently borrowed.</p> : <ul className="mt-2 divide-y divide-border">{active.map((loan) => <li key={loan.loanId} className="py-3"><div className="flex items-start justify-between gap-2"><div><p className="text-small font-medium text-ink">{loan.itemName} <span className="text-muted">× {loan.quantity}</span></p>{isAdmin && <p className="mt-1 text-xs text-muted">{loan.borrowerName} · {loan.borrowerEmail}</p>}<p className="mt-1 inline-flex items-center gap-1 text-xs text-muted"><Clock3Icon aria-hidden="true" className="size-3" />{loan.borrowedAt ? formatDateTime(loan.borrowedAt) : "Just recorded"}</p></div><Button variant="outline" size="xs" disabled={busy === loan.loanId} onClick={() => void returnItem(loan)}><RotateCcwIcon aria-hidden="true" />Return</Button></div></li>)}</ul>}</div>
          <div className="mt-5 border-t border-border pt-4"><p className="eyebrow">Borrowing history ({returned.length})</p>{!returned.length ? <p className="mt-2 text-small text-muted">Returned items will appear here.</p> : <ul className="mt-2 divide-y divide-border">{returned.map((loan) => <li key={loan.loanId} className="py-3"><p className="text-small font-medium text-ink"><CheckCircle2Icon aria-hidden="true" className="mr-1 inline size-3.5 text-success" />{loan.itemName} × {loan.quantity}</p><p className="mt-1 text-xs text-muted">Project: {loan.projectTitle}</p><p className="mt-1 text-xs text-muted">Borrowed {loan.borrowedAt ? formatDateTime(loan.borrowedAt) : "—"}</p><p className="mt-1 text-xs text-muted">Returned {loan.returnedAt ? formatDateTime(loan.returnedAt) : "—"}</p></li>)}</ul>}</div>
        </>}
        <p className="mt-5 border-t border-border pt-4 text-xs text-muted">A successful checkout reduces available stock immediately. Returned quantities are restored after you record the return.</p>
      </aside>
    </div>
  </Container></section>;
}
