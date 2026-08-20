import { readFile } from "node:fs/promises";

const filename = process.argv[2];
if (!filename) throw new Error("Provide the path to an importer JSON output file.");
const data = JSON.parse(await readFile(filename, "utf8"));
if (!Array.isArray(data.records) || data.records.length === 0) throw new Error("Expected at least one candidate record.");
const complete = data.records.every((record) => record.sourceRecordId && record.canonicalUrl && record.sourcePayload);
if (!complete) throw new Error("Candidate provenance is incomplete.");
process.stdout.write(`Validated ${data.records.length} ${data.provider} candidate record(s) with provenance.\n`);
