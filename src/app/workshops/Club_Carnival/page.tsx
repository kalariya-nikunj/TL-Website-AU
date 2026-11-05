import type { Metadata } from "next";

import photoOne from "./images/IMG20260808123622.jpg";
import photoTwo from "./images/SAVE_20260808_182644.jpg";
import photoThree from "./images/SAVE_20260808_204753.jpg";
import poster from "./CLUB_CARNIVAL_POSTER.png";
import { WorkshopShowcase } from "../WorkshopShowcase";

export const metadata: Metadata = {
  title: "Club Carnival",
  description: "Explore the Tinkerer Lab Club Carnival and its photo gallery.",
};

export default function ClubCarnivalPage() {
  return (
    <WorkshopShowcase
      title="Club Carnival"
      description="A look back at the Tinkerer Lab Club Carnival."
      poster={poster}
      photos={[
        { src: photoOne, alt: "Tinkerer Lab Club Carnival photo 1" },
        { src: photoTwo, alt: "Tinkerer Lab Club Carnival photo 2" },
        { src: photoThree, alt: "Tinkerer Lab Club Carnival photo 3" },
      ]}
    />
  );
}
