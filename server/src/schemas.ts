import fs from "node:fs";
import path from "node:path";
import { parse } from "jsonc-parser";

type EntitySchema = {
  name: string;
  rls?: Record<string, unknown>;
};

export type SchemaMap = Map<string, EntitySchema>;

export const loadEntitySchemas = (entitiesDir: string): SchemaMap => {
  const schemas: SchemaMap = new Map();
  if (!fs.existsSync(entitiesDir)) return schemas;

  const files = fs.readdirSync(entitiesDir).filter((f) => f.endsWith(".jsonc"));
  for (const file of files) {
    const fullPath = path.join(entitiesDir, file);
    const raw = fs.readFileSync(fullPath, "utf8");
    const parsed = parse(raw) as EntitySchema;
    if (parsed?.name && typeof parsed.name === "string") {
      schemas.set(parsed.name, parsed);
    }
  }
  return schemas;
};

