// Server-side CSV utility functions with proper escaping and UTF-8 BOM

/**
 * Properly escapes a CSV field value by:
 * 1. Neutralizing CSV formula injection (=, +, -, @, tab)
 * 2. Wrapping in quotes if it contains commas, quotes, or newlines
 * 3. Escaping internal quotes by doubling them
 */
function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  let stringValue = String(value);
  
  // Neutralize CSV formula injection by prefixing dangerous characters with single quote
  if (/^[=+\-@\t]/.test(stringValue.trim())) {
    stringValue = "'" + stringValue;
  }
  
  // Check if the field needs to be quoted
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    // Escape quotes by doubling them and wrap in quotes
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Converts an array of arrays to a properly formatted CSV string with UTF-8 BOM
 */
export function generateCsv(data: (string | number | null | undefined)[][]): string {
  // UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  
  const csvContent = data
    .map(row => row.map(escapeCsvField).join(','))
    .join('\n');
    
  return BOM + csvContent;
}

/**
 * Sets proper CSV response headers for file download
 */
export function setCsvHeaders(res: any, filename: string): void {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
}