import bcrypt from "bcryptjs";
import { env } from "./env.js";
import { prisma } from "./prisma.js";

const seedAdmin = async () => {
  const email = env.SEED_ADMIN_EMAIL;
  const password = env.SEED_ADMIN_PASSWORD;
  if (!email || !password) return;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      fullName: env.SEED_ADMIN_NAME ?? "Admin",
      passwordHash,
      role: "admin"
    }
  });
};

await seedAdmin();
await prisma.$disconnect();

