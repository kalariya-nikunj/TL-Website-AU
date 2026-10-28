import type { Metadata } from "next";

import { PageHeader } from "@/components/sections/PageHeader";
import { InventoryBorrowing } from "@/components/sections/InventoryBorrowing";
import type { InventoryItem } from "@/types/inventory";
import sourceCatalog from "../../../scripts/inventory-catalog.json";

export const metadata: Metadata = {
  title: "Inventory Borrowing",
  description: "Browse Tinkerers Lab tools, components, and supplies and record your borrowings.",
};

export default function InventoryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Tools, components & supplies"
        title="Inventory Borrowing"
        description="Browse the lab inventory, check current stock, and keep a record of what you borrow and return. Stock counts are updated atomically so the same available unit cannot be checked out twice."
      />
      <InventoryBorrowing initialItems={sourceCatalog as InventoryItem[]} />
    </>
  );
}
