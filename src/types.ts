export type CaseStatus =
  | "new"
  | "reviewing"
  | "drafting"
  | "awaiting_reply"
  | "closed";

export type MailCase = {
  _id: string;
  title: string;
  status: CaseStatus;
  category: string;
  senderName: string;
  senderRole: string;
  subject: string;
  bodyText: string;
  linkedUrls: string[];
  assignedTo: string;
  riskFlags: string[];
  extracted?: {
    amounts: Array<{ label: string; value: string }>;
    deadlines: Array<{ label: string; date: string }>;
    actions: string[];
    summary: string;
    demo: boolean;
  };
  draft?: {
    to: string;
    subject: string;
    body: string;
    demo: boolean;
    updatedAt: number;
  };
  lastActivityAt: number;
};

export type Evidence = {
  _id: string;
  caseId: string;
  url: string;
  title: string;
  snippet: string;
  source: "firecrawl" | "demo";
  scrapedAt: number;
};

export type TimelineEvent = {
  _id: string;
  caseId: string;
  kind: string;
  title: string;
  detail?: string;
  createdAt: number;
};
