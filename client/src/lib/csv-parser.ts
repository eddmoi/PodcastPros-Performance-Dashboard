export interface CSVRow {
  empNo: number;
  name: string;
  month: string;
  productiveHours: string;
  hours: number;
  productivity: number;
}

export interface ParsedCSVData {
  data: CSVRow[];
  errors: string[];
}

export class CSVParser {
  static parseCSV(csvContent: string): ParsedCSVData {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const errors: string[] = [];
    const data: CSVRow[] = [];

    if (lines.length < 2) {
      errors.push("CSV file must contain headers and at least one data row");
      return { data, errors };
    }

    // Skip header row and parse data
    const dataRows = lines.slice(1);

    for (let i = 0; i < dataRows.length; i++) {
      try {
        const columns = dataRows[i].split(',').map(col => col.trim().replace(/"/g, ''));
        
        if (columns.length < 6) {
          errors.push(`Row ${i + 2}: Insufficient columns (expected 6, got ${columns.length})`);
          continue;
        }

        const empNo = this.parseNumber(columns[0], `Row ${i + 2}: Invalid employee number`);
        const name = columns[1];
        const month = columns[2];
        const productiveHours = columns[3];
        const hours = this.parseNumber(columns[4], `Row ${i + 2}: Invalid hours value`);
        const productivity = this.parseNumber(columns[5], `Row ${i + 2}: Invalid productivity value`);

        if (empNo === null || hours === null || productivity === null) {
          // Error already added by parseNumber
          continue;
        }

        if (!name || !month) {
          errors.push(`Row ${i + 2}: Name and month are required`);
          continue;
        }

        if (!this.isValidMonthFormat(month)) {
          errors.push(`Row ${i + 2}: Invalid month format. Expected format: Mon-YY (e.g., Aug-25)`);
          continue;
        }

        data.push({
          empNo,
          name,
          month,
          productiveHours,
          hours,
          productivity,
        });

      } catch (error) {
        errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Invalid data format'}`);
      }
    }

    return { data, errors };
  }

  static parseProductiveHours(productiveHoursStr: string): number {
    // Handle time format (e.g., "114:39:00")
    if (productiveHoursStr.includes(':')) {
      const parts = productiveHoursStr.split(':');
      if (parts.length >= 2) {
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        const seconds = parts.length > 2 ? parseInt(parts[2]) || 0 : 0;
        return hours + (minutes / 60) + (seconds / 3600);
      }
    }
    
    // Handle decimal format
    const parsed = parseFloat(productiveHoursStr);
    return isNaN(parsed) ? 0 : parsed;
  }

  private static parseNumber(value: string, errorMessage: string): number | null {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      return null;
    }
    return parsed;
  }

  private static isValidMonthFormat(month: string): boolean {
    // Check format: Mon-YY (e.g., Aug-25, Sep-25)
    const monthPattern = /^[A-Za-z]{3}-\d{2}$/;
    return monthPattern.test(month);
  }

  static validateEmployeeData(data: CSVRow[]): string[] {
    const errors: string[] = [];
    const validMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    data.forEach((row, index) => {
      const rowNum = index + 2; // +2 because we skip header and start from 1

      // Validate employee number range
      if (row.empNo < 1 || row.empNo > 999) {
        errors.push(`Row ${rowNum}: Employee number should be between 1 and 999`);
      }

      // Validate month abbreviation
      const monthAbbr = row.month.split('-')[0];
      if (!validMonths.includes(monthAbbr)) {
        errors.push(`Row ${rowNum}: Invalid month abbreviation "${monthAbbr}". Use standard 3-letter abbreviations (Jan, Feb, etc.)`);
      }

      // Validate productivity percentage
      if (row.productivity < 0 || row.productivity > 100) {
        errors.push(`Row ${rowNum}: Productivity should be between 0 and 100`);
      }

      // Validate hours are positive
      if (row.hours < 0) {
        errors.push(`Row ${rowNum}: Hours cannot be negative`);
      }

      // Validate productive hours don't exceed total hours
      const productiveHoursDecimal = this.parseProductiveHours(row.productiveHours);
      if (productiveHoursDecimal > row.hours) {
        errors.push(`Row ${rowNum}: Productive hours (${productiveHoursDecimal.toFixed(2)}) cannot exceed total hours (${row.hours})`);
      }
    });

    return errors;
  }

  static generateSampleCSV(): string {
    return `Emp No.,Name,Month,Productive Hours,Hours,Productivity
1,MK Tolete,Aug-25,114:39:00,114.65,95.20
2,Almeerah Nasheed,Aug-25,82:51:00,82.85,97.47
4,Hannah Gabiana,Aug-25,199:20:00,199.33,97.76
6,Ukthila Banuka,Aug-25,224:22:00,224.37,85.65
7,Ritz Villagonzalo,Aug-25,173:43:00,173.72,96.51
8,Abu Hurarah,Aug-25,146:48:00,146.80,96.58
9,Masood Mansha,Aug-25,131:34:00,131.57,96.74
10,Allona Mae,Aug-25,35:26:00,35.43,88.58
12,Raven Valerie,Aug-25,174:03:00,174.05,96.69
14,Eddierez Abarico,Aug-25,129:59:00,129.98,96.28
18,Adnan Mazhar,Aug-25,100:25:00,100.42,95.64
23,Nick Uresin,Aug-25,171:56:00,171.93,96.59`;
  }

  static convertToInsertData(csvRows: CSVRow[]) {
    return csvRows.map(row => ({
      employeeId: row.empNo,
      month: row.month,
      productiveHours: this.parseProductiveHours(row.productiveHours),
      totalHours: row.hours,
      productivity: row.productivity,
    }));
  }
}
