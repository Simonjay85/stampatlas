export function reorderIds(ids: string[], itemId: string, direction: -1 | 1) {
  const from = ids.indexOf(itemId);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= ids.length) return ids;
  const reordered = [...ids];
  [reordered[from], reordered[to]] = [reordered[to], reordered[from]];
  return reordered;
}

export function buildCollectionCsv(rows: Array<{ title: string; country: string; year: number; condition: string; purchasePrice: number; acquiredAt: string; notes: string }>) {
  const header = ["Stamp", "Country", "Year", "Condition", "Purchase price", "Acquired date", "Notes"];
  const values = rows.map((row) => [row.title, row.country, String(row.year), row.condition, String(row.purchasePrice), row.acquiredAt, row.notes]);
  return [header, ...values].map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n");
}
