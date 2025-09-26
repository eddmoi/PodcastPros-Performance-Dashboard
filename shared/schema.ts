import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define status enum for runtime validation
export const statusEnum = z.enum(["active", "archived"]);

export const contractors = pgTable("contractors", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  personalEmail: text("personal_email").default(""),
  workEmail: text("work_email").default(""),
  workLocation: text("work_location").default(""),
  position: text("position").default(""),
  startDate: text("start_date").default(""),
  separationDate: text("separation_date").default(""),
  birthday: text("birthday").default(""),
  status: text("status").notNull().default("active").$type<"active" | "archived">(),
  contractorType: text("contractor_type").notNull().default("Full Time"),
});

export const productivityData = pgTable("productivity_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: integer("contractor_id").notNull(),
  month: text("month").notNull(),
  productiveHours: real("productive_hours").notNull(),
  totalHours: real("total_hours").notNull(),
  productivity: real("productivity").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  contractorMonthUnique: unique().on(table.contractorId, table.month),
}));

export const insertContractorSchema = createInsertSchema(contractors).pick({
  id: true,
  name: true,
  personalEmail: true,
  workEmail: true,
  workLocation: true,
  position: true,
  startDate: true,
  separationDate: true,
  birthday: true,
  contractorType: true,
}).extend({
  status: statusEnum.default("active"),
});

export const insertProductivityDataSchema = createInsertSchema(productivityData).omit({
  id: true,
  createdAt: true,
});

export type InsertContractor = z.infer<typeof insertContractorSchema>;
export type Contractor = typeof contractors.$inferSelect;
export type InsertProductivityData = z.infer<typeof insertProductivityDataSchema>;
export type ProductivityData = typeof productivityData.$inferSelect;

export interface ContractorWithData extends Contractor {
  productivityData: ProductivityData[];
}

export interface MonthlyRanking {
  contractorId: number;
  name: string;
  hours: number;
  rank: number;
  month: string;
}

export interface CSVUploadData {
  empNo: number;
  name: string;
  month: string;
  productiveHours: string;
  hours: number;
  productivity: number;
}

export interface ContractorRosterData {
  name: string;
  id: number;
  personalEmail: string;
  workEmail: string;
  workLocation: string;
  position: string;
  startDate: string;
  separationDate: string;
  birthday: string;
  contractorType: string;
}
