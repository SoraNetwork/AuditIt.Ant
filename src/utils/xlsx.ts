export interface SheetPayload {
  name: string;
  rows: Record<string, unknown>[];
}

type XlsxModule = typeof import('xlsx');

let xlsxModulePromise: Promise<XlsxModule> | null = null;

const loadXlsx = () => {
  xlsxModulePromise ??= import('xlsx');
  return xlsxModulePromise;
};

export async function exportToXlsx(
  rows: Record<string, unknown>[],
  filename: string,
  sheetName = 'Sheet1'
): Promise<void> {
  const XLSX = await loadXlsx();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, filename);
}

export async function exportMultiSheetXlsx(sheets: SheetPayload[], filename: string): Promise<void> {
  const XLSX = await loadXlsx();
  const workbook = XLSX.utils.book_new();
  for (const s of sheets) {
    const ws = XLSX.utils.json_to_sheet(s.rows);
    XLSX.utils.book_append_sheet(workbook, ws, s.name.slice(0, 31));
  }
  XLSX.writeFile(workbook, filename);
}

export async function parseXlsxFile<T = Record<string, unknown>>(
  file: File,
  sheetName?: string
): Promise<T[]> {
  const XLSX = await loadXlsx();
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const target = sheetName
    ? workbook.Sheets[sheetName] ?? workbook.Sheets[workbook.SheetNames[0]]
    : workbook.Sheets[workbook.SheetNames[0]];
  if (!target) return [];
  return XLSX.utils.sheet_to_json<T>(target, { defval: '' });
}

export async function parseXlsxFileSheets(
  file: File
): Promise<Record<string, Record<string, unknown>[]>> {
  const XLSX = await loadXlsx();
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const out: Record<string, Record<string, unknown>[]> = {};
  for (const name of workbook.SheetNames) {
    out[name] = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[name], { defval: '' });
  }
  return out;
}
