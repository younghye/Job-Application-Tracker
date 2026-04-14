import Papa from "papaparse";
import type { JobApplication } from "../../types/job";
import {
  sortJobsByDate,
  // isExistJobByUrl,
  extractJobId,
} from "../../utils/jobUtils";

interface CsvServiceProps {
  data: JobApplication[];
  // onImport: (newData: JobApplication[]) => void;
  columns: any[]; // The result of your getColumns()
}

export const exportCSV = ({ data, columns }: CsvServiceProps) => {
  // Map data to use the "Header" strings from your columns
  const csvData = data.map((job) => {
    const row: any = {};
    columns.forEach((col: any) => {
      if (col.accessorKey) {
        row[col.header] = job[col.accessorKey as keyof JobApplication] || "";
      }
    });
    return row;
  });

  const csv = Papa.unparse(csvData);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `jobs_export_${new Date().toLocaleDateString()}.csv`,
  );
  link.click();
};

export const importCSV = (
  e: React.ChangeEvent<HTMLInputElement>,
  existingData: JobApplication[],
  columns: any[],
): Promise<JobApplication[]> => {
  const file = e.target.files?.[0];
  if (!file) return Promise.resolve([]);

  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validatedList: JobApplication[] = [];
        const tempBatch: JobApplication[] = [];

        results.data.forEach((row: any) => {
          // 1. Map CSV headers back to keys
          const job: any = {};
          columns.forEach((col: any) => {
            if (col.accessorKey) {
              // Ensure we trim whitespace to properly detect empty strings
              job[col.accessorKey] = row[col.header]?.trim() || "";
            }
          });

          if (!job.link) {
            return;
          }

          // 4. If valid, assign ID and add to results
          // We can call this to ensure the URL is processed, even if we don't use the ID directly here
          if (!job.id) job.id = crypto.randomUUID();
          if (!job.jobId) job.jobId = extractJobId(job.link);

          // 3. REQUIREMENT: If URL exists in current state OR in this import batch, skip
          const existsInStoredData = existingData.some(
            (data) => data.jobId === job.jobId,
          );
          const existsInCurrentBatch = tempBatch.some(
            (data) => data.jobId === job.jobId,
          );

          if (existsInStoredData || existsInCurrentBatch) {
            return;
          }

          const validJob = job as JobApplication;
          validatedList.push(validJob);
          tempBatch.push(validJob);
        });

        // 5. Merge validated new items with existing data and sort
        const combinedData = [...validatedList, ...existingData];
        const sortedData = sortJobsByDate(combinedData);

        resolve(sortedData);
      },
      error: (error) => {
        console.error("CSV Parsing Error:", error);
        resolve(existingData); // Return existing data if parse fails
      },
    });
  });
};
