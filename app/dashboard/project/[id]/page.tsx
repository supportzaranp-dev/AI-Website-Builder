import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Workspace from "@/components/Workspace";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      versions: { orderBy: { createdAt: "desc" } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!project || project.userId !== session!.user.id) notFound();

  const data = {
    id: project.id,
    title: project.title,
    messages: project.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
    })),
    versions: project.versions.map((v) => ({
      id: v.id,
      title: v.title,
      html: v.html,
      css: v.css,
      js: v.js,
      notes: v.notes,
      createdAt: v.createdAt.toISOString(),
    })),
  };

  return <Workspace project={data} />;
}
