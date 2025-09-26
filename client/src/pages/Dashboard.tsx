import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Medal, Award, Users, Clock, TrendingUp, CheckCircle, Calendar, Gift, PartyPopper } from "lucide-react";

interface DashboardSummary {
  totalContractors: number;
  totalHours: number;
  averageHours: number;
  aboveThresholdPercentage: number;
  topPerformers: Array<{
    contractorId: number;
    name: string;
    hours: number;
    rank: number;
    month: string;
  }>;
  underPerformers: Array<{
    contractorId: number;
    name: string;
    hours: number;
    rank: number;
    month: string;
  }>;
  currentMonth: string;
}

interface SpecialSections {
  upcomingBirthdays: Array<{
    name: string;
    birthday: string;
    daysUntil: number;
  }>;
  oneYearAnniversaries: Array<{
    name: string;
    startDate: string;
    daysUntil: number;
    yearsWorked: number;
  }>;
  remainingHolidays: Array<{
    name: string;
    date: string;
    daysUntil: number;
  }>;
}

export default function Dashboard() {
  const { data: summary, isLoading } = useQuery<DashboardSummary>({
    queryKey: ["/api/dashboard/summary"],
  });

  const { data: specialSections, isLoading: isLoadingSpecial } = useQuery<SpecialSections>({
    queryKey: ["/api/dashboard/special-sections"],
  });

  if (isLoading || isLoadingSpecial) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (!summary || !specialSections) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-muted-foreground">Unable to load dashboard data</div>
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
        return "championship-gold-bg";
      case 2:
        return "premium-silver-bg";
      case 3:
        return "rich-bronze-bg";
      default:
        return "";
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header Section */}
      <div className="gradient-header text-white text-center py-12 fade-in">
        <div className="mb-6">
          <div className="inline-flex flex-col items-center justify-center bg-white px-8 py-4 rounded-xl shadow-lg pulse-glow">
            <h2 className="text-4xl font-bold gradient-text-blue" data-testid="text-brand-logo">
              PodcastPros
            </h2>
            <p className="text-lg text-gray-700 mt-2" data-testid="text-brand-tagline">
              Excellence in B2B Podcasts
            </p>
          </div>
        </div>
        <h1 className="text-5xl font-bold mb-4" data-testid="text-header-title">
          Performance Dashboard
        </h1>
        <p className="text-2xl opacity-90" data-testid="text-header-subtitle">
          Contractor Management & Performance Tracking
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Section: Top Performers */}
          <Card className="overflow-hidden card-hover slide-up" data-testid="card-top-performers">
            <CardHeader className="success-green-bg text-white p-4">
              <CardTitle className="text-xl font-bold">Top Productive Performers</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Rank</TableHead>
                      <TableHead className="font-bold">Name</TableHead>
                      <TableHead className="font-bold">Productive Hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.topPerformers.slice(0, 3).map((performer) => (
                      <TableRow 
                        key={performer.contractorId} 
                        className={getRankBg(performer.rank)}
                        data-testid={`row-performer-${performer.rank}`}
                      >
                        <TableCell className="font-bold flex items-center space-x-2">
                          {getRankIcon(performer.rank)}
                          <span>{performer.rank}</span>
                        </TableCell>
                        <TableCell className="font-semibold">{performer.name}</TableCell>
                        <TableCell className="font-bold" data-testid={`text-hours-${performer.contractorId}`}>
                          {performer.hours.toFixed(2)} hours
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Right Section: Productivity Alert */}
          <Card className="overflow-hidden card-hover slide-up" data-testid="card-productivity-alert">
            <CardHeader className="alert-red-bg text-white p-4">
              <CardTitle className="text-xl font-bold">Performance Alert (Full-Time: Below 100h | Part-Time: Below 50h)</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {summary.underPerformers.length === 0 ? (
                <div className="success-green-bg text-white p-4 rounded-lg text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                  <h3 className="text-lg font-bold mb-2" data-testid="text-productivity-status">
                    Everyone is Productive!
                  </h3>
                  <p className="opacity-90" data-testid="text-productivity-message">
                    All {summary.totalContractors} active contractors meet performance thresholds
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="alert-red-bg text-white p-4 rounded-lg text-center">
                    <h3 className="text-lg font-bold mb-2">Development Opportunities</h3>
                    <p className="opacity-90">
                      {summary.underPerformers.length} contractor(s) need attention
                    </p>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contractor</TableHead>
                        <TableHead>Hours</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.underPerformers.map((employee) => (
                        <TableRow key={employee.contractorId} data-testid={`row-underperformer-${employee.contractorId}`}>
                          <TableCell>{employee.name}</TableCell>
                          <TableCell className="performance-low">
                            {employee.hours.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Team Productivity Status</span>
                  <span className="text-success-green font-bold" data-testid="text-team-status">
                    {summary.aboveThresholdPercentage >= 100 ? "Excellent" : "Good"}
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${summary.aboveThresholdPercentage}%`,
                      backgroundColor: 'hsl(120, 100%, 40%)' // Success green color
                    }}
                    data-testid="progress-team-productivity"
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 fade-in">
          <Card className="p-6 card-hover">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-electric-blue" />
              <div className="text-3xl font-bold text-electric-blue" data-testid="text-total-contractors">
                {summary.totalContractors}
              </div>
              <div className="text-muted-foreground">Total Contractors</div>
            </div>
          </Card>
          
          <Card className="p-6 card-hover">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-success-green" />
              <div className="text-3xl font-bold text-success-green" data-testid="text-total-hours">
                {summary.totalHours.toLocaleString()}
              </div>
              <div className="text-muted-foreground">Total Hours</div>
            </div>
          </Card>
          
          <Card className="p-6 card-hover">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-championship-gold" />
              <div className="text-3xl font-bold text-championship-gold" data-testid="text-average-hours">
                {summary.averageHours.toFixed(1)}
              </div>
              <div className="text-muted-foreground">Average Hours</div>
            </div>
          </Card>
          
          <Card className="p-6 card-hover">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-vibrant-cyan" />
              <div className="text-3xl font-bold text-vibrant-cyan" data-testid="text-threshold-percentage">
                {summary.aboveThresholdPercentage}%
              </div>
              <div className="text-muted-foreground">Above Threshold</div>
            </div>
          </Card>
        </div>

        {/* Special Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6 fade-in">
          {/* Contractor Birthdays */}
          <Card className="overflow-hidden card-hover slide-up" data-testid="card-upcoming-birthdays">
            <CardHeader className="electric-blue-bg text-white p-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Upcoming Birthdays
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {specialSections.upcomingBirthdays.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No upcoming birthdays in the next 30 days
                </div>
              ) : (
                <div className="space-y-3">
                  {specialSections.upcomingBirthdays.slice(0, 5).map((birthday, index) => (
                    <div key={index} className="flex items-center justify-between border-b border-border pb-2 last:border-b-0" data-testid={`birthday-item-${index}`}>
                      <div>
                        <div className="font-medium text-sm">{birthday.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(birthday.birthday).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-electric-blue">
                          {birthday.daysUntil === 0 ? 'Today!' : 
                           birthday.daysUntil === 1 ? 'Tomorrow' : 
                           `${birthday.daysUntil} days`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 1-Year Anniversaries */}
          <Card className="overflow-hidden card-hover slide-up" data-testid="card-anniversaries">
            <CardHeader className="success-green-bg text-white p-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <PartyPopper className="h-5 w-5" />
                Work Anniversaries
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {specialSections.oneYearAnniversaries.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No work anniversaries in the next 30 days
                </div>
              ) : (
                <div className="space-y-3">
                  {specialSections.oneYearAnniversaries.slice(0, 5).map((anniversary, index) => (
                    <div key={index} className="flex items-center justify-between border-b border-border pb-2 last:border-b-0" data-testid={`anniversary-item-${index}`}>
                      <div>
                        <div className="font-medium text-sm">{anniversary.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {anniversary.yearsWorked} {anniversary.yearsWorked === 1 ? 'year' : 'years'} with Podcast Pros
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-success-green">
                          {anniversary.daysUntil === 0 ? 'Today!' : 
                           anniversary.daysUntil === 1 ? 'Tomorrow' : 
                           `${anniversary.daysUntil} days`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Remaining US Holidays */}
          <Card className="overflow-hidden card-hover slide-up" data-testid="card-remaining-holidays">
            <CardHeader className="championship-gold-bg text-white p-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming US Holidays
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {specialSections.remainingHolidays.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No more holidays this year
                </div>
              ) : (
                <div className="space-y-3">
                  {specialSections.remainingHolidays.slice(0, 5).map((holiday, index) => (
                    <div key={index} className="flex items-center justify-between border-b border-border pb-2 last:border-b-0" data-testid={`holiday-item-${index}`}>
                      <div>
                        <div className="font-medium text-sm">{holiday.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(holiday.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-championship-gold">
                          {holiday.daysUntil === 0 ? 'Today!' : 
                           holiday.daysUntil === 1 ? 'Tomorrow' : 
                           `${holiday.daysUntil} days`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message */}
        <div className="mt-8 text-center">
          <div className="gradient-header text-white rounded-lg p-6 mx-4">
            <h2 className="text-3xl font-bold mb-2" data-testid="text-welcome-title">
              Welcome to PodcastPros Platform! 🎉
            </h2>
            <p className="text-lg opacity-90" data-testid="text-welcome-message">
              Your comprehensive contractor management and performance tracking solution
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
