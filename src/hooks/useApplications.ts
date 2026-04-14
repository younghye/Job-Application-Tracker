import { useState, useEffect } from "react";
import type { JobApplication } from "../types/job";
import { sortJobsByDate } from "../utils/jobUtils";

export const useApplications = () => {
  const [data, setData] = useState<JobApplication[]>([]);

  useEffect(() => {
    chrome.storage.local.get(
      "applicationList",
      (res: { applicationList?: JobApplication[] }) =>
        setData(sortJobsByDate(res.applicationList || [])),
    );

    const listener = (
      changes: { applicationList?: { newValue?: JobApplication[] } },
      area: string,
    ) => {
      if (area === "local" && changes.applicationList) {
        setData(sortJobsByDate(changes.applicationList.newValue || []));
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  return data;
};
