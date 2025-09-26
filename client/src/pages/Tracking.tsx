import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

interface MonthlyRanking {
  contractorId: number;
  name: string;
  hours: number;
  rank: number;
  month: string;
}

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

export default function Tracking() {
  const { data: augustRankings, isLoading: rankingsLoading } = useQuery<MonthlyRanking[]>({
    queryKey: ["/api/rankings/Aug-25"],
  });

  const { data: contractorsWithData, isLoading: contractorsLoading } = useQuery<ContractorWithData[]>({
    queryKey: ["/api/contractors/with-data"],
  });

  if (rankingsLoading || contractorsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading tracking data...</div>
      </div>
    );
  }

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

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "championship-gold-bg text-black";
      case 2:
        return "premium-silver-bg text-black";
      case 3:
        return "rich-bronze-bg text-white";
      default:
        return "";
    }
  };

  const getLegendaryStatus = (rank: number, hours: number) => {
    if (rank <= 3 && hours > 150) return { label: "Elite Performer", class: "bg-purple-100 text-purple-800" };
    if (rank <= 3) return { label: "Rising Star", class: "bg-green-100 text-green-800" };
    if (hours > 150) return { label: "High Achiever", class: "bg-blue-100 text-blue-800" };
    if (hours >= 75) return { label: "Developing", class: "bg-yellow-100 text-yellow-800" };
    return { label: "Needs Support", class: "bg-red-100 text-red-800" };
  };

  return (
    <div className="page-wrapper">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="rich-bronze-bg text-white p-6 rounded-lg mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
            Productivity Tracking & Rankings Analysis
          </h1>
          <p className="text-lg opacity-90">Sustained Excellence Monitoring (Performance Standards: Full-Time ≥100h | Part-Time ≥50h)</p>
        </div>

        <Card className="overflow-hidden mb-6" data-testid="card-tracking-table">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="table-hover">
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="font-bold py-4 px-6">Contractor Name</TableHead>
                    <TableHead className="font-bold py-4 px-6">Aug-25 Rank</TableHead>
                    <TableHead className="font-bold py-4 px-6">Sep-25 Rank</TableHead>
                    <TableHead className="font-bold py-4 px-6">Oct-25 Rank</TableHead>
                    <TableHead className="font-bold py-4 px-6">Total Top 3</TableHead>
                    <TableHead className="font-bold py-4 px-6">Legendary Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractorsWithData?.map((contractor) => {
                    const augustRank = augustRankings?.find(r => r.contractorId === contractor.id)?.rank || 0;
                    const augustHours = augustRankings?.find(r => r.contractorId === contractor.id)?.hours || 0;
                    const topThreeCount = augustRank <= 3 ? 1 : 0;
                    const legendaryStatus = getLegendaryStatus(augustRank, augustHours);
                    
                    return (
                      <TableRow 
                        key={contractor.id} 
                        className="border-b border-border"
                        data-testid={`row-contractor-tracking-${contractor.id}`}
                      >
                        <TableCell className="py-4 px-6 font-semibold" data-testid={`text-contractor-name-${contractor.id}`}>
                          {contractor.name}
                        </TableCell>
                        <TableCell className="py-4 px-6" data-testid={`text-aug-rank-${contractor.id}`}>
                          <div className={`inline-flex items-center space-x-2 px-2 py-1 rounded ${getRankBg(augustRank)}`}>
                            {getRankIcon(augustRank)}
                            <span className="font-bold">{augustRank > 0 ? augustRank : 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-muted-foreground">-</TableCell>
                        <TableCell className="py-4 px-6 text-muted-foreground">-</TableCell>
                        <TableCell className="py-4 px-6 font-bold text-electric-blue" data-testid={`text-top-three-count-${contractor.id}`}>
                          {topThreeCount}
                        </TableCell>
                        <TableCell className="py-4 px-6" data-testid={`text-legendary-status-${contractor.id}`}>
                          <Badge variant="outline" className={`${legendaryStatus.class} border-0`}>
                            {legendaryStatus.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="p-4" data-testid="card-ranking-legend">
          <CardHeader>
            <CardTitle>Ranking & Performance Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Position Rankings:</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-championship-gold" />
                    <span className="text-sm">1st Place (Gold)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Medal className="h-5 w-5 text-premium-silver" />
                    <span className="text-sm">2nd Place (Silver)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-rich-bronze" />
                    <span className="text-sm">3rd Place (Bronze)</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Performance Categories:</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-0">Elite Performer</Badge>
                    <span className="text-sm">Top 3 + {'>'}150hrs</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-0">Rising Star</Badge>
                    <span className="text-sm">Top 3 position</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-0">High Achiever</Badge>
                    <span className="text-sm">{'>'}150 hours</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-0">Developing</Badge>
                    <span className="text-sm">75-150 hours</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-0">Needs Support</Badge>
                    <span className="text-sm">{'<'}75 hours</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
