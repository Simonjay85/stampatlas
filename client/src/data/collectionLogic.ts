export function reorderIds(ids: string[], itemId: string, direction: -1 | 1) {
  const from = ids.indexOf(itemId);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= ids.length) return ids;
  const reordered = [...ids];
  [reordered[from], reordered[to]] = [reordered[to], reordered[from]];
  return reordered;
}

export function buildCollectionCsv(rows: Array<{ title: string; country: string; year: number; condition: string; purchasePrice: number; acquiredAt: string; notes: string; quantity?: number; collectionStatus?: string; grade?: string; storageLocation?: string | null; tags?: string[] }>) {
  const header = ["Stamp", "Country", "Year", "Condition", "Quantity", "Status", "Grade", "Purchase price", "Acquired date", "Storage location", "Tags", "Notes"];
  const values = rows.map((row) => [row.title, row.country, String(row.year), row.condition, String(row.quantity ?? 1), row.collectionStatus ?? "owned", row.grade ?? "ungraded", String(row.purchasePrice), row.acquiredAt, row.storageLocation ?? "", (row.tags ?? []).join("; "), row.notes]);
  return [header, ...values].map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n");
}

export type CsvImportRow = { stampSlug: string; condition: "Mint" | "Fine used" | "Used" | "FDC"; quantity: number; collectionStatus: "owned" | "wishlist" | "duplicate" | "swap"; grade: "superb" | "very_fine" | "fine" | "average" | "damaged" | "ungraded"; purchasePrice: number; acquiredAt: string; storageLocation: string | null; customTags: string[]; notes: string };
export type CsvImportPreview = { rows: CsvImportRow[]; errors: Array<{ row: number; message: string }> };

function parseCsvLine(line: string) { const values: string[] = []; let value = ""; let quoted = false; for (let index = 0; index < line.length; index += 1) { const char = line[index]; if (char === '"' && line[index + 1] === '"') { value += '"'; index += 1; } else if (char === '"') quoted = !quoted; else if (char === "," && !quoted) { values.push(value.trim()); value = ""; } else value += char; } values.push(value.trim()); return values; }
function valueAt(row: string[], index: Record<string, number>, aliases: string[]) { const match = aliases.map((alias) => index[alias]).find((value) => value !== undefined); return match === undefined ? "" : row[match] || ""; }
function isValidIsoDate(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const date = new Date(`${value}T00:00:00.000Z`); return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value; }

export function previewCollectionCsv(text: string): CsvImportPreview {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { rows: [], errors: [{ row: 0, message: "CSV is empty" }] };
  const index = Object.fromEntries(parseCsvLine(lines[0]).map((column, position) => [column.toLowerCase().trim(), position]));
  if (!["stamp slug", "slug", "stamp"].some((header) => index[header] !== undefined)) return { rows: [], errors: [{ row: 1, message: "A Stamp slug column is required" }] };
  const rows: CsvImportRow[] = []; const errors: Array<{ row: number; message: string }> = []; const seenSlugs = new Set<string>();
  lines.slice(1).forEach((line, offset) => { const rowNumber = offset + 2; const cells = parseCsvLine(line); const stampSlug = valueAt(cells, index, ["stamp slug", "slug", "stamp"]).toLowerCase().trim().replace(/\s+/g, "-"); const acquiredAt = valueAt(cells, index, ["acquired date", "acquiredat"]) || new Date().toISOString().slice(0, 10); const condition = valueAt(cells, index, ["condition"]) || "Mint"; const status = valueAt(cells, index, ["status", "collection status"]) || "owned"; const grade = valueAt(cells, index, ["grade"]) || "ungraded"; const quantity = Number(valueAt(cells, index, ["quantity"]) || 1); const purchasePrice = Number(valueAt(cells, index, ["purchase price", "price"]) || 0); const customTags = valueAt(cells, index, ["tags", "custom tags"]).split(/[;,]/).map((tag) => tag.trim()).filter(Boolean); if (!stampSlug) { errors.push({ row: rowNumber, message: "Stamp slug is required" }); return; } if (seenSlugs.has(stampSlug)) { errors.push({ row: rowNumber, message: "Duplicate stamp slug in this CSV" }); return; } if (!(["Mint", "Fine used", "Used", "FDC"] as string[]).includes(condition)) { errors.push({ row: rowNumber, message: "Invalid condition" }); return; } if (!(["owned", "wishlist", "duplicate", "swap"] as string[]).includes(status)) { errors.push({ row: rowNumber, message: "Invalid status" }); return; } if (!(["superb", "very_fine", "fine", "average", "damaged", "ungraded"] as string[]).includes(grade)) { errors.push({ row: rowNumber, message: "Invalid grade" }); return; } if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100_000 || !Number.isFinite(purchasePrice) || purchasePrice < 0 || purchasePrice > 1_000_000 || !isValidIsoDate(acquiredAt)) { errors.push({ row: rowNumber, message: "Invalid quantity, price, or acquired date" }); return; } if (customTags.length > 24 || customTags.some((tag) => tag.length > 48)) { errors.push({ row: rowNumber, message: "Too many or overly long tags" }); return; } seenSlugs.add(stampSlug); rows.push({ stampSlug, condition: condition as CsvImportRow["condition"], quantity, collectionStatus: status as CsvImportRow["collectionStatus"], grade: grade as CsvImportRow["grade"], purchasePrice, acquiredAt, storageLocation: valueAt(cells, index, ["storage location", "storage"]) || null, customTags, notes: valueAt(cells, index, ["notes"]) }); });
  return { rows, errors };
}

function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character); }
export function buildPrintableCollectionReport(rows: Array<{ title: string; country: string; year: number | null; condition: string; quantity: number; collectionStatus: string; grade: string; purchasePrice: number; storageLocation: string | null; tags: string[] }>) {
  const body = rows.map((row) => `<tr><td>${escapeHtml(row.title)}</td><td>${escapeHtml(row.country)}</td><td>${row.year ?? "—"}</td><td>${escapeHtml(row.condition)}</td><td>${row.quantity}</td><td>${escapeHtml(row.collectionStatus)}</td><td>${escapeHtml(row.grade)}</td><td>$${row.purchasePrice.toFixed(2)}</td><td>${escapeHtml(row.storageLocation || "—")}</td><td>${escapeHtml(row.tags.join(", ") || "—")}</td></tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>StampAtlas inventory report</title><style>body{font:14px/1.45 system-ui,sans-serif;color:#173a34;margin:32px}h1{font-family:Georgia,serif}p{color:#5d7167}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #cddbd0;padding:8px;text-align:left;vertical-align:top}th{background:#e9f1e9;font-size:11px;text-transform:uppercase;letter-spacing:.06em}@media print{body{margin:16px}}</style></head><body><h1>StampAtlas inventory report</h1><p>Generated ${escapeHtml(new Date().toLocaleString())} · ${rows.length} filtered record(s)</p><table><thead><tr><th>Stamp</th><th>Country</th><th>Year</th><th>Condition</th><th>Qty</th><th>Status</th><th>Grade</th><th>Cost</th><th>Storage</th><th>Tags</th></tr></thead><tbody>${body}</tbody></table></body></html>`;
}
