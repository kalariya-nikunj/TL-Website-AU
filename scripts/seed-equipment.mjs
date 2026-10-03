import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import nextEnv from "@next/env";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const MASTER_FILE = resolve(process.cwd(), "scripts/equipment-master.json");
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const { loadEnvConfig } = nextEnv;

function argument(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}

function sourceRuntimeStatus(currentStatus) {
  const normalized = currentStatus.trim().toLowerCase();
  if (normalized === "in work") return "AVAILABLE";
  if (normalized === "out of work") return "MAINTENANCE";
  throw new Error(`Unsupported machinery source status: ${currentStatus || "blank"}`);
}

function validateRecords(records) {
  if (!Array.isArray(records) || records.length !== 15) {
    throw new Error("The machinery master file must contain exactly 15 records.");
  }
  const ids = new Set();
  for (const [index, record] of records.entries()) {
    const row = index + 1;
    if (!record || typeof record !== "object") throw new Error(`Record ${row} is invalid.`);
    if (typeof record.equipmentId !== "string" || !ID_PATTERN.test(record.equipmentId)) {
      throw new Error(`Record ${row} needs a stable URL-safe equipmentId.`);
    }
    if (ids.has(record.equipmentId)) throw new Error(`Duplicate equipmentId: ${record.equipmentId}`);
    ids.add(record.equipmentId);
    if (!Number.isInteger(record.srNo) || record.srNo < 1 || record.srNo > 15) {
      throw new Error(`Record ${row} needs a source Sr No. from 1 to 15.`);
    }
    for (const field of ["name", "currentStatus"]) {
      if (typeof record[field] !== "string") throw new Error(`Record ${row} is missing source field ${field}.`);
    }
    if (!record.name.trim()) throw new Error(`Record ${row} needs a machine name.`);
    sourceRuntimeStatus(record.currentStatus);
    for (const field of ["manufacturer", "model", "type", "detailsUrl", "description", "maintenancePartner", "contact"]) {
      if (record[field] !== undefined && typeof record[field] !== "string") {
        throw new Error(`Record ${row} has an invalid ${field}.`);
      }
    }
    if (record.quantity !== undefined && (!Number.isInteger(record.quantity) || record.quantity < 1)) {
      throw new Error(`Record ${row} has an invalid quantity.`);
    }
  }
  const serialNumbers = records.map((record) => record.srNo).sort((a, b) => a - b);
  if (serialNumbers.some((serial, index) => serial !== index + 1)) {
    throw new Error("Source Sr No. values must be unique and cover 1 through 15.");
  }
  return records;
}

function getAdminApp(targetProject) {
  const existing = getApps().find((app) => app.name === "[DEFAULT]");
  if (existing) return existing;

  const configuredProject = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (configuredProject && configuredProject !== targetProject) {
    throw new Error("The configured Firebase project differs from the explicitly confirmed target.");
  }
  const projectId = configuredProject || targetProject;
  const options = { projectId };
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({ ...options, credential: applicationDefault() });
  }
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) {
    throw new Error("Existing Firebase Admin credentials are not configured.");
  }
  return initializeApp({ ...options, credential: cert({ projectId, clientEmail, privateKey }) });
}

async function main() {
  loadEnvConfig(process.cwd());
  const targetProject = argument("--project");
  if (!targetProject) throw new Error("Pass --project with the expected Firebase project ID.");

  const records = validateRecords(JSON.parse(await readFile(MASTER_FILE, "utf8")));
  const app = getAdminApp(targetProject);
  if (app.options.projectId !== targetProject) throw new Error("Resolved Firebase project does not match the expected target.");
  if (!process.argv.includes("--apply")) {
    console.log(`Validated ${records.length} records for ${targetProject}; no data was written. Pass --apply to seed.`);
    return;
  }

  const db = getFirestore(app);
  for (const record of records) {
    const equipmentRef = db.collection("equipment").doc(record.equipmentId);
    await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(equipmentRef);
      const current = existing.data() ?? {};
      const activeUsageId = typeof current.activeUsageId === "string" ? current.activeUsageId : undefined;
      let preserveInUse = current.status === "IN_USE";
      if (activeUsageId) {
        const usage = await transaction.get(db.collection("equipmentUsage").doc(activeUsageId));
        preserveInUse ||= usage.exists && usage.get("status") === "ACTIVE";
      }

      const next = {
        equipmentId: record.equipmentId,
        srNo: record.srNo,
        name: record.name,
        currentStatus: record.currentStatus,
        isActive: true,
        status: preserveInUse ? "IN_USE" : sourceRuntimeStatus(record.currentStatus),
        createdAt: current.createdAt ?? FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      for (const field of ["manufacturer", "model", "type", "detailsUrl", "quantity", "description", "maintenancePartner", "contact"]) {
        next[field] = record[field] === undefined ? FieldValue.delete() : record[field];
      }
      transaction.set(equipmentRef, next, { merge: true });
    });
  }
  console.log(`Seeded ${records.length} records in ${targetProject}; active usage was preserved.`);
}

main().catch(() => {
  console.error("Equipment seeding stopped. Check the master file, target project, configured credentials, and access. No credential values were displayed.");
  process.exitCode = 1;
});
