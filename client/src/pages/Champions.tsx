import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Award, Crown, Download } from "lucide-react";
import { AVAILABLE_MONTHS, type AvailableMonth } from "@/lib/csv-utils";
import { useExport } from "@/hooks/use-export";

interface MonthlyRanking {
  employeeId: number;
  name: string;
  hours: number;
  rank: number;
  month: string;
}

export default function Champions() {
  const [selectedMonth, setSelectedMonth] = useState<AvailableMonth>('Aug-25');
  
  const { data: rankings, isLoading } = useQuery<MonthlyRanking[]>({
    queryKey: ["/api/rankings", selectedMonth],
    queryFn: () => fetch(`/api/rankings/${selectedMonth}`).then(res => res.json())
  });

  const { exportData, isExporting } = useExport();

  const handleExportRankings = () => {
    exportData({
      endpoint: `/api/export/rankings/${selectedMonth}`,
      filename: `rankings-${selectedMonth}.csv`,
      successTitle: "Export Successful",
      successDescription: `Champions rankings data for ${selectedMonth} has been exported to CSV`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading champions data...</div>
      </div>
    );
  }

  const topThree = rankings?.slice(0, 3) || [];
  const champion = topThree[0];
  const runnerUp = topThree[1];
  const thirdPlace = topThree[2];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-championship-gold" />;
      case 2:
        return <Medal className="h-5 w-5 text-premium-silver" />;
      case 3:
        return <Award className="h-5 w-5 text-rich-bronze" />;
      default:
        return null;
    }
  };

  return (
    <div className="page-wrapper">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="success-green-bg text-white p-6 rounded-lg mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
                Champions History
              </h1>
              <p className="text-lg opacity-90">Monthly Excellence Tracking (Full-Time ≥100h | Part-Time ≥50h)</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedMonth} onValueChange={(value: AvailableMonth) => setSelectedMonth(value)}>
                <SelectTrigger className="w-48 bg-white text-green-700">
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
                onClick={handleExportRankings}
                disabled={isExporting}
                className="flex items-center space-x-2 bg-white text-green-700 hover:bg-green-50 disabled:opacity-50"
                data-testid="button-export-rankings"
              >
                <Download className="h-4 w-4" />
                <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
              </Button>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden mb-8" data-testid="card-champions-table">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="table-hover">
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="font-bold py-4 px-6">Month</TableHead>
                    <TableHead className="font-bold py-4 px-6">Champion</TableHead>
                    <TableHead className="font-bold py-4 px-6">Hours</TableHead>
                    <TableHead className="font-bold py-4 px-6">Runner-Up</TableHead>
                    <TableHead className="font-bold py-4 px-6">Hours</TableHead>
                    <TableHead className="font-bold py-4 px-6">Third Place</TableHead>
                    <TableHead className="font-bold py-4 px-6">Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-b border-border" data-testid="row-august-champions">
                    <TableCell className="py-4 px-6 font-semibold">{selectedMonth}</TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Trophy className="h-5 w-5 text-championship-gold" />
                        <span className="font-semibold" data-testid="text-champion-name">
                          {champion?.name || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 font-bold text-success-green" data-testid="text-champion-hours">
                      {champion?.hours?.toFixed(2) || 'N/A'}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Medal className="h-5 w-5 text-premium-silver" />
                        <span className="font-semibold" data-testid="text-runnerup-name">
                          {runnerUp?.name || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 font-bold text-success-green" data-testid="text-runnerup-hours">
                      {runnerUp?.hours?.toFixed(2) || 'N/A'}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Award className="h-5 w-5 text-rich-bronze" />
                        <span className="font-semibold" data-testid="text-third-name">
                          {thirdPlace?.name || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 font-bold text-success-green" data-testid="text-third-hours">
                      {thirdPlace?.hours?.toFixed(2) || 'N/A'}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-b border-border text-muted-foreground">
                    <TableCell className="py-4 px-6 font-semibold">Sep-25</TableCell>
                    <TableCell className="py-4 px-6">Auto-populate when data added</TableCell>
                    <TableCell className="py-4 px-6">-</TableCell>
                    <TableCell className="py-4 px-6">Auto-populate when data added</TableCell>
                    <TableCell className="py-4 px-6">-</TableCell>
                    <TableCell className="py-4 px-6">Auto-populate when data added</TableCell>
                    <TableCell className="py-4 px-6">-</TableCell>
                  </TableRow>
                  <TableRow className="text-muted-foreground">
                    <TableCell className="py-4 px-6 font-semibold">Oct-25</TableCell>
                    <TableCell className="py-4 px-6">Auto-populate when data added</TableCell>
                    <TableCell className="py-4 px-6">-</TableCell>
                    <TableCell className="py-4 px-6">Auto-populate when data added</TableCell>
                    <TableCell className="py-4 px-6">-</TableCell>
                    <TableCell className="py-4 px-6">Auto-populate when data added</TableCell>
                    <TableCell className="py-4 px-6">-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Championship Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6" data-testid="card-current-champion">
            <div className="championship-gold-bg text-black p-4 rounded-lg text-center">
              <Crown className="h-8 w-8 mx-auto mb-2" />
              <h3 className="font-bold">Current Champion</h3>
              <p className="text-lg" data-testid="text-current-champion">
                {champion?.name || 'No data available'}
              </p>
            </div>
          </Card>
          
          <Card className="p-6" data-testid="card-current-runnerup">
            <div className="premium-silver-bg text-black p-4 rounded-lg text-center">
              <Medal className="h-8 w-8 mx-auto mb-2" />
              <h3 className="font-bold">Current Runner-Up</h3>
              <p className="text-lg" data-testid="text-current-runnerup">
                {runnerUp?.name || 'No data available'}
              </p>
            </div>
          </Card>
          
          <Card className="p-6" data-testid="card-current-third">
            <div className="rich-bronze-bg text-white p-4 rounded-lg text-center">
              <Award className="h-8 w-8 mx-auto mb-2" />
              <h3 className="font-bold">Current Third Place</h3>
              <p className="text-lg" data-testid="text-current-third">
                {thirdPlace?.name || 'No data available'}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
