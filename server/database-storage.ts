import { db } from "./db";
import { contractors, productivityData, type Contractor, type InsertContractor, type ProductivityData, type InsertProductivityData, type ContractorWithData, type MonthlyRanking } from "@shared/schema";
import { eq, desc, asc, and, or, sql } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Contractor operations
  async getContractor(id: number): Promise<Contractor | undefined> {
    const [contractor] = await db.select().from(contractors).where(eq(contractors.id, id));
    return contractor || undefined;
  }

  async getAllContractors(): Promise<Contractor[]> {
    return await db.select().from(contractors);
  }

  async createContractor(contractor: InsertContractor): Promise<Contractor> {
    // If no ID provided, generate the next available ID
    let contractorToInsert = contractor;
    
    if (!contractor.id) {
      const maxId = await db
        .select({ maxId: sql<number>`COALESCE(MAX(id), 0)` })
        .from(contractors);
      
      const nextId = (maxId[0]?.maxId || 0) + 1;
      contractorToInsert = {
        ...contractor,
        id: nextId,
      };
    }
    
    const [newContractor] = await db
      .insert(contractors)
      .values({
        ...contractorToInsert,
        status: contractorToInsert.status || 'active',
      })
      .returning();
    
    return newContractor;
  }

  async updateContractor(id: number, contractor: Partial<Contractor>): Promise<Contractor | undefined> {
    const [updatedContractor] = await db
      .update(contractors)
      .set(contractor)
      .where(eq(contractors.id, id))
      .returning();
    
    return updatedContractor || undefined;
  }

  async deleteContractor(id: number): Promise<boolean> {
    // Instead of deleting, mark as archived to preserve productivity data
    const result = await db
      .update(contractors)
      .set({ status: 'archived' as const })
      .where(eq(contractors.id, id));
    return (result.rowCount || 0) > 0;
  }

  async archiveContractor(id: number): Promise<boolean> {
    // Archive contractor to preserve productivity data
    const result = await db
      .update(contractors)
      .set({ status: 'archived' as const })
      .where(eq(contractors.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Productivity data operations
  async getProductivityData(contractorId: number): Promise<ProductivityData[]> {
    return await db
      .select()
      .from(productivityData)
      .where(eq(productivityData.contractorId, contractorId));
  }

  async getAllProductivityData(): Promise<ProductivityData[]> {
    return await db.select().from(productivityData);
  }

  async getProductivityDataByMonth(month: string): Promise<ProductivityData[]> {
    return await db
      .select()
      .from(productivityData)
      .where(eq(productivityData.month, month));
  }

  async createProductivityData(data: InsertProductivityData): Promise<ProductivityData> {
    const [newData] = await db
      .insert(productivityData)
      .values(data)
      .returning();
    
    return newData;
  }

  async updateProductivityData(contractorId: number, month: string, data: Partial<ProductivityData>): Promise<ProductivityData | undefined> {
    const [updatedData] = await db
      .update(productivityData)
      .set(data)
      .where(
        and(
          eq(productivityData.contractorId, contractorId),
          eq(productivityData.month, month)
        )
      )
      .returning();
    
    return updatedData || undefined;
  }

  async deleteProductivityByMonth(month: string): Promise<boolean> {
    const result = await db
      .delete(productivityData)
      .where(eq(productivityData.month, month));
    
    return (result.rowCount || 0) > 0;
  }

  // Combined operations
  async getContractorsWithData(): Promise<ContractorWithData[]> {
    const contractorsList = await this.getAllContractors();
    const allData = await this.getAllProductivityData();
    
    return contractorsList.map(contractor => ({
      ...contractor,
      productivityData: allData.filter(data => data.contractorId === contractor.id)
    }));
  }

  async getMonthlyRankings(month: string): Promise<MonthlyRanking[]> {
    const result = await db
      .select({
        contractorId: productivityData.contractorId,
        name: contractors.name,
        hours: productivityData.productiveHours,
        productivity: productivityData.productivity,
        month: productivityData.month,
      })
      .from(productivityData)
      .innerJoin(contractors, eq(contractors.id, productivityData.contractorId))
      .where(eq(productivityData.month, month))
      .orderBy(desc(productivityData.productiveHours), desc(productivityData.productivity));

    return result.map((row, index) => ({
      contractorId: row.contractorId,
      name: row.name,
      hours: row.hours,
      rank: index + 1,
      month: row.month,
    }));
  }

  async getTopPerformers(month: string, limit: number): Promise<MonthlyRanking[]> {
    const rankings = await this.getMonthlyRankings(month);
    return rankings.slice(0, limit);
  }

  async getUnderPerformers(month: string, threshold: number): Promise<MonthlyRanking[]> {
    const result = await db
      .select({
        contractorId: productivityData.contractorId,
        name: contractors.name,
        hours: productivityData.productiveHours,
        productivity: productivityData.productivity,
        month: productivityData.month,
        contractorType: contractors.contractorType,
      })
      .from(productivityData)
      .innerJoin(contractors, eq(contractors.id, productivityData.contractorId))
      .where(
        and(
          eq(productivityData.month, month),
          sql`${productivityData.productiveHours} > 0`,
          or(
            and(
              eq(contractors.contractorType, 'Full Time'),
              sql`${productivityData.productiveHours} < 100`
            ),
            and(
              eq(contractors.contractorType, 'Part Time'),
              sql`${productivityData.productiveHours} < 50`
            )
          )
        )
      )
      .orderBy(asc(productivityData.productiveHours), desc(productivityData.productivity));

    return result.map((row, index) => ({
      contractorId: row.contractorId,
      name: row.name,
      hours: row.hours,
      rank: index + 1,
      month: row.month,
    }));
  }

  // Bulk operations
  async bulkCreateProductivityData(data: InsertProductivityData[]): Promise<ProductivityData[]> {
    if (data.length === 0) return [];
    
    const results: ProductivityData[] = [];
    
    for (const item of data) {
      // Use PostgreSQL UPSERT (ON CONFLICT) for atomic operation
      const [result] = await db
        .insert(productivityData)
        .values(item)
        .onConflictDoUpdate({
          target: [productivityData.contractorId, productivityData.month],
          set: {
            productiveHours: item.productiveHours,
            totalHours: item.totalHours,
            productivity: item.productivity,
            createdAt: sql`NOW()`,
          },
        })
        .returning();
      
      results.push(result);
    }
    
    return results;
  }

  async bulkCreateContractors(data: InsertContractor[]): Promise<Contractor[]> {
    if (data.length === 0) return [];
    
    // Ensure status has default value for each contractor
    const validatedData = data.map(contractor => ({
      ...contractor,
      status: contractor.status || "active"
    }));
    
    return await db
      .insert(contractors)
      .values(validatedData)
      .returning();
  }
}