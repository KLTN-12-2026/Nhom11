import { useSearchParams } from "react-router-dom";
import { JobsBoard } from "@/features/jobs/components/JobsBoard";
import { parseJobQuery, serializeJobQuery, type JobFilters } from "@/features/jobs/job-filters";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export const JobsPage = () => {
  useDocumentTitle("Browse Remote Jobs");
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseJobQuery(searchParams);

  const handleFiltersChange = (next: JobFilters) => {
    setSearchParams(serializeJobQuery(next));
  };

  return <JobsBoard filters={filters} onFiltersChange={handleFiltersChange} />;
};
