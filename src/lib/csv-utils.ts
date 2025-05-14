/**
 * Converts an array of objects to CSV format
 * @param data Array of objects to convert to CSV
 * @returns A CSV formatted string
 */
export function convertToCSV(data: Record<string, any>[]): string {
  if (!data || !data.length) {
    return '';
  }
  
  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const headerRow = headers.join(',');
  
  // Create CSV data rows
  const rows = data.map(row => {
    return headers.map(header => {
      // Get the value for this cell
      const value = row[header];
      
      // Handle different types of values
      if (value === null || value === undefined) {
        return '';
      }
      
      // Convert to string and escape quotes
      const cellValue = String(value).replace(/"/g, '""');
      
      // Wrap in quotes if the value contains commas, quotes, or newlines
      if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
        return `"${cellValue}"`;
      }
      
      return cellValue;
    }).join(',');
  });
  
  // Combine header and data rows
  return [headerRow, ...rows].join('\n');
}

/**
 * Downloads a CSV string as a file
 * @param csvContent The CSV content as a string
 * @param filename The name of the file to download
 */
export function downloadCSV(csvContent: string, filename: string): void {
  if (!csvContent) {
    console.error('No CSV content to download');
    return;
  }
  
  // Create a Blob containing the CSV data
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a temporary link element
  const link = document.createElement('a');
  
  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);
  
  // Set the link properties
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Add the link to the DOM
  document.body.appendChild(link);
  
  // Click the link to start the download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
} 