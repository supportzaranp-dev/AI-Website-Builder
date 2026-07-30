import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-h-screen">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="text-lg font-bold text-brand-700">⚡ AI Website Builder</div>
        <div className="flex items-center gap-3">
          {session ? (
            <Link href="/dashboard" className="btn-primary">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Login
              </Link>
              <Link href="/register" className="btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="text-4xl font-extrabold leading-tight text-slate-900 sm:text-6xl">
          Chatbot se koi bhi{" "}
          <span className="text-brand-600">website</span> banao
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          Bas topic batao — AI khud se soch kar poori responsive website (HTML,
          CSS, JS) bana kar dega. Live preview, edit, versions aur download — sab
          ek powerful admin panel me.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href={session ? "/dashboard" : "/register"} className="btn-primary px-6 py-3 text-base">
            🚀 Abhi shuru karo
          </Link>
          <Link href="/login" className="btn-ghost px-6 py-3 text-base">
            Login
          </Link>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-3 text-left">
          {[
            ["🤖 AI Chatbot", "Requirement batao, iterative edits karo — 'dark theme add karo' bolo."],
            ["👀 Live Preview", "Desktop/mobile me turant preview, code view aur download."],
            ["🕑 Version History", "Har change ki version save, purani par wapas jao."],
          ].map(([t, d]) => (
            <div key={t} className="card p-5">
              <div className="text-base font-semibold">{t}</div>
              <p className="mt-2 text-sm text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
