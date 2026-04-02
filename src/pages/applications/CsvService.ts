import Papa from "papaparse";
import type { JobApplication } from "../../types/job";
import { sortJobsByDate, isExistJobByUrl } from "../../utils/jobUtils";

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

        // We use this to track duplicates inside the CSV file itself
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

          // 2. REQUIREMENT: If company, link (url), or jobTitle are empty, skip
          // if (!job.company || !job.link || !job.jobTitle) {
          if (!job.link) {
            return;
          }

          // 3. REQUIREMENT: If URL exists in current state OR in this import batch, skip
          const existsInStoredData = isExistJobByUrl(job.link, existingData);
          const existsInCurrentBatch = isExistJobByUrl(job.link, tempBatch);

          if (existsInStoredData || existsInCurrentBatch) {
            return;
          }

          // 4. If valid, assign ID and add to results
          if (!job.id) job.id = crypto.randomUUID();

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
