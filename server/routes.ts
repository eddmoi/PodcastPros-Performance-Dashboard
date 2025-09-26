import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductivityDataSchema, insertContractorSchema, type CSVUploadData, type Contractor, statusEnum } from "@shared/schema";
import multer from "multer";
import { z } from "zod";
import "./types"; // Import session type declarations
import { generateCsv, setCsvHeaders } from "./csv-utils";
import { passwordManager } from "./password-manager";

// Simple in-memory rate limiter for login attempts
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);
  
  if (!attempts || now > attempts.resetTime) {
    // Reset or create new attempt record
    loginAttempts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    return false; // Rate limited
  }
  
  attempts.count++;
  return true;
}

function resetRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}

// CSV parsing helper - handles quoted fields with commas
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add final field
  result.push(current.trim());
  return result;
}

// Check if headers match expected format (case-insensitive, flexible whitespace)
function headersMatch(received: string[], expected: string[]): boolean {
  if (received.length !== expected.length) return false;
  
  for (let i = 0; i < expected.length; i++) {
    const receivedHeader = received[i].trim().toLowerCase().replace(/\s+/g, ' ');
    const expectedHeader = expected[i].trim().toLowerCase().replace(/\s+/g, ' ');
    if (receivedHeader !== expectedHeader) {
      return false;
    }
  }
  return true;
}

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Session-based admin authentication middleware
function requireAdmin(req: any, res: any, next: any) {
  if (!req.session?.isAdmin) {
    return res.status(401).json({ message: 'Admin access required' });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    const { password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    
    try {
      // Check rate limit
      if (!checkRateLimit(clientIp)) {
        console.log(`Rate limit exceeded for IP: ${clientIp}`);
        return res.status(429).json({ 
          success: false, 
          message: 'Too many login attempts. Please try again in 15 minutes.' 
        });
      }
      
      const isValid = await passwordManager.verifyPassword(password);
      
      if (isValid) {
        // Reset rate limit on successful login
        resetRateLimit(clientIp);
        req.session.isAdmin = true;
        res.json({ success: true, message: 'Login successful' });
      } else {
        console.log(`Failed login attempt from IP: ${clientIp}`);
        res.status(401).json({ success: false, message: 'Invalid password' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Login failed' });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.json({ success: true, message: 'Logout successful' });
    });
  });

  app.get("/api/auth/status", (req, res) => {
    res.json({ isAdmin: !!req.session?.isAdmin });
  });

  // Change admin password (requires admin authentication)
  app.post("/api/auth/change-password", requireAdmin, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    try {
      // Validate new password (align with ADMIN_PASSWORD policy)
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long for security' });
      }
      
      // Use password manager to change password (it verifies current password internally)
      const success = await passwordManager.changePassword(currentPassword, newPassword);
      
      if (success) {
        res.json({ 
          success: true, 
          message: 'Password changed successfully. The new password is now active.',
        });
      } else {
        res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ success: false, message: 'Password change failed' });
    }
  });

  // Get all contractors
  app.get("/api/contractors", async (req, res) => {
    try {
      const contractors = await storage.getAllContractors();
      res.json(contractors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contractors" });
    }
  });

  // Get contractors with productivity data
  app.get("/api/contractors/with-data", async (req, res) => {
    try {
      const contractorsWithData = await storage.getContractorsWithData();
      res.json(contractorsWithData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contractors with data" });
    }
  });

  // Get productivity data by month
  app.get("/api/productivity/:month", async (req, res) => {
    try {
      const { month } = req.params;
      const data = await storage.getProductivityDataByMonth(month);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch productivity data" });
    }
  });

  // Delete productivity data by month (admin only)
  app.delete("/api/productivity/:month", requireAdmin, async (req, res) => {
    try {
      const { month } = req.params;
      
      // Validate month parameter format (e.g., "Aug-25", "Dec-24")
      const monthSchema = z.string().regex(/^[A-Za-z]{3}-\d{2}$/, {
        message: "Month must be in format 'MMM-YY' (e.g., 'Aug-25')"
      });

      const validationResult = monthSchema.safeParse(month);
      if (!validationResult.success) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid month format. Expected format: 'MMM-YY' (e.g., 'Aug-25')",
          error: validationResult.error.issues[0]?.message
        });
      }

      // Check origin header as basic CSRF protection
      const origin = req.get('origin');
      const host = req.get('host');
      
      // Allow requests from the same host (covers both localhost and Replit domains)
      if (origin) {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return res.status(403).json({
            success: false,
            message: "Forbidden: Invalid origin"
          });
        }
      }

      const success = await storage.deleteProductivityByMonth(month);
      
      if (success) {
        // Log the deletion for audit trail
        console.log(`Admin deleted productivity data for month: ${month} from IP: ${req.ip || 'unknown'} at ${new Date().toISOString()}`);
        
        res.json({ 
          success: true, 
          message: `Successfully deleted all productivity data for ${month}` 
        });
      } else {
        res.status(404).json({ 
          success: false, 
          message: `No productivity data found for ${month}` 
        });
      }
    } catch (error) {
      console.error("Delete productivity data error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to delete productivity data" 
      });
    }
  });

  // Get monthly rankings
  app.get("/api/rankings/:month", async (req, res) => {
    try {
      const { month } = req.params;
      const rankings = await storage.getMonthlyRankings(month);
      res.json(rankings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rankings" });
    }
  });

  // Get top performers
  app.get("/api/top-performers/:month", async (req, res) => {
    try {
      const { month } = req.params;
      const limit = parseInt(req.query.limit as string) || 3;
      const topPerformers = await storage.getTopPerformers(month, limit);
      res.json(topPerformers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch top performers" });
    }
  });

  // Get under performers
  app.get("/api/under-performers/:month", async (req, res) => {
    try {
      const { month } = req.params;
      // Threshold is now determined by contractor type: Full Time < 100h, Part Time < 50h
      const underPerformers = await storage.getUnderPerformers(month, 0); // Pass 0 as dummy value since method now uses contractor type logic
      res.json(underPerformers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch under performers" });
    }
  });

  // Upload CSV file
  app.post("/api/upload-csv", requireAdmin, upload.single('csvFile'), async (req, res) => {
    try {
      console.log(`CSV upload attempt - Admin: ${!!req.session?.isAdmin}, File: ${req.file?.originalname}, Size: ${req.file?.size}`);
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV file must contain headers and at least one data row" });
      }

      // Parse and validate headers
      const headerLine = lines[0];
      const expectedHeaders = ['Emp No.', 'Name', 'Month', 'Productive Hours', 'Hours', 'Productivity'];
      const headers = parseCSVLine(headerLine).map(h => h.trim().replace(/"/g, '').replace(/\uFEFF/g, ''));
      console.log(`Headers received: ${JSON.stringify(headers)}`);
      
      if (!headersMatch(headers, expectedHeaders)) {
        // Check if this looks like a contractor roster file
        const rosterHeaders = ['Name', 'ID', 'Personal Email', 'Work Email', 'Work Location', 'Position', 'Start Date', 'Separation Date', 'Birthday'];
        if (headersMatch(headers, rosterHeaders)) {
          return res.status(400).json({ 
            message: "This appears to be a contractor roster file. Please switch to 'Contractor Roster' upload type.",
            expected: expectedHeaders,
            received: headers
          });
        }
        
        return res.status(400).json({ 
          message: "CSV headers don't match expected format for productivity data", 
          expected: expectedHeaders,
          received: headers
        });
      }

      // Skip header row and parse data
      const dataRows = lines.slice(1);
      const productivityData = [];
      const errors = [];

      for (let i = 0; i < dataRows.length; i++) {
        try {
          const columns = parseCSVLine(dataRows[i]);
          
          if (columns.length < 6) {
            errors.push(`Row ${i + 2}: Insufficient columns (expected 6, got ${columns.length})`);
            continue;
          }

          const empNo = parseInt(columns[0]);
          const name = columns[1];
          let month = columns[2];
          const productiveHoursStr = columns[3];
          const hours = parseFloat(columns[4]) || 0;
          
          // Fix month format: convert "25-Aug" to "Aug-25"
          if (month.match(/^\d{2}-\w{3}$/)) {
            const [day, monthName] = month.split('-');
            month = `${monthName}-${day}`;
          }
          
          // Parse productive hours from time format (e.g., "114:39:00") or use as decimal
          let productiveHours = 0;
          if (productiveHoursStr && productiveHoursStr.trim() && productiveHoursStr.includes(':')) {
            const [h, m, s] = productiveHoursStr.split(':').map(n => parseInt(n));
            productiveHours = h + (m / 60) + (s / 3600);
          } else if (productiveHoursStr && productiveHoursStr.trim() !== '') {
            productiveHours = parseFloat(productiveHoursStr) || 0;
          }

          // Extract productivity from CSV and convert from decimal to percentage if needed
          const productivityStr = (columns[5] || '').replace('%', '').trim();
          let productivity = 0;
          if (productivityStr) {
            const productivityValue = parseFloat(productivityStr);
            // If the value is between 0 and 1 (inclusive), assume it's a decimal and convert to percentage
            if (productivityValue > 0 && productivityValue <= 1) {
              productivity = productivityValue * 100;
            } else {
              // Otherwise assume it's already a percentage
              productivity = productivityValue;
            }
          }

          // Validate the contractor exists
          const contractor = await storage.getContractor(empNo);
          if (!contractor) {
            errors.push(`Row ${i + 2}: Contractor ${empNo} (${name}) not found in roster`);
            continue;
          }

          const dataToInsert = {
            contractorId: empNo,
            month,
            productiveHours,
            totalHours: hours,
            productivity,
          };

          // Validate against schema
          insertProductivityDataSchema.parse(dataToInsert);
          productivityData.push(dataToInsert);

        } catch (error) {
          errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Invalid data format'}`);
        }
      }

      if (errors.length > 0 && productivityData.length === 0) {
        return res.status(400).json({ 
          message: "No valid data to process", 
          errors: errors.slice(0, 10) // Limit to first 10 errors
        });
      }

      // Insert valid data
      const insertedData = await storage.bulkCreateProductivityData(productivityData);

      res.json({
        message: `Successfully processed ${insertedData.length} records`,
        processed: insertedData.length,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
        data: insertedData,
      });

    } catch (error) {
      console.error('CSV upload error:', error);
      console.error('CSV upload error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ 
        message: "Failed to process CSV file",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Upload Contractor Roster CSV file
  app.post("/api/upload-contractor-roster", requireAdmin, upload.single('csvFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV file must contain headers and at least one data row" });
      }

      // Parse header and validate expected format
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').replace(/\uFEFF/g, ''));
      const expectedHeaders = ['Name', 'ID', 'Personal Email', 'Work Email', 'Work Location', 'Position', 'Start Date', 'Separation Date', 'Birthday'];
      
      // Validate headers match expected format
      const headersMatch = expectedHeaders.every((header, index) => headers[index] === header);
      if (!headersMatch) {
        return res.status(400).json({ 
          message: "CSV headers don't match expected format", 
          expected: expectedHeaders,
          received: headers
        });
      }
      
      // Skip header row and parse data
      const dataRows = lines.slice(1);
      const contractorData = [];
      const errors = [];

      for (let i = 0; i < dataRows.length; i++) {
        try {
          const columns = dataRows[i].split(',').map(col => col.trim().replace(/"/g, ''));
          
          if (columns.length < 9) {
            errors.push(`Row ${i + 2}: Insufficient columns (expected 9, got ${columns.length})`);
            continue;
          }

          const [name, idStr, personalEmail, workEmail, workLocation, position, startDate, separationDate, birthday] = columns;

          const id = parseInt(idStr);
          if (isNaN(id)) {
            errors.push(`Row ${i + 2}: Invalid ID '${idStr}' - must be a number`);
            continue;
          }

          const contractorToInsert = {
            id,
            name: name || "",
            personalEmail: personalEmail || "",
            workEmail: workEmail || "", 
            workLocation: workLocation || "",
            position: position || "",
            startDate: startDate || "",
            separationDate: separationDate || "",
            birthday: birthday || "",
            status: "active" as const,
          };

          // Validate against schema
          insertContractorSchema.parse(contractorToInsert);
          contractorData.push(contractorToInsert);

        } catch (error) {
          errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Invalid data format'}`);
        }
      }

      if (errors.length > 0 && contractorData.length === 0) {
        return res.status(400).json({ 
          message: "No valid contractor data to process", 
          errors: errors.slice(0, 10) // Limit to first 10 errors
        });
      }

      // Insert valid data
      const insertedContractors = await storage.bulkCreateContractors(contractorData);

      res.json({
        message: `Successfully processed ${insertedContractors.length} contractors`,
        processed: insertedContractors.length,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
        data: insertedContractors,
      });

    } catch (error) {
      console.error('Contractor roster CSV upload error:', error);
      res.status(500).json({ message: "Failed to process contractor roster CSV file" });
    }
  });

  // Get dashboard summary
  app.get("/api/dashboard/summary", async (req, res) => {
    try {
      const contractors = await storage.getAllContractors();
      const currentMonth = "Aug-25"; // Default current month
      const monthData = await storage.getProductivityDataByMonth(currentMonth);
      const topPerformers = await storage.getTopPerformers(currentMonth, 3);
      
      // Helper function to get thresholds based on contractor type
      const getThresholds = (contractorType: string) => {
        if (contractorType === 'Part Time') {
          return { high: 86.7, medium: 50, low: 0 };
        }
        return { high: 173.3, medium: 100, low: 0 };
      };
      
      // Get contractor data with types to calculate threshold-based metrics
      const contractorsWithData = await storage.getContractorsWithData();
      const activeContractorsWithData = contractorsWithData.filter(c => c.status === 'active');
      
      // Calculate underperformers based on new thresholds (below medium threshold)
      const underPerformers = activeContractorsWithData
        .map(contractor => {
          const monthProductivity = contractor.productivityData.find(data => data.month === currentMonth);
          if (!monthProductivity || monthProductivity.productiveHours <= 0) return null;
          
          const thresholds = getThresholds(contractor.contractorType);
          const isUnderperforming = monthProductivity.productiveHours < thresholds.medium;
          
          return isUnderperforming ? {
            contractorId: contractor.id,
            name: contractor.name,
            hours: monthProductivity.productiveHours,
            rank: 0, // Will be set after sorting
            month: currentMonth,
          } : null;
        })
        .filter(performer => performer !== null)
        .sort((a, b) => a!.hours - b!.hours)
        .map((performer, index) => ({ ...performer!, rank: index + 1 }));
      
      const totalHours = monthData.reduce((sum, data) => sum + data.productiveHours, 0);
      const avgHours = monthData.length > 0 ? totalHours / monthData.length : 0;
      
      // Calculate above threshold percentage using new thresholds (above medium threshold)
      const contractorsWithProductivity = activeContractorsWithData.filter(contractor => {
        const monthProductivity = contractor.productivityData.find(data => data.month === currentMonth);
        return monthProductivity && monthProductivity.productiveHours > 0;
      });
      
      const aboveThreshold = contractorsWithProductivity.filter(contractor => {
        const monthProductivity = contractor.productivityData.find(data => data.month === currentMonth);
        if (!monthProductivity) return false;
        
        const thresholds = getThresholds(contractor.contractorType);
        return monthProductivity.productiveHours >= thresholds.medium;
      }).length;
      
      const thresholdPercentage = contractorsWithProductivity.length > 0 
        ? (aboveThreshold / contractorsWithProductivity.length) * 100 
        : 0;

      res.json({
        totalContractors: contractors.filter(c => c.status === 'active').length,
        totalHours: Math.round(totalHours * 100) / 100,
        averageHours: Math.round(avgHours * 100) / 100,
        aboveThresholdPercentage: Math.round(thresholdPercentage),
        topPerformers,
        underPerformers,
        currentMonth,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard summary" });
    }
  });

  // Get dashboard special sections (birthdays, anniversaries, holidays)
  app.get("/api/dashboard/special-sections", async (req, res) => {
    try {
      const contractors = await storage.getAllContractors();
      const activeContractors = contractors.filter(c => c.status === 'active');
      
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentDay = today.getDate();
      
      // Calculate upcoming birthdays (next 30 days)
      const upcomingBirthdays = activeContractors
        .filter(contractor => contractor.birthday && contractor.birthday !== "")
        .map(contractor => {
          const birthday = new Date(contractor.birthday!);
          const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
          
          // If birthday has passed this year, check next year
          if (thisYearBirthday < today) {
            thisYearBirthday.setFullYear(today.getFullYear() + 1);
          }
          
          const daysUntilBirthday = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          return {
            name: contractor.name,
            birthday: contractor.birthday,
            daysUntil: daysUntilBirthday
          };
        })
        .filter(birthday => birthday.daysUntil <= 30)
        .sort((a, b) => a.daysUntil - b.daysUntil);
      
      // Calculate 1-year anniversaries (contractors who started around this time last year)
      const oneYearAnniversaries = activeContractors
        .filter(contractor => contractor.startDate && contractor.startDate !== "")
        .map(contractor => {
          const startDate = new Date(contractor.startDate!);
          const anniversaryThisYear = new Date(today.getFullYear(), startDate.getMonth(), startDate.getDate());
          
          // Check if anniversary is within next 30 days this year
          const daysUntilAnniversary = Math.ceil((anniversaryThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const yearsWorked = today.getFullYear() - startDate.getFullYear();
          
          return {
            name: contractor.name,
            startDate: contractor.startDate,
            daysUntil: daysUntilAnniversary,
            yearsWorked
          };
        })
        .filter(anniversary => {
          // Show if anniversary is within next 30 days and they've worked for at least 1 year
          return anniversary.daysUntil >= 0 && anniversary.daysUntil <= 30 && anniversary.yearsWorked >= 1;
        })
        .sort((a, b) => a.daysUntil - b.daysUntil);
      
      // Calculate remaining US holidays for 2025
      const holidays2025 = [
        { name: "New Year's Day", date: "2025-01-01" },
        { name: "Martin Luther King Jr. Day", date: "2025-01-20" },
        { name: "Presidents' Day", date: "2025-02-17" },
        { name: "Memorial Day", date: "2025-05-26" },
        { name: "Independence Day", date: "2025-07-04" },
        { name: "Labor Day", date: "2025-09-01" },
        { name: "Columbus Day", date: "2025-10-13" },
        { name: "Veterans Day", date: "2025-11-11" },
        { name: "Thanksgiving", date: "2025-11-27" },
        { name: "Christmas Day", date: "2025-12-25" }
      ];
      
      const remainingHolidays = holidays2025
        .map(holiday => {
          const holidayDate = new Date(holiday.date);
          const daysUntil = Math.ceil((holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          return {
            name: holiday.name,
            date: holiday.date,
            daysUntil
          };
        })
        .filter(holiday => holiday.daysUntil >= 0)
        .sort((a, b) => a.daysUntil - b.daysUntil);

      res.json({
        upcomingBirthdays,
        oneYearAnniversaries,
        remainingHolidays
      });
    } catch (error) {
      console.error('Special sections error:', error);
      res.status(500).json({ message: "Failed to fetch special sections data" });
    }
  });

  // Create contractor
  app.post("/api/contractors", requireAdmin, async (req, res) => {
    try {
      // Validate the request body against contractor schema (ID is optional for creation)
      const contractorData = insertContractorSchema.parse(req.body);
      
      const newContractor = await storage.createContractor(contractorData);
      res.status(201).json(newContractor);
    } catch (error) {
      console.error('Create contractor error:', error);
      // Handle validation errors as 400, others as 500
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create contractor" });
    }
  });

  // Update contractor
  app.put("/api/contractors/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid contractor ID" });
      }

      // Remove id from request body to prevent ID mutation
      const { id: _ignoredId, ...bodyWithoutId } = req.body;
      
      // Validate the request body against contractor schema with proper status validation
      const updateSchema = insertContractorSchema.omit({ id: true }).partial().extend({
        status: statusEnum.optional()
      });
      const updateData = updateSchema.parse(bodyWithoutId);
      
      const updatedContractor = await storage.updateContractor(id, updateData);
      if (!updatedContractor) {
        return res.status(404).json({ message: "Contractor not found" });
      }

      res.json(updatedContractor);
    } catch (error) {
      console.error('Update contractor error:', error);
      // Handle validation errors as 400, others as 500
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update contractor" });
    }
  });

  // Archive contractor (instead of deleting to preserve productivity data)
  app.delete("/api/contractors/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid contractor ID" });
      }

      const archived = await storage.archiveContractor(id);
      if (!archived) {
        return res.status(404).json({ message: "Contractor not found" });
      }

      res.status(200).json({ success: true, message: "Contractor archived successfully. Data preserved for historical records." });
    } catch (error) {
      console.error('Archive contractor error:', error);
      res.status(500).json({ message: "Failed to archive contractor" });
    }
  });

  // Export endpoints
  
  // Export contractors data
  app.get("/api/export/contractors", requireAdmin, async (req, res) => {
    try {
      const contractors = await storage.getAllContractors();
      
      // Create CSV data (excluding PII fields for security)
      const headers = ['ID', 'Name', 'Work Location', 'Position', 'Start Date', 'Status'];
      
      // Create CSV rows (excluding personal email, work email, separation date, birthday)
      const rows = contractors.map(contractor => [
        contractor.id,
        contractor.name,
        contractor.workLocation,
        contractor.position,
        contractor.startDate,
        contractor.status
      ]);
      
      // Generate properly escaped CSV with UTF-8 BOM
      const csvContent = generateCsv([headers, ...rows]);
      
      // Set proper headers for file download
      setCsvHeaders(res, 'contractors.csv');
      res.send(csvContent);
      
    } catch (error) {
      res.status(500).json({ message: "Failed to export contractors data" });
    }
  });

  // Export productivity data by month
  app.get("/api/export/productivity/:month", requireAdmin, async (req, res) => {
    try {
      const { month } = req.params;
      const data = await storage.getProductivityDataByMonth(month);
      
      // Create CSV data
      const headers = ['Contractor ID', 'Name', 'Month', 'Productive Hours', 'Total Hours', 'Productivity %'];
      
      // Create CSV rows with contractor names
      const contractorsMap = new Map();
      const contractors = await storage.getAllContractors();
      contractors.forEach(c => contractorsMap.set(c.id, c.name));
      
      const rows = data.map(item => [
        item.contractorId,
        contractorsMap.get(item.contractorId) || 'Unknown',
        item.month,
        item.productiveHours.toFixed(2),
        item.totalHours.toFixed(2),
        item.productivity.toFixed(1)
      ]);
      
      // Generate properly escaped CSV with UTF-8 BOM
      const csvContent = generateCsv([headers, ...rows]);
      
      // Set proper headers for file download
      setCsvHeaders(res, `productivity-${month}.csv`);
      res.send(csvContent);
      
    } catch (error) {
      res.status(500).json({ message: "Failed to export productivity data" });
    }
  });

  // Export rankings by month
  app.get("/api/export/rankings/:month", requireAdmin, async (req, res) => {
    try {
      const { month } = req.params;
      const rankings = await storage.getMonthlyRankings(month);
      
      // Create CSV data
      const headers = ['Rank', 'Contractor ID', 'Name', 'Month', 'Productive Hours'];
      
      // Create CSV rows
      const rows = rankings.map(ranking => [
        ranking.rank,
        ranking.contractorId,
        ranking.name,
        ranking.month,
        ranking.hours.toFixed(2)
      ]);
      
      // Generate properly escaped CSV with UTF-8 BOM
      const csvContent = generateCsv([headers, ...rows]);
      
      // Set proper headers for file download
      setCsvHeaders(res, `rankings-${month}.csv`);
      res.send(csvContent);
      
    } catch (error) {
      res.status(500).json({ message: "Failed to export rankings data" });
    }
  });

  // Export under performers by month
  app.get("/api/export/under-performers/:month", requireAdmin, async (req, res) => {
    try {
      const { month } = req.params;
      // Use contractor type-based thresholds: Full Time < 100h, Part Time < 50h
      const underPerformers = await storage.getUnderPerformers(month, 0); // Pass 0 as dummy value since method now uses contractor type logic
      
      // Create CSV data
      const headers = ['Contractor ID', 'Name', 'Month', 'Productive Hours', 'Productivity %', 'Threshold Type'];
      
      // Create CSV rows with contractor type information
      const contractors = await storage.getAllContractors();
      const rows = underPerformers.map(performer => {
        const contractor = contractors.find(c => c.id === performer.contractorId);
        const contractorType = contractor?.contractorType || 'Full Time';
        const threshold = contractorType === 'Part Time' ? '< 50h' : '< 100h';
        
        return [
          performer.contractorId,
          performer.name,
          performer.month,
          performer.hours.toFixed(2),
          (performer.hours / 160 * 100).toFixed(1), // Calculate productivity percentage
          `${contractorType} ${threshold}`
        ];
      });
      
      // Generate properly escaped CSV with UTF-8 BOM
      const csvContent = generateCsv([headers, ...rows]);
      
      // Set proper headers for file download
      setCsvHeaders(res, `under-performers-${month}.csv`);
      res.send(csvContent);
      
    } catch (error) {
      res.status(500).json({ message: "Failed to export under performers data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
