import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CloudUpload, Download, X, CheckCircle, AlertCircle, FileText, Users, Activity, Shield, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface UploadResponse {
  message: string;
  processed: number;
  errors?: string[];
  data: any[];
}

type UploadType = 'roster' | 'productivity';

export default function DataUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadType, setUploadType] = useState<UploadType>('productivity');
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check admin authentication status
  const { data: authStatus, isLoading: authLoading } = useQuery({
    queryKey: ["/api/auth/status"],
    queryFn: () => fetch("/api/auth/status", { credentials: 'include' }).then(res => res.json())
  });

  const isAdmin = authStatus?.isAdmin;

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('csvFile', file);
      
      const endpoint = uploadType === 'roster' ? '/api/upload-contractor-roster' : '/api/upload-csv';
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include', // This sends your admin session cookies
      });
      
      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || 'Upload failed';
        } catch {
          // If JSON parsing fails, get text response
          const errorText = await response.text();
          errorMessage = response.status === 401 
            ? 'Admin access required. Please log in first.' 
            : `Upload failed (${response.status}): ${errorText.slice(0, 200)}`;
        }
        throw new Error(errorMessage);
      }
      
      return response.json() as Promise<UploadResponse>;
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `Processed ${data.processed} records successfully`,
        variant: "default",
      });
      
      if (data.errors && data.errors.length > 0) {
        toast({
          title: "Some errors occurred",
          description: `${data.errors.length} rows had issues. Check console for details.`,
          variant: "destructive",
        });
        console.warn('Upload errors:', data.errors);
      }
      
      setSelectedFile(null);
      setUploadProgress(0);
      
      // Invalidate all relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/contractors/with-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contractors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      // Invalidate parameterized routes with exact: false to clear all months
      queryClient.invalidateQueries({ queryKey: ["/api/rankings"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/under-performers"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/productivity"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/top-performers"], exact: false });
      // Force refresh all queries to ensure data consistency
      queryClient.refetchQueries();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  // Delete monthly data mutation
  const deleteMonthMutation = useMutation({
    mutationFn: async (month: string) => {
      const response = await fetch(`/api/productivity/${month}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to delete monthly data';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || 'Failed to delete monthly data';
        } catch {
          errorMessage = response.status === 401 
            ? 'Admin access required. Please log in first.' 
            : `Delete failed (${response.status})`;
        }
        throw new Error(errorMessage);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Data Cleared Successfully",
        description: data.message,
        variant: "default",
      });
      
      setSelectedMonth("");
      
      // Invalidate all relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/contractors/with-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rankings"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/under-performers"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/productivity"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/top-performers"], exact: false });
      queryClient.refetchQueries();
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.match(/\.csv$/)) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file only.",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const processUpload = () => {
    if (!selectedFile) return;
    
    setUploadProgress(10);
    uploadMutation.mutate(selectedFile);
  };

  // Generate month options for the last 12 months
  const generateMonthOptions = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear().toString().slice(-2);
      months.push(`${monthName}-${year}`);
    }
    return months;
  };

  const downloadTemplate = () => {
    let csvContent;
    let filename;
    
    if (uploadType === 'roster') {
      csvContent = `Name,ID,Personal Email,Work Email,Work Location,Position,Start Date,Separation Date,Birthday
MK Tolete,1,toletemarkkevin@gmail.com,mktol@argometrix.com,Philippines,Systems Manager,10/21/2024,,
Almeerah Nasheed,2,almeerahnasheed22@gmail.com,producer33@b2bpodcastpros.com,Pakistan,Producer,5/12/2025,,
Hannah Gabiana,4,hannahg.inbox@gmail.com,producer53@b2bpodcastpros.com,Philippines,Producer,6/9/2025,,`;
      filename = 'contractor_roster_template.csv';
    } else {
      csvContent = `Emp No.,Name,Month,Productive Hours,Hours,Productivity
1,MK Tolete,Aug-25,114:39:00,114.65,95.20
2,Almeerah Nasheed,Aug-25,82:51:00,82.85,97.47
4,Hannah Gabiana,Aug-25,199:20:00,199.33,97.76
6,Ukthila Banuka,Aug-25,224:22:00,224.37,85.65
7,Ritz Villagonzalo,Aug-25,173:43:00,173.72,96.51
8,Abu Hurarah,Aug-25,146:48:00,146.80,96.58`;
      filename = 'productivity_data_template.csv';
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Simulate progress for upload
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (uploadMutation.isPending && uploadProgress < 90) {
      interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
    }
    
    if (uploadMutation.isSuccess || uploadMutation.isError) {
      setUploadProgress(100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [uploadMutation.isPending, uploadMutation.isSuccess, uploadMutation.isError, uploadProgress]);

  return (
    <div className="page-wrapper">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="podcast-purple-bg text-white p-6 rounded-lg mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
            Data Management Portal
          </h1>
          <p className="text-lg opacity-90">CSV Upload & Processing</p>
        </div>

        {/* Upload Type Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-bold mb-4">Upload Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <Button
                variant={uploadType === 'productivity' ? 'default' : 'outline'}
                onClick={() => setUploadType('productivity')}
                className={uploadType === 'productivity' ? 'electric-blue-bg' : ''}
                data-testid="button-select-productivity"
              >
                <Activity className="h-4 w-4 mr-2" />
                Productivity Data
              </Button>
              <Button
                variant={uploadType === 'roster' ? 'default' : 'outline'}
                onClick={() => setUploadType('roster')}
                className={uploadType === 'roster' ? 'electric-blue-bg' : ''}
                data-testid="button-select-roster"
              >
                <Users className="h-4 w-4 mr-2" />
                Contractor Roster
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {uploadType === 'productivity' 
                ? 'Upload monthly productivity data including hours and performance metrics'
                : 'Upload contractor roster information including personal details, positions, and dates'
              }
            </p>
          </CardContent>
        </Card>

        {/* Admin Access Guard */}
        {!authLoading && !isAdmin && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-amber-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800 mb-2">Admin Access Required</h3>
                  <p className="text-amber-700 mb-4">
                    You must be logged in as an administrator to upload CSV files and manage data.
                  </p>
                  <Link href="/login">
                    <Button className="electric-blue-bg hover:opacity-90" data-testid="button-login-required">
                      <Shield className="h-4 w-4 mr-2" />
                      Login as Admin
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Interface */}
        <Card className="mb-8" data-testid="card-upload-interface">
          <CardHeader>
            <CardTitle className="text-xl font-bold mb-4">
              Upload {uploadType === 'productivity' ? 'Productivity Data' : 'Contractor Roster'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Drag and Drop Zone */}
            <div 
              className={`drag-drop-zone rounded-lg p-12 text-center mb-6 transition-all duration-300 ${
                isDragOver ? 'drag-over border-vibrant-cyan' : 'border-electric-blue'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              data-testid="dropzone-csv-upload"
            >
              <CloudUpload className="h-16 w-16 mx-auto mb-4 text-electric-blue" />
              <h3 className="text-xl font-semibold mb-2">Drop your CSV file here</h3>
              <p className="text-muted-foreground mb-4">or click to browse</p>
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                id="csv-file-input"
                onChange={handleFileInputChange}
                data-testid="input-csv-file"
              />
              <Button 
                onClick={() => document.getElementById('csv-file-input')?.click()}
                disabled={!isAdmin || authLoading}
                className="electric-blue-bg hover:opacity-90 disabled:opacity-50"
                data-testid="button-choose-file"
              >
                {authLoading ? 'Loading...' : 'Choose File'}
              </Button>
            </div>

            {/* File Info */}
            {selectedFile && (
              <Card className="bg-blue-50 border-blue-200 mb-4" data-testid="card-file-info">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-semibold" data-testid="text-file-name">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid="text-file-size">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={clearFile}
                      className="text-red-600 hover:text-red-800"
                      data-testid="button-clear-file"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress Bar */}
            {(uploadMutation.isPending || uploadProgress > 0) && (
              <div className="mb-4" data-testid="container-upload-progress">
                <div className="flex justify-between text-sm mb-2">
                  <span>Processing...</span>
                  <span data-testid="text-progress-percentage">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Upload Button */}
            <Button 
              onClick={processUpload}
              disabled={!selectedFile || uploadMutation.isPending || !isAdmin || authLoading}
              className="success-green-bg hover:opacity-90 disabled:opacity-50"
              data-testid="button-process-upload"
            >
              {authLoading ? "Loading..." : uploadMutation.isPending ? "Processing..." : "Process Upload"}
            </Button>

            {/* Success/Error Messages */}
            {uploadMutation.isSuccess && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg" data-testid="container-upload-success">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-green-800 font-medium">Upload completed successfully!</p>
                </div>
              </div>
            )}

            {uploadMutation.isError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg" data-testid="container-upload-error">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-red-800 font-medium">Upload failed. Please try again.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Data Management */}
        {isAdmin && (
          <Card className="mb-8" data-testid="card-monthly-data-management">
            <CardHeader>
              <CardTitle className="text-xl font-bold mb-4 flex items-center">
                <Trash2 className="h-5 w-5 mr-2 text-red-600" />
                Monthly Data Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded mb-6">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-semibold text-amber-800 mb-2">Warning: Permanent Data Deletion</h4>
                    <p className="text-amber-700 text-sm">
                      This action will permanently delete all productivity data for the selected month. 
                      This cannot be undone. Contractor information will be preserved.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Month to Clear</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth} data-testid="select-month-to-clear">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a month..." />
                    </SelectTrigger>
                    <SelectContent>
                      {generateMonthOptions().map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        disabled={!selectedMonth || deleteMonthMutation.isPending}
                        className="w-full"
                        data-testid="button-clear-monthly-data"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deleteMonthMutation.isPending ? "Clearing..." : "Clear Monthly Data"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent data-testid="dialog-confirm-delete">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Data Deletion</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to permanently delete all productivity data for <strong>{selectedMonth}</strong>? 
                          <br /><br />
                          This action cannot be undone. Only productivity records will be deleted; contractor information will be preserved.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMonthMutation.mutate(selectedMonth)}
                          className="bg-red-600 hover:bg-red-700"
                          data-testid="button-confirm-delete"
                        >
                          Delete {selectedMonth} Data
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Success/Error Messages for Delete */}
              {deleteMonthMutation.isSuccess && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg" data-testid="container-delete-success">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-green-800 font-medium">Monthly data cleared successfully!</p>
                  </div>
                </div>
              )}

              {deleteMonthMutation.isError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg" data-testid="container-delete-error">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <p className="text-red-800 font-medium">Failed to clear data. Please try again.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sample CSV Template */}
        <Card data-testid="card-csv-template">
          <CardHeader>
            <CardTitle className="text-xl font-bold mb-4">Expected CSV Format</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto mb-4">
              <pre className="text-sm whitespace-pre-wrap" data-testid="text-csv-sample">
{uploadType === 'productivity' ? `Emp No.,Name,Month,Productive Hours,Hours,Productivity
1,MK Tolete,Aug-25,114:39:00,114.65,95.20
2,Almeerah Nasheed,Aug-25,82:51:00,82.85,97.47
4,Hannah Gabiana,Aug-25,199:20:00,199.33,97.76
6,Ukthila Banuka,Aug-25,224:22:00,224.37,85.65` : `Name,ID,Personal Email,Work Email,Work Location,Position,Start Date,Separation Date,Birthday
MK Tolete,1,toletemarkkevin@gmail.com,mktol@argometrix.com,Philippines,Systems Manager,10/21/2024,,
Almeerah Nasheed,2,almeerahnasheed22@gmail.com,producer33@b2bpodcastpros.com,Pakistan,Producer,5/12/2025,,
Hannah Gabiana,4,hannahg.inbox@gmail.com,producer53@b2bpodcastpros.com,Philippines,Producer,6/9/2025,,`}
              </pre>
            </div>
            <Button 
              onClick={downloadTemplate}
              variant="outline"
              className="border-electric-blue text-electric-blue hover:bg-blue-50"
              data-testid="button-download-template"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            
            <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <h4 className="font-semibold text-yellow-800 mb-2">Upload Guidelines:</h4>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>• CSV file must include all required columns in the exact order shown</li>
                {uploadType === 'productivity' ? (
                  <>
                    <li>• Contractor numbers must match existing roster entries</li>
                    <li>• Productive Hours can be in time format (HH:MM:SS) or decimal format</li>
                    <li>• Month format should be: Mon-YY (e.g., Aug-25, Sep-25)</li>
                  </>
                ) : (
                  <>
                    <li>• Contractor ID must be unique</li>
                    <li>• Email addresses should be valid format</li>
                    <li>• Dates should be in MM/DD/YYYY format</li>
                    <li>• Leave optional fields blank if not available</li>
                  </>
                )}
                <li>• File size limit: 10MB</li>
                <li>• Supported formats: .csv only</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
