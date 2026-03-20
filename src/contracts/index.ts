export type ISODateString = string;

export interface ApiEnvelope<TData> {
  data: TData;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
}

// TODO: Add shared DTO contracts for web + mobile clients in later phases.
