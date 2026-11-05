import type { Metadata } from "next";

import photoOne from "./images/WhatsApp Image 2026-08-19 at 14.35.11.jpeg";
import photoTwo from "./images/WhatsApp Image 2026-08-19 at 14.35.39 (1).jpeg";
import photoThree from "./images/WhatsApp Image 2026-08-19 at 14.35.39.jpeg";
import photoFour from "./images/WhatsApp Image 2026-08-19 at 14.36.43.jpeg";
import poster from "./PCB_DESIGNING_WORKSHOP.png";
import { WorkshopShowcase } from "../WorkshopShowcase";

export const metadata: Metadata = {
  title: "PCB Designing Workshop",
  description: "Learn about the PCB Designing Workshop at the Tinkerer Lab.",
};

export default function PcbDesigningWorkshopPage() {
  return (
    <WorkshopShowcase
      title="PCB Designing Workshop"
      description="Explore the process of designing a printed circuit board, from planning a circuit to laying out its components and connections."
      poster={poster}
      photos={[
        { src: photoOne, alt: "PCB designing workshop photo 1" },
        { src: photoTwo, alt: "PCB designing workshop photo 2" },
        { src: photoThree, alt: "PCB designing workshop photo 3" },
        { src: photoFour, alt: "PCB designing workshop photo 4" },
      ]}
    />
  );
}
