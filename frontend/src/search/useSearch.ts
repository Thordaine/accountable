import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export type SearchMatch = {
  id: number;
  name: string;
  organization_name?: string | null;
};

/** The search answer: up to 5 of each kind, sorted by name. */
export type SearchResults = {
  organizations: SearchMatch[];
  contacts: SearchMatch[];
  deals: SearchMatch[];
};

/** Records whose names contain the trimmed text; no request while it's empty. */
export function useSearch(text: string) {
  const q = text.trim();
  return useQuery({
    queryKey: ["search", q],
    queryFn: () => api<SearchResults>(`/search?q=${encodeURIComponent(q)}`),
    enabled: q !== "",
    placeholderData: keepPreviousData,
  });
}
