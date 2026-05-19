import { Database } from "bun:sqlite";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";

type SqlBindings =
  | null
  | undefined
  | string
  | number
  | boolean
  | bigint
  | Uint8Array
  | Array<string | number | boolean | bigint | Uint8Array | null>
  | Record<string, string | number | boolean | bigint | Uint8Array | null>;

const paramsSchema = z
  .union([z.array(z.unknown()), z.record(z.string(), z.unknown())])
  .optional();

function parseDatabasePath(argv: string[]): string {
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if ((current === "--db" || current === "-d") && argv[index + 1]) {
      return argv[index + 1];
    }

    if (current.startsWith("--db=")) {
      return current.slice("--db=".length);
    }
  }

  return "./database.sqlite";
}

function normalizeValue(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Uint8Array) {
    return {
      type: "Uint8Array",
      data: Array.from(value)
    };
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        normalizeValue(nestedValue)
      ])
    );
  }

  return value;
}

function bindStatement(
  statement: ReturnType<Database["prepare"]>,
  params?: SqlBindings
) {
  if (params === undefined || params === null) {
    return statement;
  }

  return {
    all: () =>
      Array.isArray(params) ? statement.all(...params) : statement.all(params),
    run: () =>
      Array.isArray(params) ? statement.run(...params) : statement.run(params)
  };
}

function executeSql(database: Database, sql: string, params?: SqlBindings) {
  const statement = database.prepare(sql);
  const boundStatement = bindStatement(statement, params);
  const normalizedSql = sql.trim();
  const returnsRows =
    /^(select|pragma|with|explain|values)\b/i.test(normalizedSql) ||
    /\breturning\b/i.test(normalizedSql);

  if (returnsRows) {
    const rows = normalizeValue(boundStatement.all());
    statement.finalize();

    return {
      mode: "rows",
      rows,
      rowCount: Array.isArray(rows) ? rows.length : 0
    };
  }

  const result = normalizeValue(boundStatement.run()) as {
    changes: number;
    lastInsertRowid: number | string;
  };
  statement.finalize();

  return {
    mode: "run",
    ...result
  };
}

async function main() {
  const databasePath = parseDatabasePath(process.argv.slice(2));
  const database = new Database(databasePath, {
    create: true,
    safeIntegers: true,
    strict: true
  });

  const server = new McpServer({
    name: "sqlite-open-server",
    version: "0.1.0"
  });

  server.registerTool(
    "execute_sql",
    {
      description:
        "Execute any SQLite statement against the configured database file.",
      inputSchema: {
        sql: z.string().min(1),
        params: paramsSchema
      }
    },
    async ({ sql, params }) => {
      const result = executeSql(database, sql, params as SqlBindings);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                databasePath,
                ...result
              },
              null,
              2
            )
          }
        ]
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Failed to start MCP SQLite server:", error);
  process.exit(1);
});
