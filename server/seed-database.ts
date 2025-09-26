import { storage } from "./storage";
import { randomUUID } from "crypto";

export async function seedDatabase() {
  // Check if data already exists
  const existingContractors = await storage.getAllContractors();
  if (existingContractors.length > 0) {
    console.log("Database already seeded with", existingContractors.length, "contractors");
    return;
  }

  console.log("Seeding database with initial data...");

  // Initial contractors data
  const initialContractors = [
    { id: 1, name: "MK Tolete", personalEmail: "toletemarkkevin@gmail.com", workEmail: "mktol@argometrix.com", workLocation: "Philippines", position: "Systems Manager", startDate: "10/21/2024", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
    { id: 2, name: "Almeerah Nasheed", personalEmail: "almeerahnasheed22@gmail.com", workEmail: "producer33@b2bpodcastpros.com", workLocation: "Pakistan", position: "Producer", startDate: "5/12/2025", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
    { id: 3, name: "Lavesh Advani", personalEmail: "lavesh.advani.in@gmail.com", workEmail: "producer43@b2bpodcastpros.com", workLocation: "India", position: "Producer", startDate: "6/2/2025", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
    { id: 4, name: "Hannah Gabiana", personalEmail: "hannahg.inbox@gmail.com", workEmail: "producer53@b2bpodcastpros.com", workLocation: "Philippines", position: "Producer", startDate: "6/9/2025", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
    { id: 5, name: "Pancho Maniquis", personalEmail: "", workEmail: "", workLocation: "Philippines", position: "Producer", startDate: "6/25/2025", separationDate: "9/3/2025", birthday: "", status: "active", contractorType: "Full Time" },
    { id: 6, name: "Ukthila Banuka", personalEmail: "ukthilabanuka99@gmail.com", workEmail: "editor33@b2bpodcastpros.com", workLocation: "Sri Lanka", position: "Video Editor", startDate: "5/5/2025", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
    { id: 7, name: "Ritz Villagonzalo", personalEmail: "ritzv4@gmail.com", workEmail: "editor53@b2bpodcastpros.com", workLocation: "Philippines", position: "Video Editor", startDate: "6/9/2025", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
    { id: 8, name: "Abu Hurarah", personalEmail: "heribhatti97@gmail.com", workEmail: "editor43@b2bpodcastpros.com", workLocation: "Pakistan", position: "Video Editor", startDate: "6/2/2025", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
    { id: 9, name: "Masood Mansha", personalEmail: "masoodmansha105@gmail.com", workEmail: "editor63@b2bpodcastpros.com", workLocation: "Pakistan", position: "Video Editor", startDate: "6/30/2025", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
    { id: 10, name: "Allona Mae", personalEmail: "allonamae4444@gmail.com", workEmail: "csm101@b2bpodcastpros.com", workLocation: "Philippines", position: "Client Success Manager", startDate: "8/25/2025", separationDate: "", birthday: "", status: "active", contractorType: "Part Time" },
    { id: 12, name: "Raven Valerie", personalEmail: "ravenvalerieemia1421@gmail.com", workEmail: "teamsup101@b2bpodcastpros.com", workLocation: "Philippines", position: "Graphic Artist", startDate: "6/25/2025", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
    { id: 14, name: "Eddierez Abarico", personalEmail: "eddierez.abarico@gmail.com", workEmail: "teamsup102@b2bpodcastpros.net", workLocation: "Philippines", position: "Systems Support", startDate: "7/14/2025", separationDate: "", birthday: "10/16/1987", status: "active", contractorType: "Full Time" },
    { id: 15, name: "Mahmoud Shehata", personalEmail: "mahmoud.sayed.shehata@gmail.com", workEmail: "teamsup103@b2bpodcastpros.net", workLocation: "Egypt", position: "LinkedIn Optimization", startDate: "7/21/2025", separationDate: "", birthday: "", status: "active", contractorType: "Part Time" },
    { id: 17, name: "Santiago Alvarez", personalEmail: "Santiagoalvareztocalli@gmail.com", workEmail: "producer63@b2bpodcastpros.com", workLocation: "Argentina", position: "Producer", startDate: "9/2/2025", separationDate: "", birthday: "", status: "active", contractorType: "Part Time" },
    { id: 18, name: "Adnan Mazhar", personalEmail: "malikadnanmazhar@gmail.com", workEmail: "editor73@b2bpodcastpros.net", workLocation: "Pakistan", position: "Video Editor", startDate: "8/4/2025", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
    { id: 19, name: "Maheshni Gounden", personalEmail: "", workEmail: "", workLocation: "South Africa", position: "Human Resource Manager", startDate: "8/25/2025", separationDate: "9/8/2025", birthday: "", status: "active", contractorType: "Full Time" },
    { id: 20, name: "Sakshi Jain", personalEmail: "jsakshi111@gmail.com", workEmail: "teamsup105@b2bpodcastpros.net", workLocation: "India", position: "Tech Support", startDate: "9/2/2025", separationDate: "", birthday: "", status: "active", contractorType: "Part Time" },
    { id: 23, name: "Nick Uresin", personalEmail: "nuresin@argometrix.com", workEmail: "nuresin@argometrix.com", workLocation: "United States", position: "President/CEO", startDate: "", separationDate: "", birthday: "", status: "active", contractorType: "Full Time" },
  ];

  // Initial productivity data for August 2025
  const initialProductivityData = [
    { contractorId: 1, month: "Aug-25", productiveHours: 114.65, totalHours: 120.17, productivity: 95.20 },
    { contractorId: 2, month: "Aug-25", productiveHours: 82.85, totalHours: 85.00, productivity: 97.47 },
    { contractorId: 3, month: "Aug-25", productiveHours: 114.18, totalHours: 120.00, productivity: 95.15 },
    { contractorId: 4, month: "Aug-25", productiveHours: 199.33, totalHours: 204.00, productivity: 97.76 },
    { contractorId: 5, month: "Aug-25", productiveHours: 88.67, totalHours: 92.00, productivity: 96.38 },
    { contractorId: 6, month: "Aug-25", productiveHours: 224.37, totalHours: 262.00, productivity: 85.65 },
    { contractorId: 7, month: "Aug-25", productiveHours: 173.72, totalHours: 180.00, productivity: 96.51 },
    { contractorId: 8, month: "Aug-25", productiveHours: 146.80, totalHours: 152.00, productivity: 96.58 },
    { contractorId: 9, month: "Aug-25", productiveHours: 131.57, totalHours: 136.00, productivity: 96.74 },
    { contractorId: 10, month: "Aug-25", productiveHours: 35.43, totalHours: 40.00, productivity: 88.58 },
    { contractorId: 12, month: "Aug-25", productiveHours: 174.05, totalHours: 180.00, productivity: 96.69 },
    { contractorId: 14, month: "Aug-25", productiveHours: 129.98, totalHours: 135.00, productivity: 96.28 },
    { contractorId: 15, month: "Aug-25", productiveHours: 0.00, totalHours: 0.00, productivity: 0.00 },
    { contractorId: 17, month: "Aug-25", productiveHours: 0.00, totalHours: 0.00, productivity: 0.00 },
    { contractorId: 18, month: "Aug-25", productiveHours: 100.42, totalHours: 105.00, productivity: 95.64 },
    { contractorId: 19, month: "Aug-25", productiveHours: 0.00, totalHours: 0.00, productivity: 0.00 },
    { contractorId: 20, month: "Aug-25", productiveHours: 0.00, totalHours: 0.00, productivity: 0.00 },
    { contractorId: 23, month: "Aug-25", productiveHours: 171.93, totalHours: 178.00, productivity: 96.59 },
  ];

  try {
    // Seed contractors
    await storage.bulkCreateContractors(initialContractors);
    console.log("Seeded", initialContractors.length, "contractors");

    // Seed productivity data
    await storage.bulkCreateProductivityData(initialProductivityData);
    console.log("Seeded", initialProductivityData.length, "productivity records");

    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}