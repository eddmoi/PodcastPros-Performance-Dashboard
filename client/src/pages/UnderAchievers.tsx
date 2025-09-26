import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, AlertTriangle, Info, Download } from "lucide-react";
import { AVAILABLE_MONTHS, type AvailableMonth } from "@/lib/csv-utils";
import { useExport } from "@/hooks/use-export";

interface MonthlyRanking {
  employeeId: number;
  name: string;
  hours: number;
  rank: number;
  month: string;
  contractorType?: string;
}

export default function UnderAchievers() {
  const [selectedMonth, setSelectedMonth] = useState<AvailableMonth>('Aug-25');
  
  const { data: underPerformers, isLoading } = useQuery<MonthlyRanking[]>({
    queryKey: ["/api/under-performers", selectedMonth],
    queryFn: () => fetch(`/api/under-performers/${selectedMonth}`).then(res => res.json()),
  });

  const { exportData, isExporting } = useExport();

  const handleExportUnderPerformers = () => {
    exportData({
      endpoint: `/api/export/under-performers/${selectedMonth}`,
      filename: `under-performers-${selectedMonth}.csv`,
      successTitle: "Export Successful",
      successDescription: `Under performers data for ${selectedMonth} has been exported to CSV`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading under achievers data...</div>
      </div>
    );
  }

  const hasUnderPerformers = underPerformers && underPerformers.length > 0;

  return (
    <div className="page-wrapper">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="alert-red-bg text-white p-6 rounded-lg mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
                Development Opportunities
              </h1>
              <p className="text-lg opacity-90">Full-Time &lt;100h | Part-Time &lt;50h</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedMonth} onValueChange={(value: AvailableMonth) => setSelectedMonth(value)}>
                <SelectTrigger className="w-48 bg-white text-red-700">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="secondary" 
                onClick={handleExportUnderPerformers}
                disabled={isExporting}
                className="flex items-center space-x-2 bg-white text-red-700 hover:bg-red-50 disabled:opacity-50"
                data-testid="button-export-underachievers"
              >
                <Download className="h-4 w-4" />
                <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
              </Button>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden mb-8" data-testid="card-underachievers">
          {!hasUnderPerformers ? (
            <CardHeader className="success-green-bg text-white p-6 text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold mb-2" data-testid="text-no-alerts">
                No Development Alerts
              </CardTitle>
              <p className="text-lg opacity-90">Excellent Team Performance</p>
            </CardHeader>
          ) : (
            <CardHeader className="alert-red-bg text-white p-6 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold mb-2" data-testid="text-development-alerts">
                {underPerformers.length} Employee(s) Need Attention
              </CardTitle>
              <p className="text-lg opacity-90">Below Contractor Type Thresholds</p>
            </CardHeader>
          )}
          
          <CardContent className="p-6">
            {hasUnderPerformers ? (
              <div className="overflow-x-auto">
                <Table className="table-hover">
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead className="font-bold py-4 px-6">Rank</TableHead>
                      <TableHead className="font-bold py-4 px-6">Contractor Name</TableHead>
                      <TableHead className="font-bold py-4 px-6">Productive Hours</TableHead>
                      <TableHead className="font-bold py-4 px-6">Contractor Type</TableHead>
                      <TableHead className="font-bold py-4 px-6">Threshold</TableHead>
                      <TableHead className="font-bold py-4 px-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {underPerformers.map((performer, index) => (
                      <TableRow key={performer.employeeId} className="border-b border-border" data-testid={`row-underachiever-${performer.employeeId}`}>
                        <TableCell className="py-4 px-6 font-semibold">{index + 1}</TableCell>
                        <TableCell className="py-4 px-6 font-semibold" data-testid={`text-name-${performer.employeeId}`}>
                          {performer.name}
                        </TableCell>
                        <TableCell className="py-4 px-6" data-testid={`text-hours-${performer.employeeId}`}>
                          <span className="performance-low font-semibold">
                            {performer.hours.toFixed(1)} hours
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            performer.contractorType === 'Full Time' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {performer.contractorType || 'Full Time'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-muted-foreground">
                          {(performer.contractorType || 'Full Time') === 'Full Time' ? '<100h' : '<50h'}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            Needs Attention
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-700 mb-2">Excellent Performance!</h3>
                <p className="text-gray-600 mb-4">
                  All contractors are meeting their performance thresholds for {selectedMonth}.
                </p>
                <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                  <strong>Thresholds:</strong> Full-Time: ≥100h | Part-Time: ≥50h
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alert System Info */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg" data-testid="card-alert-info">
          <div className="flex items-start">
            <Info className="h-6 w-6 text-yellow-400 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Alert System Information
              </h3>
              <p className="text-yellow-700">
                This section will automatically populate when any employee falls below their contractor type threshold (Full-Time: &lt;100h, Part-Time: &lt;50h). 
                Currently, all team members are performing above expectations.
              </p>
              {hasUnderPerformers && (
                <div className="mt-4 p-3 bg-yellow-100 rounded">
                  <p className="text-yellow-800 font-medium">
                    Action Items for Management:
                  </p>
                  <ul className="list-disc list-inside text-yellow-700 mt-2 space-y-1">
                    <li>Schedule one-on-one meetings with affected employees</li>
                    <li>Review workload distribution and priorities</li>
                    <li>Identify potential training or support needs</li>
                    <li>Set improvement goals and timelines</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
