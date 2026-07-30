"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { buildDocument } from "@/lib/site";

type Message = { id: string; role: string; content: string };
type Version = {
  id: string;
  title: string;
  html: string;
  css: string;
  js: string;
  notes: string;
  createdAt: string;
};
type ProjectData = {
  id: string;
  title: string;
  messages: Message[];
  versions: Version[];
};

const SUGGESTIONS = [
  "Ek modern coffee shop ki website banao menu, gallery aur contact form ke saath",
  "Mera personal portfolio website banao projects aur skills section ke saath",
  "Ek gym ki landing page banao pricing plans aur animations ke saath",
];

export default function Workspace({ project }: { project: ProjectData }) {
  const [messages, setMessages] = useState<Message[]>(project.messages);
  const [versions, setVersions] = useState<Version[]>(project.versions);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(
    project.versions[0]?.id ?? null
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"preview" | "code" | "versions">("preview");
  const [codeTab, setCodeTab] = useState<"html" | "css" | "js">("html");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [title, setTitle] = useState(project.title);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeVersion = useMemo(
    () => versions.find((v) => v.id === activeVersionId) ?? null,
    [versions, activeVersionId]
  );

  const doc = useMemo(
    () => (activeVersion ? buildDocument(activeVersion) : ""),
    [activeVersion]
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(prompt: string) {
    const text = prompt.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);
    setMessages((m) => [
      ...m,
      { id: "temp-" + Date.now(), role: "user", content: text },
    ]);

    try {
      const res = await fetch(`/api/projects/${project.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((m) => [
          ...m,
          {
            id: "err-" + Date.now(),
            role: "assistant",
            content: `⚠️ ${data.error || "Generate fail ho gaya."}`,
          },
        ]);
      } else {
        const v: Version = data.version;
        setVersions((prev) => [v, ...prev]);
        setActiveVersionId(v.id);
        setTab("preview");
        setMessages((m) => [
          ...m,
          {
            id: "a-" + Date.now(),
            role: "assistant",
            content: v.notes || "Website ban gayi! Preview me dekhein. ✅",
          },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: "⚠️ Network error. Dobara try karein.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!activeVersion) return;
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "website").replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveTitle() {
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  }

  return (
    <div className="grid h-[calc(100vh-9rem)] grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
      {/* Chat panel */}
      <div className="card flex min-h-0 flex-col">
        <div className="flex items-center gap-2 border-b border-slate-200 p-3">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600">
            ←
          </Link>
          <input
            className="input flex-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
          />
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                👋 Neeche apni website ka idea likho, ya koi example chuno:
              </p>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="block w-full rounded-lg border border-slate-200 p-3 text-left text-sm hover:bg-slate-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "ml-auto bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="max-w-[90%] rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500">
              🤖 Website bana raha hoon... (thoda time lag sakta hai)
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-slate-200 p-3"
        >
          <div className="flex gap-2">
            <textarea
              className="input resize-none"
              rows={2}
              placeholder={
                versions.length
                  ? "Change batao: 'dark theme add karo'..."
                  : "Apni website ka idea likho..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              disabled={loading}
            />
            <button className="btn-primary" disabled={loading || !input.trim()}>
              ➤
            </button>
          </div>
        </form>
      </div>

      {/* Right: preview / code / versions */}
      <div className="card flex min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 p-2">
          <div className="flex gap-1">
            {(["preview", "code", "versions"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${
                  tab === t
                    ? "bg-brand-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t === "versions" ? `Versions (${versions.length})` : t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {tab === "preview" && (
              <div className="flex gap-1">
                <button
                  onClick={() => setDevice("desktop")}
                  className={`rounded px-2 py-1 text-xs ${
                    device === "desktop" ? "bg-slate-200" : ""
                  }`}
                >
                  🖥️ Desktop
                </button>
                <button
                  onClick={() => setDevice("mobile")}
                  className={`rounded px-2 py-1 text-xs ${
                    device === "mobile" ? "bg-slate-200" : ""
                  }`}
                >
                  📱 Mobile
                </button>
              </div>
            )}
            <button
              onClick={download}
              className="btn-ghost py-1.5"
              disabled={!activeVersion}
            >
              ⬇ Download
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-slate-100">
          {!activeVersion ? (
            <div className="flex h-full items-center justify-center text-center text-slate-400">
              <div>
                <div className="text-4xl">🪄</div>
                <p className="mt-2">
                  Abhi koi website generate nahi hui.
                  <br />
                  Left me chat karke banao.
                </p>
              </div>
            </div>
          ) : tab === "preview" ? (
            <div className="flex h-full justify-center p-4">
              <iframe
                title="preview"
                sandbox="allow-scripts allow-forms allow-popups allow-modals"
                srcDoc={doc}
                className={`h-full rounded-lg border border-slate-300 bg-white shadow ${
                  device === "mobile" ? "w-[390px]" : "w-full"
                }`}
              />
            </div>
          ) : tab === "code" ? (
            <div className="flex h-full flex-col">
              <div className="flex gap-1 bg-slate-800 p-2">
                {(["html", "css", "js"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCodeTab(c)}
                    className={`rounded px-3 py-1 text-xs font-mono uppercase ${
                      codeTab === c
                        ? "bg-slate-600 text-white"
                        : "text-slate-400"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <pre className="flex-1 overflow-auto bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
                <code>{activeVersion[codeTab] || "// (khaali)"}</code>
              </pre>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {versions.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setActiveVersionId(v.id);
                    setTab("preview");
                  }}
                  className={`block w-full rounded-lg border p-3 text-left text-sm ${
                    v.id === activeVersionId
                      ? "border-brand-500 bg-brand-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      v{versions.length - i} — {v.title}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(v.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {v.notes && (
                    <p className="mt-1 text-xs text-slate-500">{v.notes}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
