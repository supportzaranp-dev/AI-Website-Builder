"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Project = {
  id: string;
  title: string;
  prompt: string;
  updatedAt: string;
};

export default function ProjectsList({ initial }: { initial: Project[] }) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(initial);
  const [creating, setCreating] = useState(false);

  async function newProject() {
    setCreating(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled Website" }),
    });
    const data = await res.json();
    setCreating(false);
    if (data.project?.id) router.push(`/dashboard/project/${data.project.id}`);
  }

  async function remove(id: string) {
    if (!confirm("Yeh project delete karna hai?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setProjects((p) => p.filter((x) => x.id !== id));
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Websites</h1>
          <p className="text-sm text-slate-500">
            AI chatbot se nayi website banao ya purani edit karo.
          </p>
        </div>
        <button className="btn-primary" onClick={newProject} disabled={creating}>
          {creating ? "Ban raha hai..." : "+ New Website"}
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="text-4xl">🪄</div>
          <p className="text-slate-600">Abhi koi website nahi hai.</p>
          <button className="btn-primary" onClick={newProject} disabled={creating}>
            Pehli website banao
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div key={p.id} className="card flex flex-col p-5">
              <Link href={`/dashboard/project/${p.id}`} className="flex-1">
                <div className="text-lg font-semibold">{p.title}</div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                  {p.prompt || "Abhi generate nahi hui."}
                </p>
              </Link>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {new Date(p.updatedAt).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/project/${p.id}`}
                    className="text-sm font-medium text-brand-600"
                  >
                    Open
                  </Link>
                  <button
                    onClick={() => remove(p.id)}
                    className="text-sm font-medium text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
