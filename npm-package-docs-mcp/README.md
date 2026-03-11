# npm-package-docs-mcp

`npm-package-docs-mcp` is a small Model Context Protocol (MCP) server that returns up-to-date README documentation for npm packages.

It is designed for IDEs and MCP-compatible clients that want fast package docs lookup without sending users to npm or GitHub manually.

## What it does

The server exposes one MCP tool:

- `get_docs_for_npm_package`

Input:

- `packageName`: the npm package name, for example `react`, `next`, or `zod`

Output:

- the package README as plain text MCP content

## How it fetches docs

For a requested package, the server:

1. Fetches package metadata from the npm registry
2. Looks for a GitHub repository URL in that metadata
3. Tries to load `README.md` from the repository's `main` branch
4. Falls back to the `master` branch
5. Falls back again to the `readme` field bundled in the npm registry metadata

This keeps results current while still working for packages that do not expose a standard GitHub README layout.

## Requirements

- Node.js `>=18`
- Network access to:
  - `https://registry.npmjs.org`
  - `https://raw.githubusercontent.com`

## Install

Install globally:

```bash
npm install -g npm-package-docs-mcp
```

Or run it without a global install:

```bash
npx -y npm-package-docs-mcp
```

## Use with an MCP client

This server runs over stdio, so most MCP clients can launch it directly.

Example client config:

```json
{
  "mcpServers": {
    "npm-package-docs": {
      "command": "npx",
      "args": ["-y", "npm-package-docs-mcp"]
    }
  }
}
```

If you install it globally, you can use the binary directly:

```json
{
  "mcpServers": {
    "npm-package-docs": {
      "command": "npm-package-docs-mcp"
    }
  }
}
```

## Tool reference

### `get_docs_for_npm_package`

Fetches documentation for a single npm package.

Example request:

```json
{
  "packageName": "react"
}
```

Typical use cases:

- look up install and setup instructions
- inspect README examples inside an IDE
- pull docs for package APIs during coding sessions
- reduce context switching between editor, npm, and GitHub

## Local development

Install dependencies:

```bash
npm install
```

Run in development:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Run the built server:

```bash
npm start
```

## Scripts

- `npm run build`: compile TypeScript to `dist/`
- `npm run dev`: run from `src/index.ts` with `ts-node`
- `npm run watch`: run in watch mode with `nodemon`
- `npm start`: run the compiled server from `dist/index.js`
- `npm run mcp`: alias for the compiled MCP server entrypoint
- `npm run mcp:dev`: alias for the TypeScript MCP server entrypoint

## Project structure

```text
src/index.ts      MCP server and tool registration
dist/index.js     compiled server output
package.json      package metadata and scripts
```

## Limitations

- The server currently returns README text only.
- It only attempts GitHub README discovery for repositories it can normalize to a standard GitHub URL.
- It checks `main` and `master` branches only.
- It does not currently cache responses.

## License

MIT
