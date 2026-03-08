export interface Workspace {
  slug: string;
  name: string;
  title: string;
  description: string;
  createdAt: string;
}

export type ClientMessage = {
  title?: string;
  description?: string;
};

export type ServerMessage =
  | { type: "init"; workspace: Workspace }
  | { type: "workspaceUpdated"; title?: string; description?: string };
