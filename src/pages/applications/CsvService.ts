import Papa from "papaparse";
import dayjs from "dayjs";
import type { JobApplication } from "../../types/job";
import {
  sortJobsByDate,
  extractJobId,
  normalizeDate,
} from "../../utils/jobUtils";

interface CsvServiceProps {
  data: JobApplication[];
  columns: any[];
}

export const exportCSV = ({ data, columns }: CsvServiceProps) => {
  const csvData = data.map((job) => {
    const row: Record<string, any> = {};

    columns.forEach((col) => {
      if (!col.accessorKey) return;

      let value = job[col.accessorKey as keyof JobApplication] || "";

      // Format date for user readability in Excel/Sheets
      if (col.accessorKey === "date" && value) {
        value = dayjs(value).format("DD-MM-YYYY");
      }

      row[col.header] = value;
    });
    return row;
  });

  const csv = Papa.unparse(csvData);
  const fileDate = dayjs().format("DD-MM-YYYY");

  // \uFEFF is the Byte Order Mark (BOM) to force Excel to show UTF-8 characters correctly
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `jobs_export_${fileDate}.csv`);
  document.body.appendChild(link); // Required for some browsers
  link.click();
  document.body.removeChild(link);
};

export const importCSV = (
  e: React.ChangeEvent<HTMLInputElement>,
  existingData: JobApplication[],
  columns: any[],
): Promise<JobApplication[]> => {
  const file = e.target.files?.[0];
  if (!file) return Promise.resolve(existingData);

  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const newlyAdded: JobApplication[] = [];

        results.data.forEach((row: any) => {
          const job: any = {};

          // 1. Map CSV Headers back to Object Keys
          columns.forEach((col) => {
            if (!col.accessorKey) return;

            let value = row[col.header]?.trim() || "";
            if (col.accessorKey === "date") value = normalizeDate(value);

            job[col.accessorKey] = value;
          });

          // 2. Validation: Must have a link
          if (!job.link) return;

          // 3. Metadata Generation
          if (!job.id) job.id = crypto.randomUUID();
          if (!job.jobId) job.jobId = extractJobId(job.link);

          // 4. Duplicate Check (Stored vs Current Batch)
          const isDuplicate =
            existingData.some((d) => d.jobId === job.jobId) ||
            newlyAdded.some((d) => d.jobId === job.jobId);

          if (!isDuplicate) {
            newlyAdded.push(job as JobApplication);
          }
        });

        // 5. Final Merge & Sort
        const sortedData = sortJobsByDate([...newlyAdded, ...existingData]);
        resolve(sortedData);
      },
      error: (err) => {
        console.error("CSV Import Error:", err);
        resolve(existingData);
      },
    });
  });
};
