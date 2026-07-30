# ⚡ AI Website Builder — Admin Panel

Ek powerful admin panel jisme **AI chatbot** hai. Chatbot ko koi bhi topic batao,
woh khud se soch kar poori **live website (HTML/CSS/JS)** bana kar deta hai —
live preview, code view, version history aur download ke saath. Multi-user login
aur ek full **admin panel** bhi hai.

## Features
- 🤖 **AI Chatbot builder** — prompt do, website ban jaati hai. Iterative edit: "isme dark theme add karo".
- 👀 **Live preview** — desktop/mobile toggle (iframe sandbox).
- 💻 **Code view** — HTML / CSS / JS tabs.
- 🕑 **Version history** — har change ki version save, purani par wapas jao.
- ⬇️ **Download** — standalone `.html` file.
- 👥 **Multi-user** — register/login, har user ke apne projects (isolated).
- 🛡️ **Admin panel** — users manage (ban/delete/role), stats, aur AI model select.

## Tech Stack
Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma + SQLite ·
NextAuth v5 (credentials) · OpenRouter (free AI models).

## Setup

1. **Dependencies install karo** (ho chuka hai):
   ```bash
   npm install
   ```

2. **OpenRouter free API key lo** — https://openrouter.ai/keys par free signup.
   `.env` file me daalo:
   ```
   OPENROUTER_API_KEY="sk-or-v1-..."
   ```
   (Baaki `.env` values pehle se set hain. `AUTH_SECRET` production me change karna.)

3. **Database** (ho chuki hai — `prisma/dev.db`):
   ```bash
   npm run db:push
   ```

4. **App chalao:**
   ```bash
   npm run dev
   ```
   Kholo: http://localhost:3000

## Use kaise karein
1. `/register` par account banao. **Sabse pehla account automatically ADMIN** banta hai.
2. Dashboard → **+ New Website** → chatbot ko idea batao (jaise
   "coffee shop website with menu and contact form").
3. Preview dekho, "dark theme add karo" bol kar edit karo, download karo.
4. Admin: header me **Admin** link → users, stats, AI model settings.

## Useful commands
| Command | Kaam |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run db:studio` | Database GUI (Prisma Studio) |
| `npm run db:push` | Schema DB me apply |

## Notes
- Free models rate-limited hote hain — limit aane par admin panel se doosra
  free model select kar lo.
- API key na hone par app chalega, bas generate karte waqt clean error dikhega.
