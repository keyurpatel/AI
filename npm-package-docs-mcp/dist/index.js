#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const z = __importStar(require("zod/v4"));
const server = new mcp_js_1.McpServer({
    name: "npm-package-docs-mcp",
    description: "A Model Context Protocol (MCP) server for npm package documentation.",
    version: "1.0.1",
});
function getRepositoryUrl(repository) {
    if (typeof repository === "string") {
        return repository;
    }
    return repository?.url;
}
function getGitHubRepoPath(repository) {
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
async function fetchGitHubReadme(repoPath) {
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
server.registerTool("get_docs_for_npm_package", {
    title: "Get Documentation for npm Package",
    description: "Fetches the documentation for a given npm package.",
    inputSchema: {
        packageName: z.string().describe("The name of the npm package to fetch documentation for."),
    },
}, async ({ packageName }) => {
    const registryResponse = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`);
    if (!registryResponse.ok) {
        throw new Error(`Failed to fetch package information for ${packageName}: ${registryResponse.statusText}`);
    }
    const packageInfo = (await registryResponse.json());
    const githubRepoPath = getGitHubRepoPath(packageInfo.repository);
    const readmeContent = (githubRepoPath ? await fetchGitHubReadme(githubRepoPath) : undefined) ??
        packageInfo.readme;
    if (!readmeContent) {
        throw new Error(`No documentation found for npm package: ${packageName}`);
    }
    return {
        content: [
            {
                type: "text",
                text: readmeContent,
            },
        ],
    };
});
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("npm-package-docs-mcp is running on stdio");
}
main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map