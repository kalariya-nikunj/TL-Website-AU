import type { Metadata } from "next";

import photoOne from "./images/1.jpg";
import photoTwo from "./images/IMG-20260630-WA0101.jpg";
import photoThree from "./images/IMG-20260630-WA0111.jpg";
import photoFour from "./images/IMG20260630092755.jpg";
import photoFive from "./images/IMG_20260630_145939.jpg";
import poster from "./3D_PRINTINIG_WORKSHOP.png";
import { WorkshopShowcase } from "../WorkshopShowcase";

export const metadata: Metadata = {
  title: "3D Printing Workshop",
  description: "Learn about the 3D Printing Workshop at the Tinkerer Lab.",
};

export default function ThreeDPrintingWorkshopPage() {
  return (
    <WorkshopShowcase
      title="3D Printing Workshop"
      description="Explore the process of turning a digital design into a physical print, from preparing a model to using a 3D printer."
      poster={poster}
      photos={[
        { src: photoOne, alt: "3D printing workshop photo 1" },
        { src: photoTwo, alt: "3D printing workshop photo 2" },
        { src: photoThree, alt: "3D printing workshop photo 3" },
        { src: photoFour, alt: "3D printing workshop photo 4" },
        { src: photoFive, alt: "3D printing workshop photo 5" },
      ]}
    />
  );
}
