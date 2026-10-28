export type InventoryItem = {
  itemId: string;
  name: string;
  category: string;
  description: string;
  sourceSheet: string;
  sourceRow: number;
  sourceReference: string;
  detailsUrl: string;
  totalQuantity: number;
  availableQuantity: number;
  borrowable: boolean;
  stockNeedsReview: boolean;
  sourceStatus: string;
  imageUrl: string;
};

export type InventoryLoan = {
  loanId: string;
  itemId: string;
  itemName: string;
  category: string;
  quantity: number;
  status: "REQUESTED" | "BORROWED" | "APPROVED" | "REJECTED" | "RETURNED";
  borrowerName?: string;
  borrowerEmail?: string;
  projectId: string;
  projectTitle: string;
  requestedAt: string;
  approvedAt?: string;
  approvedByEmail?: string;
  borrowedAt: string;
  returnedAt?: string;
};

export type InventoryData = {
  items: InventoryItem[];
  loans: InventoryLoan[];
  projects: { projectId: string; title: string }[];
  signedIn: boolean;
  isAdmin: boolean;
};
