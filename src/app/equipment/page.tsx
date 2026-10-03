import type { Metadata } from "next";

import { EquipmentDirectory } from "@/components/sections/EquipmentDirectory";
import { PageHeader } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";

export const metadata: Metadata = {
  title: "Equipment",
  description: "Browse Tinkerers Lab equipment and open its usage QR page.",
};

export default function EquipmentDirectoryPage() {
  return (
    <>
      <PageHeader title="Equipment" description="Browse lab machinery and open a machine’s QR page." />
      <Section><EquipmentDirectory /></Section>
    </>
  );
}
