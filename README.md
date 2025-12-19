# Workout Logger Web App

A Next.js workout logger using Shadcn UI, Tailwind, and TypeScript. Connects to a robust FastAPI backend.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **shadcn/ui** (Radix Primitives)
- **Zod** (Validation)
- **Lucide React** (Icons)

## Setup

1. Check requirements:
   - Node.js 18+
   - API Backend URL (see .env.example)

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup Environment:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your backend URL
   ```

4. Run Development Server:
   ```bash
   npm run dev
   ```

## Folder Structure

- `app/`: Next.js App Router pages
- `components/`: React components (ui = shadcn, nav, workouts)
- `lib/`: Utilities, API client, Auth context, Zod schemas
- `types/`: Shared TypeScript interfaces

## Key Commands Run During Setup

```bash
# Project Init
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm

# Dependencies
npm install zod clsx tailwind-merge lucide-react class-variance-authority @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-toast @radix-ui/react-dialog @radix-ui/react-avatar
```
