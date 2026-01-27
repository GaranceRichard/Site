export type Msg = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  consent: boolean;
  source: string;
  created_at: string;
};

export type SortField = "created_at" | "name" | "email" | "subject";
export type SortDir = "asc" | "desc";
export type BackofficeSection = "messages" | "stats" | "settings";

