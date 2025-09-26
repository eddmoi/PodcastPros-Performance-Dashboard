import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Search, Plus, Edit, Archive, ArrowUpDown, Filter, X, Download } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContractorSchema, type Contractor, type InsertContractor } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useExport } from "@/hooks/use-export";

// Contractor Type Editor Component
function ContractorTypeEditor({ contractor }: { contractor: Contractor }) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedType, setSelectedType] = useState(contractor.contractorType || 'Full Time');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateTypeMutation = useMutation({
    mutationFn: async (newType: string) => {
      const response = await fetch(`/api/contractors/${contractor.id}`, {
        method: 'PUT',
        body: JSON.stringify({ contractorType: newType }),
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to update contractor type');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contractors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contractors/with-data"] });
      toast({
        title: "Success",
        description: "Contractor type updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contractor type",
        variant: "destructive",
      });
      setSelectedType(contractor.contractorType || 'Full Time');
    },
  });

  const handleTypeChange = (newType: string) => {
    setSelectedType(newType);
    updateTypeMutation.mutate(newType);
  };

  if (isEditing) {
    return (
      <Select 
        value={selectedType} 
        onValueChange={handleTypeChange}
        disabled={updateTypeMutation.isPending}
        onOpenChange={(open) => {
          if (!open && !updateTypeMutation.isPending) {
            setIsEditing(false);
          }
        }}
      >
        <SelectTrigger className="w-32" data-testid={`select-contractor-type-${contractor.id}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Full Time">Full Time</SelectItem>
          <SelectItem value="Part Time">Part Time</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <div 
      className="cursor-pointer hover:bg-gray-50 p-1 rounded"
      onClick={() => setIsEditing(true)}
      data-testid={`button-edit-type-${contractor.id}`}
    >
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        selectedType === 'Full Time' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-blue-100 text-blue-800'
      }`}>
        {selectedType}
      </span>
    </div>
  );
}

// Define update schema without id
const updateContractorSchema = insertContractorSchema.omit({ id: true }).partial();
type UpdateContractor = z.infer<typeof updateContractorSchema>;

export default function Roster() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<'name' | 'id'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Primary status filter (Active/Inactive toggle)
  const [primaryStatusFilter, setPrimaryStatusFilter] = useState<'active' | 'inactive'>('active');
  
  // Advanced filtering states
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [startDateFrom, setStartDateFrom] = useState<string>("");
  const [startDateTo, setStartDateTo] = useState<string>("");

  const { data: contractors, isLoading } = useQuery<Contractor[]>({
    queryKey: ["/api/contractors"],
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { exportData, isExporting } = useExport();

  const handleExportContractors = () => {
    exportData({
      endpoint: '/api/export/contractors',
      filename: 'contractors.csv',
      successTitle: "Export Successful",
      successDescription: "Contractor data has been exported to CSV",
    });
  };

  // Form for editing (partial updates)
  const editForm = useForm<UpdateContractor>({
    resolver: zodResolver(updateContractorSchema),
  });

  // Form for creating new contractors (without ID)
  const createSchema = insertContractorSchema.omit({ id: true });
  const createForm = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: "",
      personalEmail: "",
      workEmail: "",
      workLocation: "",
      position: "",
      startDate: "",
      separationDate: "",
      birthday: "",
      status: "active",
      contractorType: "Full Time",
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (contractor: z.infer<typeof createSchema>) => {
      const response = await fetch('/api/contractors', {
        method: 'POST',
        body: JSON.stringify(contractor),
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to create contractor');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contractors"] });
      toast({
        title: "Success",
        description: "Contractor created successfully",
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create contractor",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; contractor: UpdateContractor }) => {
      const response = await fetch(`/api/contractors/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data.contractor),
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to update contractor');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contractors"] });
      toast({
        title: "Success",
        description: "Contractor updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingContractor(null);
      editForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contractor",
        variant: "destructive",
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/contractors/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to archive contractor');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contractors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contractors/with-data"] });
      toast({
        title: "Success",
        description: "Contractor archived successfully. Data preserved for historical records.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to archive contractor",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading roster data...</div>
      </div>
    );
  }

  const handleSort = (column: 'name' | 'id') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Get unique values for filter dropdowns
  const statusOptions = ["active", "archived"]; // Fixed status options
  const uniqueLocations = contractors ? Array.from(new Set(contractors.map(c => c.workLocation).filter((location): location is string => Boolean(location)))) : [];
  const uniquePositions = contractors ? Array.from(new Set(contractors.map(c => c.position).filter((position): position is string => Boolean(position)))) : [];
  
  // Enhanced filtering function
  const filteredAndSortedContractors = contractors ? [...contractors]
    .filter(contractor => {
      // Primary status filter (Active/Inactive toggle)
      const matchesPrimaryStatus = primaryStatusFilter === 'active' ? contractor.status === 'active' : contractor.status !== 'active';
      
      // Text search across multiple fields
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        contractor.name.toLowerCase().includes(searchLower) ||
        contractor.id.toString().includes(searchTerm) ||
        contractor.workEmail?.toLowerCase().includes(searchLower) ||
        contractor.personalEmail?.toLowerCase().includes(searchLower) ||
        contractor.workLocation?.toLowerCase().includes(searchLower) ||
        contractor.position?.toLowerCase().includes(searchLower);
      
      // Advanced status filter (only applies if primary filter allows)
      const matchesStatus = !statusFilter || statusFilter === "all" || contractor.status === statusFilter;
      
      // Location filter
      const matchesLocation = !locationFilter || locationFilter === "all" || contractor.workLocation === locationFilter;
      
      // Position filter
      const matchesPosition = !positionFilter || positionFilter === "all" || contractor.position === positionFilter;
      
      // Date range filters
      const matchesStartDateFrom = !startDateFrom || !contractor.startDate || contractor.startDate >= startDateFrom;
      const matchesStartDateTo = !startDateTo || !contractor.startDate || contractor.startDate <= startDateTo;
      
      return matchesPrimaryStatus && matchesSearch && matchesStatus && matchesLocation && matchesPosition && matchesStartDateFrom && matchesStartDateTo;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      if (sortColumn === 'name') {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      } else {
        aValue = a.id;
        bValue = b.id;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    }) : [];

  // Determine if we should show separation date column (only for archived contractors)
  const hasArchivedContractors = filteredAndSortedContractors.some(c => c.status === 'archived');
  const showSeparationDateColumn = statusFilter === 'archived' || 
    ((!statusFilter || statusFilter === 'all') && hasArchivedContractors);
  
  
  // Function to clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setLocationFilter("all");
    setPositionFilter("all");
    setStartDateFrom("");
    setStartDateTo("");
  };
  
  // Check if any filters are active
  const hasActiveFilters = searchTerm || (statusFilter && statusFilter !== "all") || (locationFilter && locationFilter !== "all") || (positionFilter && positionFilter !== "all") || startDateFrom || startDateTo;

  return (
    <div className="page-wrapper">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="vibrant-cyan-bg text-white p-6 rounded-lg mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
            Contractor Roster Management
          </h1>
          <p className="text-lg opacity-90">Complete Contractor Directory</p>
        </div>

        <Card className="overflow-hidden" data-testid="card-roster-table">
          <CardHeader className="p-6 border-b border-border">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle className="text-xl font-bold" data-testid="text-contractors-count">
                  {primaryStatusFilter === 'active' ? 'Active' : 'Inactive'} Contractors ({filteredAndSortedContractors.length})
                </CardTitle>
                <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search contractors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                    data-testid="input-search-contractors"
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  className={`flex items-center space-x-2 ${hasActiveFilters ? 'bg-blue-50 border-blue-200' : ''}`}
                  data-testid="button-toggle-filters"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {hasActiveFilters && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 ml-1">
                      {[searchTerm, statusFilter && statusFilter !== "all" ? statusFilter : null, locationFilter && locationFilter !== "all" ? locationFilter : null, positionFilter && positionFilter !== "all" ? positionFilter : null, startDateFrom, startDateTo].filter(Boolean).length}
                    </span>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleExportContractors}
                  disabled={isExporting}
                  className="flex items-center space-x-2 disabled:opacity-50"
                  data-testid="button-export-contractors"
                >
                  <Download className="h-4 w-4" />
                  <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
                </Button>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="electric-blue-bg hover:opacity-90"
                      data-testid="button-add-contractor"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contractor
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Add New Contractor</DialogTitle>
                    </DialogHeader>
                    <Form {...createForm}>
                      <form onSubmit={createForm.handleSubmit((data) => {
                        createMutation.mutate(data);
                      })} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={createForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="position"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Position</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={createForm.control}
                            name="personalEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Personal Email</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} type="email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="workEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Work Email</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} type="email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={createForm.control}
                            name="workLocation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Work Location</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={createForm.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Date</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} type="date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="separationDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Separation Date</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} type="date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={createForm.control}
                            name="birthday"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Birthday</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} type="date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="contractorType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contractor Type</FormLabel>
                                <FormControl>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Full Time">Full Time</SelectItem>
                                      <SelectItem value="Part Time">Part Time</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => {
                            setIsCreateDialogOpen(false);
                            createForm.reset();
                          }}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-create">
                            {createMutation.isPending ? "Creating..." : "Create"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
              </div>
              
              {/* Active/Inactive Toggle Buttons */}
              <div className="flex items-center space-x-2">
                <Button
                  variant={primaryStatusFilter === 'active' ? 'default' : 'outline'}
                  onClick={() => setPrimaryStatusFilter('active')}
                  className={primaryStatusFilter === 'active' ? 'success-green-bg text-white' : ''}
                  data-testid="button-filter-active"
                >
                  Active
                </Button>
                <Button
                  variant={primaryStatusFilter === 'inactive' ? 'default' : 'outline'}
                  onClick={() => setPrimaryStatusFilter('inactive')}
                  className={primaryStatusFilter === 'inactive' ? 'alert-red-bg text-white' : ''}
                  data-testid="button-filter-inactive"
                >
                  Inactive
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {/* Advanced Filters Section */}
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <CollapsibleContent className="border-b border-border p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={statusFilter || "all"} onValueChange={setStatusFilter}>
                    <SelectTrigger data-testid="select-status-filter">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {statusOptions.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Select value={locationFilter || "all"} onValueChange={setLocationFilter}>
                    <SelectTrigger data-testid="select-location-filter">
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All locations</SelectItem>
                      {uniqueLocations.map(location => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Position</label>
                  <Select value={positionFilter || "all"} onValueChange={setPositionFilter}>
                    <SelectTrigger data-testid="select-position-filter">
                      <SelectValue placeholder="All positions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All positions</SelectItem>
                      {uniquePositions.map(position => (
                        <SelectItem key={position} value={position}>
                          {position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Start Date From</label>
                  <Input
                    type="date"
                    value={startDateFrom}
                    onChange={(e) => setStartDateFrom(e.target.value)}
                    data-testid="input-start-date-from"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Start Date To</label>
                  <Input
                    type="date"
                    value={startDateTo}
                    onChange={(e) => setStartDateTo(e.target.value)}
                    data-testid="input-start-date-to"
                  />
                </div>
              </div>
              
              {hasActiveFilters && (
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredAndSortedContractors.length} of {contractors?.length || 0} contractors
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={clearAllFilters}
                    className="text-sm flex items-center space-x-1"
                    data-testid="button-clear-filters"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear all filters</span>
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
          
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
                        <span>Name</span>
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
                    <TableHead className="font-bold py-4 px-6">Work Location</TableHead>
                    <TableHead className="font-bold py-4 px-6">Position</TableHead>
                    <TableHead className="font-bold py-4 px-6">Start Date</TableHead>
                    {showSeparationDateColumn && (
                      <TableHead className="font-bold py-4 px-6">Separation Date</TableHead>
                    )}
                    <TableHead className="font-bold py-4 px-6">Birthday</TableHead>
                    <TableHead className="font-bold py-4 px-6">Type</TableHead>
                    <TableHead className="font-bold py-4 px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedContractors.map((contractor) => (
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
                      <TableCell className="py-4 px-6" data-testid={`text-work-location-${contractor.id}`}>
                        {contractor.workLocation || '-'}
                      </TableCell>
                      <TableCell className="py-4 px-6" data-testid={`text-position-${contractor.id}`}>
                        {contractor.position || '-'}
                      </TableCell>
                      <TableCell className="py-4 px-6" data-testid={`text-start-date-${contractor.id}`}>
                        {contractor.startDate || '-'}
                      </TableCell>
                      {showSeparationDateColumn && (
                        <TableCell className="py-4 px-6" data-testid={`text-separation-date-${contractor.id}`}>
                          {contractor.separationDate || '-'}
                        </TableCell>
                      )}
                      <TableCell className="py-4 px-6" data-testid={`text-birthday-${contractor.id}`}>
                        {contractor.birthday || '-'}
                      </TableCell>
                      <TableCell className="py-4 px-6" data-testid={`text-contractor-type-${contractor.id}`}>
                        <ContractorTypeEditor contractor={contractor} />
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Dialog open={isEditDialogOpen && editingContractor?.id === contractor.id} onOpenChange={(open) => {
                            setIsEditDialogOpen(open);
                            if (!open) {
                              setEditingContractor(null);
                              editForm.reset();
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-electric-blue hover:text-blue-800"
                                data-testid={`button-edit-${contractor.id}`}
                                onClick={() => {
                                  setEditingContractor(contractor);
                                  editForm.reset({
                                    name: contractor.name,
                                    personalEmail: contractor.personalEmail,
                                    workEmail: contractor.workEmail,
                                    workLocation: contractor.workLocation,
                                    position: contractor.position,
                                    startDate: contractor.startDate,
                                    separationDate: contractor.separationDate,
                                    birthday: contractor.birthday,
                                    status: contractor.status,
                                    contractorType: contractor.contractorType,
                                  });
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                              <DialogHeader>
                                <DialogTitle>Edit Contractor</DialogTitle>
                              </DialogHeader>
                              <Form {...editForm}>
                                <form onSubmit={editForm.handleSubmit((data) => {
                                  if (editingContractor) {
                                    updateMutation.mutate({ id: editingContractor.id, contractor: data });
                                  }
                                })} className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={editForm.control}
                                      name="name"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Name</FormLabel>
                                          <FormControl>
                                            <Input {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={editForm.control}
                                      name="position"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Position</FormLabel>
                                          <FormControl>
                                            <Input {...field} value={field.value || ''} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={editForm.control}
                                      name="personalEmail"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Personal Email</FormLabel>
                                          <FormControl>
                                            <Input {...field} value={field.value || ''} type="email" />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={editForm.control}
                                      name="workEmail"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Work Email</FormLabel>
                                          <FormControl>
                                            <Input {...field} value={field.value || ''} type="email" />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={editForm.control}
                                      name="workLocation"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Work Location</FormLabel>
                                          <FormControl>
                                            <Input {...field} value={field.value || ''} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={editForm.control}
                                      name="status"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Status</FormLabel>
                                          <FormControl>
                                            <Input {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={editForm.control}
                                      name="startDate"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Start Date</FormLabel>
                                          <FormControl>
                                            <Input {...field} value={field.value || ''} type="date" />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={editForm.control}
                                      name="separationDate"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Separation Date</FormLabel>
                                          <FormControl>
                                            <Input {...field} value={field.value || ''} type="date" />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={editForm.control}
                                      name="birthday"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Birthday</FormLabel>
                                          <FormControl>
                                            <Input {...field} value={field.value || ''} type="date" />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={editForm.control}
                                      name="contractorType"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Contractor Type</FormLabel>
                                          <FormControl>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="Full Time">Full Time</SelectItem>
                                                <SelectItem value="Part Time">Part Time</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button type="button" variant="outline" onClick={() => {
                                      setIsEditDialogOpen(false);
                                      setEditingContractor(null);
                                      editForm.reset();
                                    }}>
                                      Cancel
                                    </Button>
                                    <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit">
                                      {updateMutation.isPending ? "Updating..." : "Update"}
                                    </Button>
                                  </div>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-orange-600 hover:text-orange-800"
                                data-testid={`button-archive-${contractor.id}`}
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Archive Contractor</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to archive {contractor.name}? This will mark them as archived but preserve all their productivity data for historical records. This is recommended for contractors with separation dates.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => archiveMutation.mutate(contractor.id)}
                                  className="bg-orange-600 hover:bg-orange-700"
                                  disabled={archiveMutation.isPending}
                                  data-testid="button-confirm-archive"
                                >
                                  {archiveMutation.isPending ? "Archiving..." : "Archive"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAndSortedContractors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={showSeparationDateColumn ? 9 : 8} className="py-8 text-center text-muted-foreground">
                        No contractors found matching your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card className="p-4" data-testid="card-active-employees">
            <div className="text-center">
              <div className="text-2xl font-bold text-success-green">
                {contractors?.filter(contractor => contractor.status === 'active').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
          </Card>
          
          <Card className="p-4" data-testid="card-inactive-employees">
            <div className="text-center">
              <div className="text-2xl font-bold text-alert-red">
                {contractors?.filter(contractor => contractor.status !== 'active').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Inactive</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
