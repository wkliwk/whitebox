import { Octokit } from "octokit";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export interface BoardItem {
  id: string;
  number: number | null;  // null for draft items
  title: string;
  url: string;            // empty for drafts
  repo: string;
  status: string;
  priority: string;
  agent: string;
  size: string;
  isDraft: boolean;
}

export interface ProjectBoard {
  number: number;
  title: string;
  url: string;
  items: BoardItem[];
}

const GQL_QUERY = `
  query($login: String!, $number: Int!) {
    user(login: $login) {
      projectV2(number: $number) {
        title
        url
        items(first: 100) {
          nodes {
            id
            type
            fieldValues(first: 12) {
              nodes {
                ... on ProjectV2ItemFieldTextValue {
                  text
                  field { ... on ProjectV2FieldCommon { name } }
                }
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                  field { ... on ProjectV2FieldCommon { name } }
                }
              }
            }
            content {
              ... on Issue {
                number title url
                repository { name }
                labels(first: 8) { nodes { name } }
              }
              ... on DraftIssue {
                title
              }
            }
          }
        }
      }
    }
  }
`;

function extractField(
  nodes: { text?: string; name?: string; field?: { name?: string } }[],
  fieldName: string
): string {
  for (const n of nodes) {
    if (n.field?.name?.toLowerCase() === fieldName.toLowerCase()) {
      return (n.text ?? n.name ?? "").trim();
    }
  }
  return "";
}

export async function getProjectBoard(boardNumber: number): Promise<ProjectBoard | null> {
  if (!process.env.GITHUB_TOKEN) return null;
  try {
    const resp = await octokit.graphql<{
      user: {
        projectV2: {
          title: string;
          url: string;
          items: {
            nodes: {
              id: string;
              type: string;
              fieldValues: { nodes: { text?: string; name?: string; field?: { name?: string } }[] };
              content?: {
                number?: number;
                title?: string;
                url?: string;
                repository?: { name: string };
                labels?: { nodes: { name: string }[] };
              };
            }[];
          };
        };
      };
    }>(GQL_QUERY, { login: "wkliwk", number: boardNumber });

    const proj = resp.user.projectV2;
    const items: BoardItem[] = [];

    for (const node of proj.items.nodes) {
      const isDraft = node.type === "DRAFT_ISSUE";
      const fvNodes = node.fieldValues.nodes;

      // For issues, get labels for priority/agent/size; drafts have no labels
      const labelNames = node.content?.labels?.nodes.map(l => l.name) ?? [];

      const title = node.content?.title ?? extractField(fvNodes, "title") ?? "";
      if (!title) continue;

      const status = extractField(fvNodes, "status") || extractField(fvNodes, "stage") || "Todo";
      const priorityRaw = labelNames.find(l => l.startsWith("priority:"))?.replace("priority:", "") ?? "";
      const agent = labelNames.find(l => l.startsWith("agent:"))?.replace("agent:", "") ?? "";
      const size = labelNames.find(l => l.startsWith("size:"))?.replace("size:", "") ?? "";

      items.push({
        id: node.id,
        number: node.content?.number ?? null,
        title,
        url: node.content?.url ?? "",
        repo: node.content?.repository?.name ?? "",
        status,
        priority: priorityRaw,
        agent,
        size,
        isDraft,
      });
    }

    return {
      number: boardNumber,
      title: proj.title,
      url: proj.url,
      items,
    };
  } catch {
    return null;
  }
}

export const BOARD_DEFS = [
  { number: 8, label: "Whitebox",     color: "#8b5cf6" },
  { number: 3, label: "Ideas",        color: "#f97316" },
  { number: 1, label: "Money Flow",   color: "#ec4899" },
  { number: 6, label: "FormPilot",    color: "#22c55e" },
  { number: 7, label: "Health Credit",color: "#eab308" },
  { number: 2, label: "Company Ops",  color: "#3b82f6" },
];
