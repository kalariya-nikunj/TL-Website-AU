"use client";

import { useCallback, useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/sections/Section";
import { useAuth } from "@/lib/auth/AuthProvider";
import { archiveProjectAsAdmin, createAdminInventoryItem, createProjectAsAdmin, decideBorrowingRequest, deactivateAdminAccess, deleteBorrowingHistoryRecord, deleteEquipmentUsageRecord, deleteProjectAsAdmin, getAdminRecords, getAdminSnapshot, grantAdminAccess, resolveEquipmentUsageAsAdmin, returnBorrowingAsAdmin, setAdminEquipmentStatus, setAdminInventoryBorrowable, setProjectAdminStatus, updateAdminEquipmentDetails, updateAdminInventoryDetails, updateAdminInventoryQuantity, updateAdminPermissions, updateProjectAdminDetails } from "@/app/actions/admin";

const sections = [
  ["projects", "Projects"], ["inventory", "Inventory"], ["borrowings", "Borrowings"],
  ["equipment", "Equipment"], ["equipmentUsage", "Equipment usage"], ["admins", "Admins"], ["auditLogs", "Audit logs"],
] as const;
const grantablePermissions = ["projects.view","projects.create","projects.edit","projects.delete","inventory.view","inventory.create","inventory.edit","inventory.delete","borrowings.view","borrowings.manage","equipment.view","equipment.manage","equipmentUsage.view","equipmentUsage.manage"];
const sectionPermission: Record<string, string> = {
  projects: "projects.view", inventory: "inventory.view", borrowings: "borrowings.view",
  equipment: "equipment.view", equipmentUsage: "equipmentUsage.view",
};

export default function AdminPage() {
  const { user, loading, getIdToken } = useAuth();
  const [state, setState] = useState<{ loading: boolean; message: string; role?: string; permissions?: string[]; counts?: Record<string, number> }>({ loading: true, message: "Checking admin access…" });
  const [selected, setSelected] = useState<(typeof sections)[number][0] | null>(null);
  const [records, setRecords] = useState<Array<Record<string, unknown>>>([]);
  const [recordsMessage, setRecordsMessage] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPermissions, setAdminPermissions] = useState<string[]>(["projects.view"]);
  const [editingProject, setEditingProject] = useState<Record<string, unknown> | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<Record<string, unknown> | null>(null);
  const [editingInventory, setEditingInventory] = useState<Record<string, unknown> | null>(null);
  const [newInventoryCategory, setNewInventoryCategory] = useState("Power tools");
  const [editingAdmin, setEditingAdmin] = useState<Record<string, unknown> | null>(null);
  const [editingAdminPermissions, setEditingAdminPermissions] = useState<string[]>([]);

  const loadRecords = useCallback(async (section: (typeof sections)[number][0]) => {
    setSelected(section); setRecords([]); setRecordsMessage("Loading records…");
    const result = await getAdminRecords(await getIdToken(), section);
    if (result.ok) { setRecords(result.data); setRecordsMessage(result.data.length ? `${result.data.length} ${section === "inventory" ? "catalog items shown" : "records (maximum 100 shown)"}.` : "No records found."); }
    else setRecordsMessage(result.error);
  }, [getIdToken]);

  const updateProjectStatus = async (projectId: string, status: "ACTIVE" | "COMPLETED" | "ARCHIVED") => {
    const result = await setProjectAdminStatus(await getIdToken(), projectId, status);
    setRecordsMessage(result.ok ? "Project status updated and audited." : result.error);
    if (result.ok) await loadRecords("projects");
  };

  const createProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = await createProjectAsAdmin(await getIdToken(), {
      ownerEmail: String(data.get("ownerEmail") ?? ""), title: String(data.get("title") ?? ""),
      category: String(data.get("category") ?? ""), shortDescription: String(data.get("shortDescription") ?? ""),
      description: String(data.get("description") ?? ""),
    });
    setRecordsMessage(result.ok ? "Project created and audited." : result.error);
    if (result.ok) { form.reset(); await loadRecords("projects"); }
  };

  const archiveProject = async (projectId: string, title: string) => {
    if (!window.confirm(`Archive “${title}”? It will be hidden from active projects, but its history and team links will be retained.`)) return;
    const result = await archiveProjectAsAdmin(await getIdToken(), projectId);
    setRecordsMessage(result.ok ? "Project archived and audited." : result.error);
    if (result.ok) await loadRecords("projects");
  };

  const deleteProject = async (projectId: string, title: string) => {
    if (!window.confirm(`Permanently delete “${title}” and its team records? Delete its borrowing and equipment usage history first if it has any.`)) return;
    const result = await deleteProjectAsAdmin(await getIdToken(), projectId);
    setRecordsMessage(result.ok ? "Project and team records deleted; action audited." : result.error);
    if (result.ok) await loadRecords("projects");
  };

  const saveProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProject) return;
    const form = new FormData(event.currentTarget);
    const result = await updateProjectAdminDetails(await getIdToken(), String(editingProject.id), {
      title: String(form.get("title") ?? ""), shortDescription: String(form.get("shortDescription") ?? ""),
      description: String(form.get("description") ?? ""), category: String(form.get("category") ?? ""),
    });
    setRecordsMessage(result.ok ? "Project details updated and audited." : result.error);
    if (result.ok) { setEditingProject(null); await loadRecords("projects"); }
  };

  const submitAdmin = async (event: React.FormEvent) => {
    event.preventDefault(); setRecordsMessage("Saving admin access…");
    const result = await grantAdminAccess(await getIdToken(), adminEmail, adminPermissions as never[]);
    setRecordsMessage(result.ok ? "Admin access granted and audited." : result.error);
    if (result.ok) { setAdminEmail(""); await loadRecords("admins"); }
  };

  const deactivateAdmin = async (uid: string) => {
    if (!window.confirm("Deactivate this admin account?")) return;
    const result = await deactivateAdminAccess(await getIdToken(), uid);
    setRecordsMessage(result.ok ? "Admin access deactivated and audited." : result.error);
    if (result.ok) await loadRecords("admins");
  };

  const saveAdminPermissions = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingAdmin) return;
    const result = await updateAdminPermissions(await getIdToken(), String(editingAdmin.id), editingAdminPermissions as never[]);
    setRecordsMessage(result.ok ? "Admin permissions updated and audited." : result.error);
    if (result.ok) { setEditingAdmin(null); await loadRecords("admins"); }
  };

  const saveInventoryQuantity = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form=new FormData(event.currentTarget);
    const result=await updateAdminInventoryQuantity(await getIdToken(),String(form.get("itemId")),Number(form.get("quantity")));
    setRecordsMessage(result.ok?"Quantity updated; Sheets sync queued and audited.":result.error);
    if(result.ok) await loadRecords("inventory");
  };

  const saveInventoryBorrowability = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form=new FormData(event.currentTarget);
    const result=await setAdminInventoryBorrowable(await getIdToken(),String(form.get("itemId")),form.get("borrowable")==="on");
    setRecordsMessage(result.ok?"Borrowing availability updated, Sheets sync queued, and action audited.":result.error);
    if(result.ok) await loadRecords("inventory");
  };

  const saveInventoryDetails = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!editingInventory) return;
    const form = new FormData(event.currentTarget);
    const result = await updateAdminInventoryDetails(await getIdToken(), String(editingInventory.itemId), {
      ...(form.has("description") ? { description: String(form.get("description") ?? "") } : {}),
      ...(form.has("detailsUrl") ? { detailsUrl: String(form.get("detailsUrl") ?? "") } : {}),
    });
    setRecordsMessage(result.ok ? "Inventory source Sheet updated and action audited." : result.error);
    if (result.ok) { setEditingInventory(null); await loadRecords("inventory"); }
  };

  const createInventory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement);
    const result = await createAdminInventoryItem(await getIdToken(), {
      sourceSheet: String(form.get("sourceSheet") ?? ""), name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? ""), model: String(form.get("model") ?? ""),
      detailsUrl: String(form.get("detailsUrl") ?? ""), quantity: Number(form.get("quantity") ?? 0),
    });
    setRecordsMessage(result.ok ? "Inventory item created in its source Sheet and audit recorded." : result.error);
    if (result.ok) { formElement.reset(); setNewInventoryCategory("Power tools"); await loadRecords("inventory"); }
  };

  const saveEquipmentStatus = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const result = await setAdminEquipmentStatus(await getIdToken(), String(form.get("equipmentId")), String(form.get("status")) as "AVAILABLE" | "MAINTENANCE" | "DISABLED");
    setRecordsMessage(result.ok ? "Machine status updated and audited. Machinery Sheet maintenance restrictions remain in effect." : result.error);
    if (result.ok) await loadRecords("equipment");
  };

  const saveEquipmentDetails = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!editingEquipment) return;
    const form = new FormData(event.currentTarget);
    const result = await updateAdminEquipmentDetails(await getIdToken(), String(editingEquipment.equipmentId), {
      name: String(form.get("name") ?? ""), manufacturer: String(form.get("manufacturer") ?? ""),
      model: String(form.get("model") ?? ""), detailsUrl: String(form.get("detailsUrl") ?? ""),
      type: String(form.get("type") ?? ""), quantity: Number(form.get("quantity")),
      description: String(form.get("description") ?? ""), currentStatus: String(form.get("currentStatus") ?? ""),
      maintenancePartner: String(form.get("maintenancePartner") ?? ""), contact: String(form.get("contact") ?? ""),
    });
    setRecordsMessage(result.ok ? "Machinery Sheet updated and action audited." : result.error);
    if (result.ok) { setEditingEquipment(null); await loadRecords("equipment"); }
  };

  const adminReturn = async (loanId:string) => {
    if(!window.confirm("Record this borrowing as returned?")) return;
    const result=await returnBorrowingAsAdmin(await getIdToken(),loanId);
    setRecordsMessage(result.ok?"Return recorded, stock and Sheets updated, and action audited.":result.error);
    if(result.ok) await loadRecords("borrowings");
  };
  const decideRequest = async (loanId:string,decision:"approve"|"reject") => {
    if(!window.confirm(`${decision === "approve" ? "Approve" : "Reject"} this borrowing request?`)) return;
    const result=await decideBorrowingRequest(await getIdToken(),loanId,decision);
    setRecordsMessage(result.ok?`Request ${decision}d and audit log updated.`:result.error);
    if(result.ok) await loadRecords("borrowings");
  };
  const deleteBorrowing = async (loanId: string) => {
    if (!window.confirm("Permanently delete this borrowing history record from Firebase and its Google Sheets row? Active borrowings must be returned first.")) return;
    const result = await deleteBorrowingHistoryRecord(await getIdToken(), loanId);
    setRecordsMessage(result.ok ? "Borrowing history deleted and Sheets removal queued; action audited." : result.error);
    if (result.ok) await loadRecords("borrowings");
  };
  const resolveUsage = async (usageId:string) => {
    if(!window.confirm("Resolve this active equipment session and mark the machine available?")) return;
    const result=await resolveEquipmentUsageAsAdmin(await getIdToken(),usageId);
    setRecordsMessage(result.ok?"Equipment session resolved, machine status updated, and action audited.":result.error);
    if(result.ok) await loadRecords("equipmentUsage");
  };
  const deleteUsage = async (usageId: string) => {
    if (!window.confirm("Permanently delete this equipment usage record from Firebase and Google Sheets? If it is active, its machine will be released.")) return;
    const result = await deleteEquipmentUsageRecord(await getIdToken(), usageId);
    setRecordsMessage(result.ok ? "Equipment usage record deleted and Sheets removal queued; action audited." : result.error);
    if (result.ok) await loadRecords("equipmentUsage");
  };

  useEffect(() => {
    let cancelled = false;
    if (loading) return;
    void (async () => {
      if (!user) { setState({ loading: false, message: "Sign in with your university account to continue." }); return; }
      const result = await getAdminSnapshot(await getIdToken());
      if (cancelled) return;
      setState(result.ok
        ? { loading: false, message: "Admin access verified.", role: result.data.role, permissions: result.data.permissions, counts: result.data.counts }
        : { loading: false, message: result.error });
    })();
    return () => { cancelled = true; };
  }, [getIdToken, loading, user]);

  const labels: Record<string, string> = { projects: "Projects", inventoryItems: "Inventory items", inventoryLoans: "Borrowing records", equipment: "Machines", equipmentUsage: "Equipment usage", adminUsers: "Admin accounts", adminAuditLogs: "Audit log entries" };
  return <Section><Container className="admin-panel"><p className="eyebrow">Administration</p><h1 className="mt-2 text-4xl font-bold">Admin panel</h1><p className="mt-3 text-muted">{state.message}</p>{state.loading ? <p className="mt-8">Loading…</p> : state.counts && <><p className="mt-4">Role: <strong>{state.role}</strong></p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(state.counts).map(([name,count])=><article key={name} className="rounded-xl border border-border bg-surface p-5"><h2 className="font-semibold">{labels[name] ?? name}</h2><p className="mt-2 text-2xl">{count}</p></article>)}</div><nav aria-label="Admin sections" className="mt-8 flex flex-wrap gap-2">{sections.filter(([key])=>state.role==="superadmin"?true:key==="admins"||key==="auditLogs"?false:key==="inventory"?state.permissions?.some(permission=>["inventory.view","inventory.create"].includes(permission)):state.permissions?.includes(sectionPermission[key]??"")).map(([key,label])=><button key={key} type="button" onClick={()=>void loadRecords(key)} className="min-h-11 rounded-lg border border-border bg-surface px-4 py-2 hover:bg-tint">{label}</button>)}</nav>{selected && <section className="mt-6 rounded-xl border border-border bg-surface p-5"><h2 className="text-xl font-semibold">{sections.find(([key])=>key===selected)?.[1]}</h2><p className="mt-2 text-muted">{recordsMessage}</p>{selected==="projects"&&(state.role==="superadmin"||state.permissions?.includes("projects.create"))&&<form onSubmit={createProject} className="my-5 grid gap-3 rounded-lg border border-border p-4"><h3 className="font-semibold">Create a project</h3><label className="grid gap-1">Owner university email<input name="ownerEmail" type="email" required placeholder="student@ahduni.edu.in" className="min-h-11 rounded-md border border-border px-3"/></label><label className="grid gap-1">Project title<input name="title" required maxLength={120} className="min-h-11 rounded-md border border-border px-3"/></label><label className="grid gap-1">Category<select name="category" defaultValue="DIM" className="min-h-11 rounded-md border border-border px-3">{["DIM","PDR","RESEARCH","PERSONAL","STARTUP"].map(value=><option key={value}>{value}</option>)}</select></label><label className="grid gap-1">Short description<textarea name="shortDescription" required maxLength={300} className="min-h-20 rounded-md border border-border p-3"/></label><label className="grid gap-1">Description<textarea name="description" required maxLength={10000} className="min-h-32 rounded-md border border-border p-3"/></label><button className="min-h-11 w-fit rounded-md bg-primary px-4 text-white">Create project</button></form>}{editingProject&&selected==="projects"&&<form onSubmit={saveProject} className="my-5 grid gap-3 rounded-lg border border-border p-4"><h3 className="font-semibold">Edit {String(editingProject.title)}</h3><label className="grid gap-1">Title<input name="title" required maxLength={120} defaultValue={String(editingProject.title??"")} className="min-h-11 rounded-md border border-border px-3"/></label><label className="grid gap-1">Category<select name="category" defaultValue={String(editingProject.category??"DIM")} className="min-h-11 rounded-md border border-border px-3">{["DIM","PDR","RESEARCH","PERSONAL","STARTUP"].map(value=><option key={value}>{value}</option>)}</select></label><label className="grid gap-1">Short description<textarea name="shortDescription" required maxLength={300} defaultValue={String(editingProject.shortDescription??"")} className="min-h-20 rounded-md border border-border p-3"/></label><label className="grid gap-1">Description<textarea name="description" required maxLength={10000} defaultValue={String(editingProject.description??"")} className="min-h-32 rounded-md border border-border p-3"/></label><div className="flex gap-2"><button className="min-h-11 rounded-md bg-primary px-4 text-white">Save project</button><button type="button" onClick={()=>setEditingProject(null)} className="min-h-11 rounded-md border px-4">Cancel</button></div></form>}{selected==="admins"&&state.role==="superadmin"&&<form onSubmit={submitAdmin} className="my-5 grid gap-3 rounded-lg border border-border p-4"><label className="grid gap-1">Existing university email<input type="email" required value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} className="min-h-11 rounded-md border border-border px-3" placeholder="name@ahduni.edu.in"/></label><fieldset className="grid gap-2 sm:grid-cols-2">{grantablePermissions.map(permission=><label key={permission} className="flex items-center gap-2"><input type="checkbox" checked={adminPermissions.includes(permission)} onChange={e=>setAdminPermissions(current=>e.target.checked?[...current,permission]:current.filter(value=>value!==permission))}/>{permission}</label>)}</fieldset><button className="min-h-11 w-fit rounded-md bg-primary px-4 text-white">Grant Admin access</button></form>}{editingAdmin&&<form onSubmit={saveAdminPermissions} className="my-5 grid gap-3 rounded-lg border border-border p-4"><h3 className="font-semibold">Update permissions for {String(editingAdmin.email)}</h3><fieldset className="grid gap-2 sm:grid-cols-2">{grantablePermissions.map(permission=><label key={permission} className="flex items-center gap-2"><input type="checkbox" checked={editingAdminPermissions.includes(permission)} onChange={event=>setEditingAdminPermissions(current=>event.target.checked?[...current,permission]:current.filter(value=>value!==permission))}/>{permission}</label>)}</fieldset><div className="flex gap-2"><button className="min-h-11 rounded-md bg-primary px-4 text-white">Save permissions</button><button type="button" onClick={()=>setEditingAdmin(null)} className="min-h-11 rounded-md border px-4">Cancel</button></div></form>}{selected==="inventory"&&(state.role==="superadmin"||state.permissions?.includes("inventory.create"))&&<form onSubmit={createInventory} className="my-5 grid gap-3 rounded-lg border border-border p-4"><h3 className="font-semibold">Add inventory item to the source catalog</h3><label className="grid gap-1">Category<select name="sourceSheet" value={newInventoryCategory} onChange={event=>setNewInventoryCategory(event.target.value)} className="min-h-11 rounded-md border border-border px-3">{["Power tools","Power tools Consumables","Electrical and Electronics","Electrical and Electronics Comp","Hand tool 2.0","Measurement Tools","Safety Equipment"].map(category=><option key={category}>{category}</option>)}</select></label><label className="grid gap-1">Item name<input name="name" required maxLength={160} className="min-h-11 rounded-md border border-border px-3"/></label><label className="grid gap-1">Model or specification<input name="model" maxLength={160} className="min-h-11 rounded-md border border-border px-3"/></label><label className="grid gap-1">Description / condition<textarea name="description" maxLength={1000} className="min-h-20 rounded-md border border-border p-3"/></label>{newInventoryCategory!=="Electrical and Electronics Comp"&&<label className="grid gap-1">Product URL<input name="detailsUrl" type="url" className="min-h-11 rounded-md border border-border px-3"/></label>}{newInventoryCategory==="Power tools Consumables"?<p className="text-sm text-muted">Consumables start with stock marked for review. Add a physical count after creation.</p>:<label className="grid gap-1">Starting quantity<input name="quantity" type="number" min="0" max="10000" required defaultValue={0} className="min-h-11 rounded-md border border-border px-3"/></label>}<button className="min-h-11 w-fit rounded-md bg-primary px-4 text-white">Create inventory item</button></form>}{editingInventory&&selected==="inventory"&&<form onSubmit={saveInventoryDetails} className="my-5 grid gap-3 rounded-lg border border-border p-4"><h3 className="font-semibold">Edit catalog details: {String(editingInventory.name)}</h3><p className="text-sm text-muted">Source category: {String(editingInventory.sourceSheet)}. Quantity and borrowing status are managed separately below.</p>{!['Power tools Consumables','Electrical and Electronics Comp'].includes(String(editingInventory.sourceSheet))&&<label className="grid gap-1">Description<textarea name="description" maxLength={1000} defaultValue={String(editingInventory.description??"")} className="min-h-20 rounded-md border border-border p-3"/></label>}{String(editingInventory.sourceSheet)!=="Electrical and Electronics Comp"&&<label className="grid gap-1">Product URL<input name="detailsUrl" type="url" defaultValue={String(editingInventory.detailsUrl??"")} className="min-h-11 rounded-md border border-border px-3"/></label>}<div className="flex gap-2"><button className="min-h-11 rounded-md bg-primary px-4 text-white">Save details</button><button type="button" onClick={()=>setEditingInventory(null)} className="min-h-11 rounded-md border px-4">Cancel</button></div></form>}{editingEquipment&&selected==="equipment"&&<form onSubmit={saveEquipmentDetails} className="my-5 grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2"><h3 className="font-semibold sm:col-span-2">Edit {String(editingEquipment.name)}</h3><label className="grid gap-1">Machine name<input name="name" required maxLength={160} defaultValue={String(editingEquipment.name??"")} className="min-h-11 rounded-md border border-border px-3"/></label><label className="grid gap-1">Manufacturer<input name="manufacturer" maxLength={160} defaultValue={String(editingEquipment.manufacturer??"")} className="min-h-11 rounded-md border border-border px-3"/></label><label className="grid gap-1">Model<input name="model" maxLength={160} defaultValue={String(editingEquipment.model??"")} className="min-h-11 rounded-md border border-border px-3"/></label><label className="grid gap-1">Type<input name="type" maxLength={120} defaultValue={String(editingEquipment.type??"")} className="min-h-11 rounded-md border border-border px-3"/></label><label className="grid gap-1">Quantity<input name="quantity" type="number" min="0" max="10000" required defaultValue={Number(editingEquipment.quantity)||0} className="min-h-11 rounded-md border border-border px-3"/></label><label className="grid gap-1">Details URL<input name="detailsUrl" type="url" defaultValue={String(editingEquipment.detailsUrl??"")} className="min-h-11 rounded-md border border-border px-3"/></label><label className="grid gap-1">Current status<input name="currentStatus" required maxLength={100} defaultValue={String(editingEquipment.currentStatus??"")} className="min-h-11 rounded-md border border-border px-3"/></label><label className="grid gap-1">Maintenance partner<input name="maintenancePartner" maxLength={200} defaultValue={String(editingEquipment.maintenancePartner??"")} className="min-h-11 rounded-md border border-border px-3"/></label><label className="grid gap-1">Contact<input name="contact" maxLength={100} defaultValue={String(editingEquipment.contact??"")} className="min-h-11 rounded-md border border-border px-3"/></label><label className="grid gap-1 sm:col-span-2">Description<textarea name="description" maxLength={1000} defaultValue={String(editingEquipment.description??"")} className="min-h-20 rounded-md border border-border p-3"/></label><div className="flex gap-2 sm:col-span-2"><button className="min-h-11 rounded-md bg-primary px-4 text-white">Save machine</button><button type="button" onClick={()=>setEditingEquipment(null)} className="min-h-11 rounded-md border px-4">Cancel</button></div></form>}{records.length>0 && <div className="admin-records-scroll mt-4 overflow-x-auto"><table className="admin-record-table w-full min-w-[640px] text-left text-sm"><thead><tr>{Object.keys(records[0]).map(key=><th key={key} className="border-b border-border p-2">{key}</th>)}{selected === "projects" && (state.role === "superadmin" || state.permissions?.includes("projects.edit") || state.permissions?.includes("projects.delete")) && <th className="border-b border-border p-2">Manage</th>}{selected==="admins"&&state.role==="superadmin"&&<th className="border-b border-border p-2">Manage</th>}{selected==="inventory"&&(state.role==="superadmin"||state.permissions?.includes("inventory.edit"))&&<th className="border-b border-border p-2">Manage stock</th>}{selected==="borrowings"&&(state.role==="superadmin"||state.permissions?.includes("borrowings.manage"))&&<th className="border-b border-border p-2">Manage</th>}{selected==="equipment"&&(state.role==="superadmin"||state.permissions?.includes("equipment.manage"))&&<th className="border-b border-border p-2">Manage machine</th>}{selected==="equipmentUsage"&&(state.role==="superadmin"||state.permissions?.includes("equipmentUsage.manage"))&&<th className="border-b border-border p-2">Manage</th>}</tr></thead><tbody>{records.map((record,index)=><tr key={String(record.id ?? record.itemId ?? index)}>{Object.keys(records[0]).map(key=><td key={key} data-label={key} className="max-w-72 truncate border-b border-border p-2">{Array.isArray(record[key])?record[key].join(", "):String(record[key] ?? "")}</td>)}{selected === "projects" && (state.role === "superadmin" || state.permissions?.includes("projects.edit") || state.permissions?.includes("projects.delete")) && <td data-label="Actions" className="border-b border-border p-2"><div className="flex items-center gap-2">{(state.role === "superadmin" || state.permissions?.includes("projects.edit"))&&<><button type="button" onClick={()=>setEditingProject(record)} className="min-h-10 rounded border px-3">Edit</button><select aria-label={`Set status for ${String(record.title ?? "project")}`} className="min-h-10 rounded-md border border-border bg-surface px-2" value={String(record.status ?? "ACTIVE")} onChange={event=>void updateProjectStatus(String(record.id), event.target.value as "ACTIVE" | "COMPLETED" | "ARCHIVED")}><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option><option value="ARCHIVED">Archived</option></select></>}{(state.role === "superadmin" || state.permissions?.includes("projects.delete"))&&record.status!=="ARCHIVED"&&<button type="button" onClick={()=>void archiveProject(String(record.id),String(record.title??"project"))} className="min-h-10 rounded border border-red-400 px-3 text-red-700">Archive</button>}{(state.role === "superadmin" || state.permissions?.includes("projects.delete"))&&<button type="button" onClick={()=>void deleteProject(String(record.id),String(record.title??"project"))} className="min-h-10 rounded border border-red-700 px-3 text-red-800">Delete</button>}</div></td>}{selected==="inventory"&&(state.role==="superadmin"||state.permissions?.includes("inventory.edit"))&&<td data-label="Actions" className="border-b border-border p-2"><div className="grid gap-2"><button type="button" onClick={()=>setEditingInventory(record)} className="min-h-10 w-fit rounded border px-3">Edit catalog details</button><form onSubmit={saveInventoryQuantity} className="flex gap-2"><input type="hidden" name="itemId" value={String(record.itemId)}/><input name="quantity" type="number" min="0" max="100000" required defaultValue={Number(record.totalQuantity)||0} aria-label={`Total stock for ${String(record.name)}`} className="w-24 rounded border px-2"/><button className="min-h-10 rounded border px-3">Save quantity</button></form><form onSubmit={saveInventoryBorrowability} className="flex items-center gap-2"><input type="hidden" name="itemId" value={String(record.itemId)}/><label className="flex items-center gap-2"><input name="borrowable" type="checkbox" defaultChecked={record.borrowable===true}/> Allow borrowing</label><button className="min-h-10 rounded border px-3">Save status</button></form></div></td>}{selected==="equipment"&&(state.role==="superadmin"||state.permissions?.includes("equipment.manage"))&&<td data-label="Actions" className="border-b border-border p-2"><div className="grid gap-2"><button type="button" disabled={Boolean(record.activeUsageId)} onClick={()=>setEditingEquipment(record)} className="min-h-10 w-fit rounded border px-3 disabled:opacity-50">Edit details</button><form onSubmit={saveEquipmentStatus} className="flex items-center gap-2"><input type="hidden" name="equipmentId" value={String(record.equipmentId)}/><select name="status" defaultValue={String(record.status)} disabled={Boolean(record.activeUsageId)} aria-label={`Status for ${String(record.name)}`} className="min-h-10 rounded border border-border bg-surface px-2"><option value="AVAILABLE">Available</option><option value="MAINTENANCE">Maintenance</option><option value="DISABLED">Disabled</option></select><button disabled={Boolean(record.activeUsageId)} className="min-h-10 rounded border px-3 disabled:opacity-50">Save</button></form></div>{Boolean(record.activeUsageId)&&<small className="text-muted">Resolve active usage first.</small>}</td>}{selected==="equipmentUsage"&&(state.role==="superadmin"||state.permissions?.includes("equipmentUsage.manage"))&&<td data-label="Actions" className="border-b border-border p-2">{record.status==="ACTIVE"&&<button type="button" onClick={()=>void resolveUsage(String(record.id))} className="min-h-10 rounded border px-3">Resolve session</button>}<button type="button" onClick={()=>void deleteUsage(String(record.id))} className="ml-2 min-h-10 rounded border border-red-400 px-3 text-red-700">Delete record</button></td>}{selected==="borrowings"&&(state.role==="superadmin"||state.permissions?.includes("borrowings.manage"))&&<td data-label="Actions" className="border-b border-border p-2">{record.status==="REQUESTED"?<div className="flex gap-2"><button type="button" onClick={()=>void decideRequest(String(record.id),"approve")} className="min-h-10 rounded border px-3">Approve</button><button type="button" onClick={()=>void decideRequest(String(record.id),"reject")} className="min-h-10 rounded border border-red-400 px-3 text-red-700">Reject</button></div>: ["BORROWED","APPROVED"].includes(String(record.status))?<button type="button" onClick={()=>void adminReturn(String(record.id))} className="min-h-10 rounded border px-3">Record return</button>:null}{["REQUESTED","REJECTED","RETURNED"].includes(String(record.status))&&<button type="button" onClick={()=>void deleteBorrowing(String(record.id))} className="ml-2 min-h-10 rounded border border-red-400 px-3 text-red-700">Delete history</button>}</td>}{selected==="admins"&&state.role==="superadmin"&&record.role==="admin"&&<td data-label="Actions" className="border-b border-border p-2"><div className="flex gap-2"><button type="button" onClick={()=>{setEditingAdmin(record);setEditingAdminPermissions(Array.isArray(record.permissions)?record.permissions.map(String):[]);}} className="min-h-10 rounded border px-3">Edit permissions</button>{record.active===true&&<button type="button" onClick={()=>void deactivateAdmin(String(record.id))} className="min-h-10 rounded border border-red-400 px-3 text-red-700">Deactivate</button>}</div></td>}</tr>)}</tbody></table></div>}</section>}</>}</Container></Section>;
}


