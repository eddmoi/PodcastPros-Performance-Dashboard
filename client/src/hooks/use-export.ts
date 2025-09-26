import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { downloadCsv } from '@/lib/csv-utils';

interface ExportConfig {
  endpoint: string;
  filename: string;
  successTitle: string;
  successDescription: string;
  errorTitle?: string;
  errorDescription?: string;
}

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportData = async (config: ExportConfig) => {
    if (isExporting) return; // Prevent multiple concurrent exports
    
    setIsExporting(true);
    
    try {
      const response = await fetch(config.endpoint, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      const csvContent = await response.text();
      downloadCsv(csvContent, config.filename);
      
      toast({
        title: config.successTitle,
        description: config.successDescription,
      });
    } catch (error) {
      toast({
        title: config.errorTitle || "Export Failed",
        description: config.errorDescription || "Unable to export data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportData,
    isExporting
  };
}