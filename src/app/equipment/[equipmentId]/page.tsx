import type { Metadata } from "next";

import { EquipmentPageClient } from "@/components/sections/EquipmentPageClient";
import { PageHeader } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Equipment",
  description: "Start or end an equipment usage session.",
};

export default async function EquipmentPage({ params }: { params: Promise<{ equipmentId: string }> }) {
  const { equipmentId } = await params;
  const equipmentUrl = `${siteUrl()}/equipment/${encodeURIComponent(equipmentId)}`;
  return (
    <>
      <PageHeader title="Equipment usage" description="Choose the project you are working on to start a usage session." />
      <Section><EquipmentPageClient equipmentId={equipmentId} equipmentUrl={equipmentUrl} /></Section>
    </>
  );
}
