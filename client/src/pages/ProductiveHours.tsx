import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, Download } from "lucide-react";
import { AVAILABLE_MONTHS, type AvailableMonth } from "@/lib/csv-utils";
import { useExport } from "@/hooks/use-export";

interface ContractorWithData {
  id: number;
  name: string;
  status: string;
  productivityData: Array<{
    id: string;
    contractorId: number;
    month: string;
    productiveHours: number;
    totalHours: number;
    productivity: number;
    createdAt: Date;
  }>;
}

export default function ProductiveHours() {
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedMonth, setSelectedMonth] = useState<AvailableMonth>('Aug-25');

  const { exportData, isExporting } = useExport();

  const handleExportProductivity = () => {
    exportData({
      endpoint: `/api/export/productivity/${selectedMonth}`,
      filename: `productivity-${selectedMonth}.csv`,
      successTitle: "Export Successful",
      successDescription: `Productivity data for ${selectedMonth} has been exported to CSV`,
    });
  };

  const { data: contractorsWithData, isLoading } = useQuery<ContractorWithData[]>({
    queryKey: ["/api/contractors/with-data"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading productive hours data...</div>
      </div>
    );
  }

  const getThresholds = (contractorType: string) => {
    if (contractorType === 'Part Time') {
      return {
        high: 86.7,
        medium: 50,
        low: 0
      };
    }
    // Full Time thresholds
    return {
      high: 173.3,
      medium: 129.98,
      low: 0
    };
  };

  const getPerformanceClass = (hours: number, contractorType: string) => {
    const thresholds = getThresholds(contractorType);
    if (hours > thresholds.high) return 'performance-high';
    if (hours >= thresholds.medium) return 'performance-medium';
    return 'performance-low';
  };

  const getHoursForMonth = (contractorData: ContractorWithData['productivityData'], month: string) => {
    const monthData = contractorData.find(data => data.month === month);
    return monthData ? monthData.productiveHours : 0;
  };

  const getProductivityForMonth = (contractorData: ContractorWithData['productivityData'], month: string) => {
    const monthData = contractorData.find(data => data.month === month);
    return monthData ? monthData.productivity : 0;
  };

  const getContractorTypeCount = (type: 'Full Time' | 'Part Time', performanceLevel: 'high' | 'medium' | 'low') => {
    if (!sortedContractors) return 0;
    
    return sortedContractors.filter(contractor => {
      const contractorType = (contractor as any).contractorType || 'Full Time';
      if (contractorType !== type) return false;
      
      const hours = getHoursForMonth(contractor.productivityData, selectedMonth);
      const thresholds = getThresholds(type);
      
      switch (performanceLevel) {
        case 'high':
          return hours > thresholds.high;
        case 'medium':
          return hours >= thresholds.medium && hours <= thresholds.high;
        case 'low':
          return hours < thresholds.medium;
        default:
          return false;
      }
    }).length;
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedContractors = contractorsWithData ? [...contractorsWithData].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortColumn) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'id':
        aValue = a.id;
        bValue = b.id;
        break;
      case 'aug-25':
        aValue = getHoursForMonth(a.productivityData, selectedMonth);
        bValue = getHoursForMonth(b.productivityData, selectedMonth);
        break;
      default:
        aValue = a.name;
        bValue = b.name;
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  }) : [];

  return (
    <div className="page-wrapper">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="success-green-bg text-white p-6 rounded-lg mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
                Productive Hours Matrix
              </h1>
              <p className="text-lg opacity-90">Complete Contractor Tracking (Underachiever Criteria: Full-Time &lt;100h | Part-Time &lt;50h)</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedMonth} onValueChange={(value: AvailableMonth) => setSelectedMonth(value)}>
                <SelectTrigger className="w-48 bg-white text-blue-700">
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
                onClick={handleExportProductivity}
                disabled={isExporting}
                className="flex items-center space-x-2 bg-white text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                data-testid="button-export-productivity"
              >
                <Download className="h-4 w-4" />
                <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Color Legend */}
        <Card className="mb-6" data-testid="card-performance-legend">
          <CardContent className="p-4">
            <h3 className="font-bold mb-3">Performance Legend:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-green-700 mb-2">Full Time Contractors</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 performance-high rounded"></div>
                    <span className="text-sm">High ({'>'}173.3 hours)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 performance-medium rounded"></div>
                    <span className="text-sm">Medium (129.98-173.3 hours)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 performance-low rounded"></div>
                    <span className="text-sm">Low ({'<'}129.98 hours)</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-blue-700 mb-2">Part Time Contractors</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 performance-high rounded"></div>
                    <span className="text-sm">High ({'>'}86.7 hours)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 performance-medium rounded"></div>
                    <span className="text-sm">Medium (50-86.7 hours)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 performance-low rounded"></div>
                    <span className="text-sm">Low ({'<'}50 hours)</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden" data-testid="card-productive-hours-matrix">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="table-hover">
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead 
                      className="font-bold py-4 px-6 cursor-pointer hover:bg-accent"
                      onClick={() => handleSort('name')}
                      data-testid="header-contractor-name"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Contractor Name</span>
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-bold py-4 px-6 cursor-pointer hover:bg-accent"
                      onClick={() => handleSort('id')}
                      data-testid="header-contractor-id"
                    >
                      <div className="flex items-center space-x-1">
                        <span>ID</span>
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="font-bold py-4 px-6">Type</TableHead>
                    <TableHead 
                      className="font-bold py-4 px-6 cursor-pointer hover:bg-accent"
                      onClick={() => handleSort('aug-25')}
                      data-testid="header-aug-25"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Aug-25</span>
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="font-bold py-4 px-6">Productivity %</TableHead>
                    <TableHead className="font-bold py-4 px-6">Sep-25</TableHead>
                    <TableHead className="font-bold py-4 px-6">Oct-25</TableHead>
                    <TableHead className="font-bold py-4 px-6">Nov-25</TableHead>
                    <TableHead className="font-bold py-4 px-6">Dec-25</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedContractors.map((contractor) => {
                    const hours = getHoursForMonth(contractor.productivityData, selectedMonth);
                    const productivity = getProductivityForMonth(contractor.productivityData, selectedMonth);
                    
                    return (
                      <TableRow 
                        key={contractor.id} 
                        className="border-b border-border"
                        data-testid={`row-contractor-${contractor.id}`}
                      >
                        <TableCell className="py-4 px-6 font-semibold" data-testid={`text-contractor-name-${contractor.id}`}>
                          {contractor.name}
                        </TableCell>
                        <TableCell className="py-4 px-6" data-testid={`text-contractor-id-${contractor.id}`}>
                          {contractor.id}
                        </TableCell>
                        <TableCell className="py-4 px-6" data-testid={`text-contractor-type-${contractor.id}`}>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (contractor as any).contractorType === 'Full Time' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {(contractor as any).contractorType || 'Full Time'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6" data-testid={`text-aug-hours-${contractor.id}`}>
                          <Badge 
                            variant="outline" 
                            className={`${getPerformanceClass(hours, (contractor as any).contractorType || 'Full Time')} border-0`}
                          >
                            {hours.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6" data-testid={`text-productivity-${contractor.id}`}>
                          <span className="font-medium text-vibrant-cyan">
                            {productivity > 0 ? `${productivity.toFixed(1)}%` : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-muted-foreground">-</TableCell>
                        <TableCell className="py-4 px-6 text-muted-foreground">-</TableCell>
                        <TableCell className="py-4 px-6 text-muted-foreground">-</TableCell>
                        <TableCell className="py-4 px-6 text-muted-foreground">-</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats by Contractor Type */}
        <div className="space-y-6 mt-6">
          <div>
            <h3 className="text-lg font-semibold text-green-700 mb-3">Full Time Contractors</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4" data-testid="card-high-performers-ft">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-green">
                    {getContractorTypeCount('Full Time', 'high')}
                  </div>
                  <div className="text-sm text-muted-foreground">High ({'>'}173.3hrs)</div>
                </div>
              </Card>
              
              <Card className="p-4" data-testid="card-medium-performers-ft">
                <div className="text-center">
                  <div className="text-2xl font-bold text-championship-gold">
                    {getContractorTypeCount('Full Time', 'medium')}
                  </div>
                  <div className="text-sm text-muted-foreground">Medium (129.98-173.3hrs)</div>
                </div>
              </Card>
              
              <Card className="p-4" data-testid="card-low-performers-ft">
                <div className="text-center">
                  <div className="text-2xl font-bold text-alert-red">
                    {getContractorTypeCount('Full Time', 'low')}
                  </div>
                  <div className="text-sm text-muted-foreground">Low ({'<'}129.98hrs)</div>
                </div>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-blue-700 mb-3">Part Time Contractors</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4" data-testid="card-high-performers-pt">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-green">
                    {getContractorTypeCount('Part Time', 'high')}
                  </div>
                  <div className="text-sm text-muted-foreground">High ({'>'}86.7hrs)</div>
                </div>
              </Card>
              
              <Card className="p-4" data-testid="card-medium-performers-pt">
                <div className="text-center">
                  <div className="text-2xl font-bold text-championship-gold">
                    {getContractorTypeCount('Part Time', 'medium')}
                  </div>
                  <div className="text-sm text-muted-foreground">Medium (50-86.7hrs)</div>
                </div>
              </Card>
              
              <Card className="p-4" data-testid="card-low-performers-pt">
                <div className="text-center">
                  <div className="text-2xl font-bold text-alert-red">
                    {getContractorTypeCount('Part Time', 'low')}
                  </div>
                  <div className="text-sm text-muted-foreground">Low ({'<'}50hrs)</div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
