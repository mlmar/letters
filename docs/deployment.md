# Deployment

Production deployment is fully automated via GitHub Actions. There is no `npm run deploy` or other manual publish command.

## How it works

On every push to `master` (or when triggered manually), the **Build Output** workflow:

1. Installs dependencies with `npm ci`
2. Builds the Astro site with `npm run build`
3. Publishes the contents of `dist/` to the `v1/build` orphan branch

The `v1/build` branch contains only the built static site. Each deploy replaces the branch history entirely.

## Triggers

- **Automatic:** push to `master`
- **Manual:** Actions → **Build Output** → **Run workflow**

## Environment variables

| Variable | Where | Value |
|----------|-------|-------|
| `BASE_PATH` | GitHub repository Variable | `/letters/` |
| `BASE_PATH` | `.env.development` (local) | `/` |
| `BASE_PATH` | `.env.production` (local) | `/letters/` |

In CI, the workflow reads `BASE_PATH` from a GitHub repository Variable and passes it to the build via `process.env`. Locally, Vite loads it from `.env` files. See [`.env.example`](../.env.example) for the expected format.

### One-time GitHub setup

Before the first workflow run, add the repository Variable:

1. Go to **Settings → Secrets and variables → Actions → Variables**
2. Add `BASE_PATH` with value `/letters/`

Use **Variables** (not Secrets) — `BASE_PATH` is public deploy config, not sensitive.

## GitHub Pages setup

After the first successful workflow run:

1. Go to **Settings → Pages**
2. Set the source branch to `v1/build` (replacing the old `gh-pages` branch if applicable)
3. Verify the site at [https://mlmar.github.io/letters/](https://mlmar.github.io/letters/)

## Local commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development at `http://localhost:3000/` |
| `npm run build` | Build static output to `dist/` |
| `npm run preview` | Preview the production build locally |

These commands build and preview only — they do not publish anything.
