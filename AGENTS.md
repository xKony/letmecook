<!-- BEGIN:nextjs-agent-rules -->
 
# Next.js: ALWAYS read docs before coding
 
Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.
 
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:pnpm-agent-rules -->

# pnpm: minimumReleaseAge is TEMPORARILY lowered

This repo uses pnpm only (enforced via the `preinstall` script). Package manager settings live in `pnpm-workspace.yaml`.

`minimumReleaseAge: 480` (8h) in `pnpm-workspace.yaml` was set on 2026-08-21 only because Next.js 16.3.2 had been released hours earlier and pnpm's default policy (24h) rejected it.

**TODO for a future agent:** once some time has passed since the last Next.js release (i.e., no dependency you need to install is younger than ~1 day), change `minimumReleaseAge` back to the pnpm default of `1440` (24h) — or remove the line entirely to inherit the default. Do this during a quiet maintenance pass, not mid-feature.

<!-- END:pnpm-agent-rules -->