"use server";

import { getMachineryCatalog, toMachineryFacilities } from "@/content/machinery";

export async function refreshMachineryFacilities() {
  return toMachineryFacilities(await getMachineryCatalog());
}
