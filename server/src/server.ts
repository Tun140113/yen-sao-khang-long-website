import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { pipeline } from "node:stream/promises";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./prisma.js";
import { env } from "./env.js";
import { isAllowed, needsAuth, type AuthUser } from "./rls.js";
import { loadEntitySchemas } from "./schemas.js";

const entitiesDir = path.resolve(process.cwd(), "..", "base44", "entities");
const schemaMap = loadEntitySchemas(entitiesDir);

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",").map((s) => s.trim()) : true,
  credentials: true
});

await app.register(jwt, {
  secret: env.JWT_SECRET
});

await app.register(multipart, {
  limits: { fileSize: 25 * 1024 * 1024 }
});

const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);
await app.register(fastifyStatic, {
  root: uploadRoot,
  prefix: "/uploads/"
});

app.decorateRequest("user", null);

app.addHook("preHandler", async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return;
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  if (!token) return;
  try {
    const payload = await req.jwtVerify<{ email: string; role: string; fullName?: string | null }>();
    (req as any).user = payload;
  } catch {
    // ignore invalid token; routes can enforce auth explicitly
  }
});

app.get("/api/health", async () => ({ ok: true }));

const registerBody = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1).optional()
});

app.post("/api/auth/register", async (req, reply) => {
  const body = registerBody.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) return reply.code(409).send({ message: "Email already registered" });

  const passwordHash = await bcrypt.hash(body.password, 10);
  const user = await prisma.user.create({
    data: { email: body.email, fullName: body.full_name ?? null, passwordHash, role: "user" }
  });

  const token = app.jwt.sign({ email: user.email, role: user.role, fullName: user.fullName });
  return { token, user: { email: user.email, role: user.role, full_name: user.fullName } };
});

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

app.post("/api/auth/login", async (req, reply) => {
  const body = loginBody.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user) return reply.code(401).send({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(body.password, user.passwordHash);
  if (!ok) return reply.code(401).send({ message: "Invalid credentials" });

  const token = app.jwt.sign({ email: user.email, role: user.role, fullName: user.fullName });
  return { token, user: { email: user.email, role: user.role, full_name: user.fullName } };
});

app.get("/api/auth/me", async (req, reply) => {
  const user = (req as any).user as AuthUser | null;
  if (!user) return reply.code(401).send({ message: "Unauthorized" });
  return { email: user.email, role: user.role, full_name: (user as any).fullName ?? null };
});

app.post("/api/auth/logout", async () => ({ ok: true }));

const shapeRecord = (record: { id: string; data: any; createdBy: string | null; createdDate: Date; updatedDate: Date }) => ({
  id: record.id,
  created_by: record.createdBy ?? null,
  created_date: record.createdDate.toISOString(),
  updated_date: record.updatedDate.toISOString(),
  ...(record.data ?? {})
});

const applyWhere = (row: any, where: Record<string, unknown> | undefined) => {
  if (!where) return true;
  for (const [k, v] of Object.entries(where)) {
    if (row?.[k] !== v) return false;
  }
  return true;
};

const sortRows = (rows: any[], orderBy?: string) => {
  if (!orderBy) return rows;
  const direction = orderBy.startsWith("-") ? -1 : 1;
  const key = orderBy.startsWith("-") ? orderBy.slice(1) : orderBy;
  return rows.sort((a, b) => {
    const av = a?.[key];
    const bv = b?.[key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * direction;
    const as = String(av);
    const bs = String(bv);
    return as.localeCompare(bs) * direction;
  });
};

const getRlsRule = (entityName: string, action: "create" | "read" | "update" | "delete") => {
  const schema = schemaMap.get(entityName);
  const rls = (schema as any)?.rls as any;
  return rls?.[action] as any;
};

const resolveEntityName = (raw: string) => {
  // allow both /Product and /product; normalize to schema name if known
  const direct = schemaMap.has(raw) ? raw : null;
  if (direct) return direct;
  const found = [...schemaMap.keys()].find((k) => k.toLowerCase() === raw.toLowerCase());
  return found ?? raw;
};

app.get("/api/entities/:entity", async (req, reply) => {
  const entity = resolveEntityName((req.params as any).entity);
  const orderBy = (req.query as any)?.orderBy as string | undefined;
  const limit = Number((req.query as any)?.limit ?? 0) || undefined;

  const rule = getRlsRule(entity, "read");
  const user = (req as any).user as AuthUser | null;
  if (needsAuth(rule) && !user) return reply.code(401).send({ message: "Unauthorized" });

  const records = await prisma.entityRecord.findMany({ where: { entity } });
  const shaped = records.map(shapeRecord).filter((r) => isAllowed("read", rule, user, r.created_by));
  const sorted = sortRows(shaped, orderBy);
  const sliced = typeof limit === "number" ? sorted.slice(0, limit) : sorted;
  return sliced;
});

const filterBody = z.object({
  where: z.record(z.any()).optional(),
  orderBy: z.string().optional(),
  limit: z.number().int().positive().optional()
});

app.post("/api/entities/:entity/filter", async (req, reply) => {
  const entity = resolveEntityName((req.params as any).entity);
  const body = filterBody.parse(req.body);

  const rule = getRlsRule(entity, "read");
  const user = (req as any).user as AuthUser | null;
  if (needsAuth(rule) && !user) return reply.code(401).send({ message: "Unauthorized" });

  const records = await prisma.entityRecord.findMany({ where: { entity } });
  const shaped = records
    .map(shapeRecord)
    .filter((r) => isAllowed("read", rule, user, r.created_by))
    .filter((r) => applyWhere(r, body.where));

  const sorted = sortRows(shaped, body.orderBy);
  const sliced = body.limit ? sorted.slice(0, body.limit) : sorted;
  return sliced;
});

app.post("/api/entities/:entity", async (req, reply) => {
  const entity = resolveEntityName((req.params as any).entity);
  const user = (req as any).user as AuthUser | null;
  const rule = getRlsRule(entity, "create");
  if (needsAuth(rule) && !user) return reply.code(401).send({ message: "Unauthorized" });
  if (!isAllowed("create", rule, user, user?.email ?? null)) return reply.code(403).send({ message: "Forbidden" });

  const data = (req.body ?? {}) as any;
  const record = await prisma.entityRecord.create({
    data: { entity, data, createdBy: user?.email ?? null }
  });
  return shapeRecord(record);
});

app.patch("/api/entities/:entity/:id", async (req, reply) => {
  const entity = resolveEntityName((req.params as any).entity);
  const id = (req.params as any).id as string;
  const user = (req as any).user as AuthUser | null;
  const rule = getRlsRule(entity, "update");
  if (needsAuth(rule) && !user) return reply.code(401).send({ message: "Unauthorized" });

  const existing = await prisma.entityRecord.findUnique({ where: { id } });
  if (!existing || existing.entity !== entity) return reply.code(404).send({ message: "Not found" });

  const existingShaped = shapeRecord(existing);
  if (!isAllowed("update", rule, user, existingShaped.created_by)) return reply.code(403).send({ message: "Forbidden" });

  const patch = (req.body ?? {}) as any;
  const nextData = { ...(existing.data as any), ...patch };
  const updated = await prisma.entityRecord.update({
    where: { id },
    data: { data: nextData, createdBy: existing.createdBy ?? null }
  });
  return shapeRecord(updated);
});

app.delete("/api/entities/:entity/:id", async (req, reply) => {
  const entity = resolveEntityName((req.params as any).entity);
  const id = (req.params as any).id as string;
  const user = (req as any).user as AuthUser | null;
  const rule = getRlsRule(entity, "delete");
  if (needsAuth(rule) && !user) return reply.code(401).send({ message: "Unauthorized" });

  const existing = await prisma.entityRecord.findUnique({ where: { id } });
  if (!existing || existing.entity !== entity) return reply.code(404).send({ message: "Not found" });

  const existingShaped = shapeRecord(existing);
  if (!isAllowed("delete", rule, user, existingShaped.created_by)) return reply.code(403).send({ message: "Forbidden" });

  await prisma.entityRecord.delete({ where: { id } });
  return { ok: true };
});

app.post("/api/integrations/upload-file", async (req, reply) => {
  const user = (req as any).user as AuthUser | null;
  if (!user) return reply.code(401).send({ message: "Unauthorized" });

  const file = await (req as any).file();
  if (!file) return reply.code(400).send({ message: "Missing file" });

  await fs.promises.mkdir(uploadRoot, { recursive: true });
  const safeName = (file.filename || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
  const outName = `${crypto.randomUUID()}-${safeName}`;
  const outPath = path.join(uploadRoot, outName);
  await pipeline(file.file, fs.createWriteStream(outPath));

  return { url: `/uploads/${outName}` };
});

app.post("/api/integrations/:name", async (_req, reply) => {
  return reply.code(501).send({ message: "Not implemented in self-host mode" });
});

export { app };
