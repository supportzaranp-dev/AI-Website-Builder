"use client";

import { useState } from "react";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  banned: boolean;
  createdAt: string;
  projectCount: number;
};

const FREE_MODELS = [
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "openai/gpt-oss-20b:free",
  "nvidia/nemotron-nano-9b-v2:free",
  "inclusionai/ling-3.0-flash:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
];

export default function AdminPanel({
  stats,
  users: initialUsers,
  currentModel,
  meId,
}: {
  stats: { users: number; projects: number; generated: number };
  users: UserRow[];
  currentModel: string;
  meId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [model, setModel] = useState(currentModel);
  const [savedMsg, setSavedMsg] = useState("");

  async function updateUser(id: string, patch: Partial<UserRow>) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      setUsers((us) => us.map((u) => (u.id === id ? { ...u, ...patch } : u)));
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("Yeh user aur uske saare projects delete ho jayenge. Sure?"))
      return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) setUsers((us) => us.filter((u) => u.id !== id));
    else {
      const d = await res.json();
      alert(d.error || "Delete fail");
    }
  }

  async function saveModel() {
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model }),
    });
    if (res.ok) {
      setSavedMsg("Model save ho gaya ✅");
      setTimeout(() => setSavedMsg(""), 2500);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-sm text-slate-500">
          Users, stats aur AI model settings control karo.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["👥 Total Users", stats.users],
          ["📁 Total Projects", stats.projects],
          ["🌐 Websites Generated", stats.generated],
        ].map(([label, value]) => (
          <div key={label as string} className="card p-5">
            <div className="text-sm text-slate-500">{label}</div>
            <div className="mt-1 text-3xl font-bold text-brand-700">{value}</div>
          </div>
        ))}
      </div>

      {/* Model settings */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold">AI Model (OpenRouter)</h2>
        <p className="mt-1 text-sm text-slate-500">
          Website generate karne ke liye default free model chuno.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            className="input max-w-md"
            value={FREE_MODELS.includes(model) ? model : "custom"}
            onChange={(e) => {
              if (e.target.value !== "custom") setModel(e.target.value);
            }}
          >
            {FREE_MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            <option value="custom">Custom (neeche type karo)</option>
          </select>
          <input
            className="input max-w-md"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="model id"
          />
          <button className="btn-primary" onClick={saveModel}>
            Save Model
          </button>
          {savedMsg && <span className="text-sm text-green-600">{savedMsg}</span>}
        </div>
      </div>

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold">Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="p-3">Email</th>
                <th className="p-3">Naam</th>
                <th className="p-3">Role</th>
                <th className="p-3">Projects</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.name || "-"}</td>
                  <td className="p-3">
                    <select
                      className="rounded border border-slate-200 px-2 py-1 text-xs"
                      value={u.role}
                      disabled={u.id === meId}
                      onChange={(e) => updateUser(u.id, { role: e.target.value })}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="p-3">{u.projectCount}</td>
                  <td className="p-3">
                    {u.banned ? (
                      <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                        Banned
                      </span>
                    ) : (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {u.id === meId ? (
                      <span className="text-xs text-slate-400">(You)</span>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          className="text-xs font-medium text-amber-600"
                          onClick={() =>
                            updateUser(u.id, { banned: !u.banned })
                          }
                        >
                          {u.banned ? "Unban" : "Ban"}
                        </button>
                        <button
                          className="text-xs font-medium text-red-500"
                          onClick={() => deleteUser(u.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
