// Shared CSV utility functions

/**
 * Properly escapes CSV values by:
 * 1. Neutralizing CSV formula injection (=, +, -, @, tab)
 * 2. Handling quotes, commas, and newlines
 */
export function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  let stringValue = String(value);
  
  // Neutralize CSV formula injection by prefixing dangerous characters with single quote
  if (/^[=+\-@\t]/.test(stringValue.trim())) {
    stringValue = "'" + stringValue;
  }
  
  // If the value contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Creates a properly formatted CSV content string with UTF-8 BOM for Excel compatibility
 */
export function createCsvContent(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const utf8Bom = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const csvHeaders = headers.map(escapeCsvValue).join(',');
  const csvRows = rows.map(row => row.map(escapeCsvValue).join(','));
  
  return utf8Bom + [csvHeaders, ...csvRows].join('\n');
}

/**
 * Downloads CSV content as a file
 */
export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Available months for export selection
 */
export const AVAILABLE_MONTHS = [
  { value: 'Aug-25', label: 'August 2025' },
  { value: 'Sep-25', label: 'September 2025' },
  { value: 'Oct-25', label: 'October 2025' },
  { value: 'Nov-25', label: 'November 2025' },
  { value: 'Dec-25', label: 'December 2025' },
] as const;

export type AvailableMonth = typeof AVAILABLE_MONTHS[number]['value'];