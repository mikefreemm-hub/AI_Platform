import fs from "fs";
import path from "path";

export function loadLatestSpec(buildRoot, siteName) {
  const revisionsDir = path.join(buildRoot, siteName, "revisions");

  const revisions = fs
    .readdirSync(revisionsDir)
    .sort()
    .reverse();

  if (revisions.length === 0) {
    throw new Error("No revisions found");
  }

  const latestRevision = revisions[0];
  const specPath = path.join(
    revisionsDir,
    latestRevision,
    "site.spec.json"
  );

  return JSON.parse(fs.readFileSync(specPath, "utf-8"));
}
