import { type Contractor, type InsertContractor, type ProductivityData, type InsertProductivityData, type ContractorWithData, type MonthlyRanking } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Contractor operations
  getContractor(id: number): Promise<Contractor | undefined>;
  getAllContractors(): Promise<Contractor[]>;
  createContractor(contractor: InsertContractor): Promise<Contractor>;
  updateContractor(id: number, contractor: Partial<Contractor>): Promise<Contractor | undefined>;
  deleteContractor(id: number): Promise<boolean>;
  archiveContractor(id: number): Promise<boolean>;
  
  // Productivity data operations
  getProductivityData(contractorId: number): Promise<ProductivityData[]>;
  getAllProductivityData(): Promise<ProductivityData[]>;
  getProductivityDataByMonth(month: string): Promise<ProductivityData[]>;
  createProductivityData(data: InsertProductivityData): Promise<ProductivityData>;
  updateProductivityData(contractorId: number, month: string, data: Partial<ProductivityData>): Promise<ProductivityData | undefined>;
  deleteProductivityByMonth(month: string): Promise<boolean>;
  
  // Combined operations
  getContractorsWithData(): Promise<ContractorWithData[]>;
  getMonthlyRankings(month: string): Promise<MonthlyRanking[]>;
  getTopPerformers(month: string, limit: number): Promise<MonthlyRanking[]>;
  getUnderPerformers(month: string, threshold: number): Promise<MonthlyRanking[]>;
  
  // Bulk operations
  bulkCreateProductivityData(data: InsertProductivityData[]): Promise<ProductivityData[]>;
  bulkCreateContractors(data: InsertContractor[]): Promise<Contractor[]>;
}

export class MemStorage implements IStorage {
  private contractors: Map<number, Contractor>;
  private productivityData: Map<string, ProductivityData>;

  constructor() {
    this.contractors = new Map();
    this.productivityData = new Map();
    this.initializeData();
  }

  private initializeData() {
    // Initialize with the 18 contractors and their August 2025 data
    const initialContractors: Contractor[] = [
      { id: 1, name: "MK Tolete", personalEmail: "toletemarkkevin@gmail.com", workEmail: "mktol@argometrix.com", workLocation: "Philippines", position: "Systems Manager", startDate: "10/21/2024", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
      { id: 2, name: "Almeerah Nasheed", personalEmail: "almeerahnasheed22@gmail.com", workEmail: "producer33@b2bpodcastpros.com", workLocation: "Pakistan", position: "Producer", startDate: "5/12/2025", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
      { id: 3, name: "Lavesh Advani", personalEmail: "lavesh.advani.in@gmail.com", workEmail: "producer43@b2bpodcastpros.com", workLocation: "India", position: "Producer", startDate: "6/2/2025", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
      { id: 4, name: "Hannah Gabiana", personalEmail: "hannahg.inbox@gmail.com", workEmail: "producer53@b2bpodcastpros.com", workLocation: "Philippines", position: "Producer", startDate: "6/9/2025", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
      { id: 5, name: "Pancho Maniquis", personalEmail: "", workEmail: "", workLocation: "Philippines", position: "Producer", startDate: "6/25/2025", separationDate: "9/3/2025", birthday: "", status: "active", contractorType: "Full Time" },
      { id: 6, name: "Ukthila Banuka", personalEmail: "ukthilabanuka99@gmail.com", workEmail: "editor33@b2bpodcastpros.com", workLocation: "Sri Lanka", position: "Video Editor", startDate: "5/5/2025", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
      { id: 7, name: "Ritz Villagonzalo", personalEmail: "ritzv4@gmail.com", workEmail: "editor53@b2bpodcastpros.com", workLocation: "Philippines", position: "Video Editor", startDate: "6/9/2025", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
      { id: 8, name: "Abu Hurarah", personalEmail: "heribhatti97@gmail.com", workEmail: "editor43@b2bpodcastpros.com", workLocation: "Pakistan", position: "Video Editor", startDate: "6/2/2025", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
      { id: 9, name: "Masood Mansha", personalEmail: "masoodmansha105@gmail.com", workEmail: "editor63@b2bpodcastpros.com", workLocation: "Pakistan", position: "Video Editor", startDate: "6/30/2025", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
      { id: 10, name: "Allona Mae", personalEmail: "allonamae4444@gmail.com", workEmail: "csm101@b2bpodcastpros.com", workLocation: "Philippines", position: "Client Success Manager", startDate: "8/25/2025", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
      { id: 12, name: "Raven Valerie", personalEmail: "ravenvalerieemia1421@gmail.com", workEmail: "teamsup101@b2bpodcastpros.com", workLocation: "Philippines", position: "Graphic Artist", startDate: "6/25/2025", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
      { id: 14, name: "Eddierez Abarico", personalEmail: "eddierez.abarico@gmail.com", workEmail: "teamsup102@b2bpodcastpros.net", workLocation: "Philippines", position: "Systems Support", startDate: "7/14/2025", separationDate: "", birthday: "10/16/1987", status: "active", contractorType: "Full Time" },
      { id: 15, name: "Mahmoud Shehata", personalEmail: "mahmoud.sayed.shehata@gmail.com", workEmail: "teamsup103@b2bpodcastpros.net", workLocation: "Egypt", position: "LinkedIn Optimization", startDate: "7/21/2025", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
      { id: 17, name: "Santiago Alvarez", personalEmail: "Santiagoalvareztocalli@gmail.com", workEmail: "producer63@b2bpodcastpros.com", workLocation: "Argentina", position: "Producer", startDate: "9/2/2025", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
      { id: 18, name: "Adnan Mazhar", personalEmail: "malikadnanmazhar@gmail.com", workEmail: "editor73@b2bpodcastpros.net", workLocation: "Pakistan", position: "Video Editor", startDate: "8/4/2025", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
      { id: 19, name: "Maheshni Gounden", personalEmail: "", workEmail: "", workLocation: "South Africa", position: "Human Resource Manager", startDate: "8/25/2025", separationDate: "9/8/2025", birthday: "", status: "active", contractorType: "Full Time" },
      { id: 20, name: "Sakshi Jain", personalEmail: "jsakshi111@gmail.com", workEmail: "teamsup105@b2bpodcastpros.net", workLocation: "India", position: "Tech Support", startDate: "9/2/2025", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
      { id: 23, name: "Nick Uresin", personalEmail: "nuresin@argometrix.com", workEmail: "nuresin@argometrix.com", workLocation: "United States", position: "President/CEO", startDate: "", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
    ];

    const initialProductivityData: ProductivityData[] = [
      { id: randomUUID(), contractorId: 1, month: "Aug-25", productiveHours: 114.65, totalHours: 120.17, productivity: 95.20, createdAt: new Date() },
      { id: randomUUID(), contractorId: 2, month: "Aug-25", productiveHours: 82.85, totalHours: 85.00, productivity: 97.47, createdAt: new Date() },
      { id: randomUUID(), contractorId: 3, month: "Aug-25", productiveHours: 114.18, totalHours: 120.00, productivity: 95.15, createdAt: new Date() },
      { id: randomUUID(), contractorId: 4, month: "Aug-25", productiveHours: 199.33, totalHours: 204.00, productivity: 97.76, createdAt: new Date() },
      { id: randomUUID(), contractorId: 5, month: "Aug-25", productiveHours: 88.67, totalHours: 92.00, productivity: 96.38, createdAt: new Date() },
      { id: randomUUID(), contractorId: 6, month: "Aug-25", productiveHours: 224.37, totalHours: 262.00, productivity: 85.65, createdAt: new Date() },
      { id: randomUUID(), contractorId: 7, month: "Aug-25", productiveHours: 173.72, totalHours: 180.00, productivity: 96.51, createdAt: new Date() },
      { id: randomUUID(), contractorId: 8, month: "Aug-25", productiveHours: 146.80, totalHours: 152.00, productivity: 96.58, createdAt: new Date() },
      { id: randomUUID(), contractorId: 9, month: "Aug-25", productiveHours: 131.57, totalHours: 136.00, productivity: 96.74, createdAt: new Date() },
      { id: randomUUID(), contractorId: 10, month: "Aug-25", productiveHours: 35.43, totalHours: 40.00, productivity: 88.58, createdAt: new Date() },
      { id: randomUUID(), contractorId: 12, month: "Aug-25", productiveHours: 174.05, totalHours: 180.00, productivity: 96.69, createdAt: new Date() },
      { id: randomUUID(), contractorId: 14, month: "Aug-25", productiveHours: 129.98, totalHours: 135.00, productivity: 96.28, createdAt: new Date() },
      { id: randomUUID(), contractorId: 15, month: "Aug-25", productiveHours: 0.00, totalHours: 0.00, productivity: 0.00, createdAt: new Date() },
      { id: randomUUID(), contractorId: 17, month: "Aug-25", productiveHours: 0.00, totalHours: 0.00, productivity: 0.00, createdAt: new Date() },
      { id: randomUUID(), contractorId: 18, month: "Aug-25", productiveHours: 100.42, totalHours: 105.00, productivity: 95.64, createdAt: new Date() },
      { id: randomUUID(), contractorId: 19, month: "Aug-25", productiveHours: 0.00, totalHours: 0.00, productivity: 0.00, createdAt: new Date() },
      { id: randomUUID(), contractorId: 20, month: "Aug-25", productiveHours: 0.00, totalHours: 0.00, productivity: 0.00, createdAt: new Date() },
      { id: randomUUID(), contractorId: 23, month: "Aug-25", productiveHours: 171.93, totalHours: 178.00, productivity: 96.59, createdAt: new Date() },
    ];

    initialContractors.forEach(contractor => this.contractors.set(contractor.id, contractor));
    initialProductivityData.forEach(data => this.productivityData.set(`${data.contractorId}-${data.month}`, data));
  }

  async getContractor(id: number): Promise<Contractor | undefined> {
    return this.contractors.get(id);
  }

  async getAllContractors(): Promise<Contractor[]> {
    return Array.from(this.contractors.values());
  }

  async createContractor(contractor: InsertContractor): Promise<Contractor> {
    const newContractor: Contractor = { 
      ...contractor, 
      status: contractor.status || 'active',
      personalEmail: contractor.personalEmail || "",
      workEmail: contractor.workEmail || "",
      workLocation: contractor.workLocation || "",
      position: contractor.position || "",
      startDate: contractor.startDate || "",
      separationDate: contractor.separationDate || "",
      birthday: contractor.birthday || "",
      contractorType: contractor.contractorType || "Full Time"
    };
    this.contractors.set(contractor.id, newContractor);
    return newContractor;
  }

  async updateContractor(id: number, contractor: Partial<Contractor>): Promise<Contractor | undefined> {
    const existing = this.contractors.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...contractor };
    this.contractors.set(id, updated);
    return updated;
  }

  async deleteContractor(id: number): Promise<boolean> {
    // Instead of deleting, mark as archived to preserve productivity data
    const existing = this.contractors.get(id);
    if (!existing) return false;
    
    const archived = { ...existing, status: 'archived' as const };
    this.contractors.set(id, archived);
    return true;
  }

  async archiveContractor(id: number): Promise<boolean> {
    // Archive contractor to preserve productivity data
    const existing = this.contractors.get(id);
    if (!existing) return false;
    
    const archived = { ...existing, status: 'archived' as const };
    this.contractors.set(id, archived);
    return true;
  }

  async getProductivityData(contractorId: number): Promise<ProductivityData[]> {
    return Array.from(this.productivityData.values()).filter(data => data.contractorId === contractorId);
  }

  async getAllProductivityData(): Promise<ProductivityData[]> {
    return Array.from(this.productivityData.values());
  }

  async getProductivityDataByMonth(month: string): Promise<ProductivityData[]> {
    return Array.from(this.productivityData.values()).filter(data => data.month === month);
  }

  async createProductivityData(data: InsertProductivityData): Promise<ProductivityData> {
    const newData: ProductivityData = {
      id: randomUUID(),
      ...data,
      createdAt: new Date(),
    };
    this.productivityData.set(`${data.contractorId}-${data.month}`, newData);
    return newData;
  }

  async updateProductivityData(contractorId: number, month: string, data: Partial<ProductivityData>): Promise<ProductivityData | undefined> {
    const key = `${contractorId}-${month}`;
    const existing = this.productivityData.get(key);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...data };
    this.productivityData.set(key, updated);
    return updated;
  }

  async deleteProductivityByMonth(month: string): Promise<boolean> {
    const keysToDelete: string[] = [];
    
    // Find all productivity data entries for the specified month
    Array.from(this.productivityData.entries()).forEach(([key, data]) => {
      if (data.month === month) {
        keysToDelete.push(key);
      }
    });
    
    // Delete all entries for this month
    keysToDelete.forEach(key => this.productivityData.delete(key));
    
    return keysToDelete.length > 0;
  }

  async getContractorsWithData(): Promise<ContractorWithData[]> {
    const contractors = await this.getAllContractors();
    return Promise.all(contractors.map(async (contractor) => ({
      ...contractor,
      productivityData: await this.getProductivityData(contractor.id),
    })));
  }

  async getMonthlyRankings(month: string): Promise<MonthlyRanking[]> {
    const monthData = await this.getProductivityDataByMonth(month);
    const contractors = await this.getAllContractors();
    
    const rankings = monthData
      .map(data => {
        const contractor = contractors.find(c => c.id === data.contractorId);
        return {
          contractorId: data.contractorId,
          name: contractor?.name || 'Unknown',
          hours: data.productiveHours,
          month,
          rank: 0, // Will be set below
        };
      })
      .sort((a, b) => b.hours - a.hours)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    return rankings;
  }

  async getTopPerformers(month: string, limit: number): Promise<MonthlyRanking[]> {
    const rankings = await this.getMonthlyRankings(month);
    return rankings.slice(0, limit);
  }

  async getUnderPerformers(month: string, threshold: number): Promise<MonthlyRanking[]> {
    const monthData = await this.getProductivityDataByMonth(month);
    const contractors = await this.getAllContractors();
    
    const underPerformers = monthData
      .filter(data => {
        const contractor = contractors.find(c => c.id === data.contractorId);
        if (!contractor || data.productiveHours <= 0) return false;
        
        // Use contractor type-based thresholds: Full Time < 100h, Part Time < 50h
        const hourThreshold = contractor.contractorType === 'Part Time' ? 50 : 100;
        return data.productiveHours < hourThreshold;
      })
      .map(data => {
        const contractor = contractors.find(c => c.id === data.contractorId);
        return {
          contractorId: data.contractorId,
          name: contractor?.name || 'Unknown',
          hours: data.productiveHours,
          month,
          rank: 0,
        };
      })
      .sort((a, b) => a.hours - b.hours); // Sort by hours ascending (lowest first)

    return underPerformers.map((item, index) => ({ ...item, rank: index + 1 }));
  }

  async bulkCreateProductivityData(data: InsertProductivityData[]): Promise<ProductivityData[]> {
    const results: ProductivityData[] = [];
    for (const item of data) {
      // Check if record already exists for this contractor and month
      const existingKey = `${item.contractorId}-${item.month}`;
      const existing = this.productivityData.get(existingKey);
      
      if (existing) {
        // Update existing record
        const updated = { 
          ...existing, 
          productiveHours: item.productiveHours,
          totalHours: item.totalHours,
          productivity: item.productivity,
          createdAt: new Date() // Update timestamp
        };
        this.productivityData.set(existingKey, updated);
        results.push(updated);
      } else {
        // Create new record
        const result = await this.createProductivityData(item);
        results.push(result);
      }
    }
    return results;
  }

  async bulkCreateContractors(data: InsertContractor[]): Promise<Contractor[]> {
    const results: Contractor[] = [];
    for (const item of data) {
      const result = await this.createContractor(item);
      results.push(result);
    }
    return results;
  }
}

import { DatabaseStorage } from "./database-storage";

export const storage = new DatabaseStorage();
