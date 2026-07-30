import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import AdminPanel from "@/components/AdminPanel";

export default async function AdminPage() {
  const session = await auth();

  const [users, projectCount, versionCount, modelSetting] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        banned: true,
        createdAt: true,
        _count: { select: { projects: true } },
      },
    }),
    prisma.project.count(),
    prisma.websiteVersion.count(),
    prisma.setting.findUnique({ where: { key: "model" } }),
  ]);

  const stats = {
    users: users.length,
    projects: projectCount,
    generated: versionCount,
  };

  const currentModel =
    modelSetting?.value ||
    process.env.OPENROUTER_MODEL ||
    "meta-llama/llama-3.3-70b-instruct:free";

  const usersData = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    banned: u.banned,
    createdAt: u.createdAt.toISOString(),
    projectCount: u._count.projects,
  }));

  return (
    <AdminPanel
      stats={stats}
      users={usersData}
      currentModel={currentModel}
      meId={session!.user.id}
    />
  );
}
