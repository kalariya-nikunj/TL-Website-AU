export type EquipmentStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "DISABLED";
export type EquipmentUsageStatus = "ACTIVE" | "COMPLETED";

export type Equipment = {
  equipmentId: string;
  srNo?: number;
  name: string;
  manufacturer?: string;
  model?: string;
  type?: string;
  detailsUrl?: string;
  quantity?: number;
  description?: string;
  maintenancePartner?: string;
  contact?: string;
  /** Verbatim machinery-source condition, separate from a live usage session. */
  currentStatus?: string;
  status: EquipmentStatus;
  isActive: boolean;
  activeUsageId?: string;
};

/** Firestore timestamps are serialized to ISO strings before reaching the client. */
export type EquipmentUsage = {
  usageId: string;
  equipmentId: string;
  equipmentName: string;
  userUid: string;
  userName: string;
  projectId: string;
  projectTitle: string;
  status: EquipmentUsageStatus;
  startedAt: string;
  endedAt?: string;
};

export type EquipmentProjectOption = { projectId: string; title: string };
