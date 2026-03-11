#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";

type NpmRepository = string | { type?: string; url?: string };

interface NpmRegistryPackage {
  readme?: string;
  repository?: NpmRepository;
}

const server = new McpServer({
  name: "npm-package-docs-mcp",
  description: "A Model Context Protocol (MCP) server for npm package documentation.",
  version: "1.0.1",
});

function getRepositoryUrl(repository: NpmRepository | undefined): string | undefined {
  if (typeof repository === "string") {
    return repository;
  }

  return repository?.url;
}

function getGitHubRepoPath(repository: NpmRepository | undefined): string | undefined {
  const repositoryUrl = getRepositoryUrl(repository);
  if (!repositoryUrl) {
    return undefined;
  }

  const normalizedUrl = repositoryUrl
    .replace(/^git\+/, "")
    .replace(/^git:\/\//, "https://")
    .replace(/^github:/, "https://github.com/")
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/^ssh:\/\/git@github\.com\//, "https://github.com/")
    .replace(/\.git$/, "")
    .trim();

  const match = normalizedUrl.match(/^https?:\/\/github\.com\/([^/]+\/[^/]+?)(?:\/)?$/i);
  return match?.[1];
}

async function fetchGitHubReadme(repoPath: string): Promise<string | undefined> {
  const candidateBranches = ["main", "master"];

  for (const branch of candidateBranches) {
    const readmeUrl = `https://raw.githubusercontent.com/${repoPath}/refs/heads/${branch}/README.md`;
    const response = await fetch(readmeUrl);

    if (response.ok) {
      return response.text();
    }
  }

  return undefined;
}

server.registerTool(
  "get_docs_for_npm_package",
  {
    title: "Get Documentation for npm Package",
    description: "Fetches the documentation for a given npm package.",
    inputSchema: {
      packageName: z.string().describe("The name of the npm package to fetch documentation for."),
    },
  },
  async ({ packageName }: { packageName: string }) => {
    const registryResponse = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(packageName)}`,
    );

    if (!registryResponse.ok) {
      throw new Error(
        `Failed to fetch package information for ${packageName}: ${registryResponse.statusText}`,
      );
    }

    const packageInfo = (await registryResponse.json()) as NpmRegistryPackage;
    const githubRepoPath = getGitHubRepoPath(packageInfo.repository);
    const readmeContent =
      (githubRepoPath ? await fetchGitHubReadme(githubRepoPath) : undefined) ??
      packageInfo.readme;

    if (!readmeContent) {
      throw new Error(`No documentation found for npm package: ${packageName}`);
    }

    return {
      content: [
        {
          type: "text" as const,
          text: readmeContent,
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("npm-package-docs-mcp is running on stdio");
}

main().catch((error: unknown) => {
  console.error("Server error:", error);
  process.exit(1);
});
