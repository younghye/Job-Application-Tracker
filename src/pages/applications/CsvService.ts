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

export const exportCSV = ({
  data,
  columns,
}: CsvServiceProps): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      if (!data || data.length === 0) return reject("no-file");

      // 1. Prepare Data
      const csvData = data.map((job) => {
        const row: Record<string, any> = {};

        columns.forEach((col) => {
          if (!col.accessorKey) return;
          let value: any = job[col.accessorKey as keyof JobApplication] || "";

          if (col.accessorKey === "interviews") {
            value =
              Array.isArray(job.interviews) && job.interviews.length > 0
                ? JSON.stringify(job.interviews)
                : "";
          }

          row[col.header] = value;
        });
        return row;
      });

      // 2. Generate CSV String
      const csv = Papa.unparse(csvData);
      const fileDate = dayjs().format("YYYY-MM-DD");

      // 3. Create Download
      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `jobs_applications_export_${fileDate}.csv`);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      resolve();
    } catch (error) {
      console.error("CSV Export Error:", error);
      reject(error);
    }
  });
};

export const importCSV = (
  e: React.ChangeEvent<HTMLInputElement>,
  existingData: JobApplication[],
  columns: any[],
): Promise<{ data: JobApplication[]; count: number }> => {
  return new Promise((resolve, reject) => {
    const file = e.target.files?.[0];
    if (!file) return reject("no-file");

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

            if (col.accessorKey === "date") {
              value = normalizeDate(value);
            } else if (col.accessorKey === "interviews") {
              try {
                job[col.accessorKey] = value ? JSON.parse(value) : [];
              } catch {
                job[col.accessorKey] = [];
              }
              return;
            }

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
        resolve({ data: sortedData, count: newlyAdded.length });
      },
      error: (err) => {
        console.error("CSV Import Error:", err);
        reject(err);
      },
    });
  });
};
