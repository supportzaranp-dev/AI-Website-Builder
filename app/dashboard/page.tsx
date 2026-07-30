import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ProjectsList from "@/components/ProjectsList";

export default async function DashboardPage() {
  const session = await auth();
  const projects = await prisma.project.findMany({
    where: { userId: session!.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, prompt: true, updatedAt: true },
  });

  const initial = projects.map((p) => ({
    ...p,
    updatedAt: p.updatedAt.toISOString(),
  }));

  return <ProjectsList initial={initial} />;
}
