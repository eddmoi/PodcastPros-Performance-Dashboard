import { useQuery } from "@tanstack/react-query";

interface Employee {
  id: number;
  name: string;
  status: string;
}

interface ProductivityData {
  id: string;
  employeeId: number;
  month: string;
  productiveHours: number;
  totalHours: number;
  productivity: number;
  createdAt: Date;
}

interface EmployeeWithData extends Employee {
  productivityData: ProductivityData[];
}

interface MonthlyRanking {
  employeeId: number;
  name: string;
  hours: number;
  rank: number;
  month: string;
}

export function useEmployees() {
  return useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });
}

export function useEmployeesWithData() {
  return useQuery<EmployeeWithData[]>({
    queryKey: ["/api/employees/with-data"],
  });
}

export function useMonthlyRankings(month: string) {
  return useQuery<MonthlyRanking[]>({
    queryKey: ["/api/rankings", month],
  });
}

export function useTopPerformers(month: string, limit: number = 3) {
  return useQuery<MonthlyRanking[]>({
    queryKey: ["/api/top-performers", month],
    select: (data) => data.slice(0, limit),
  });
}

export function useUnderPerformers(month: string, threshold: number = 75) {
  return useQuery<MonthlyRanking[]>({
    queryKey: ["/api/under-performers", month],
    select: (data) => data.filter(employee => employee.hours < threshold),
  });
}
