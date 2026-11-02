# Frontstep

**Websites for small businesses that don't have one, found, built and sold almost entirely by software.**

Frontstep finds local businesses in Brazil that have good reviews on Google Maps but no website, builds a custom preview site with an AI coding agent, sends it to the owner on WhatsApp, and handles the price negotiation and payment link. A human (João) approves the lead list and steps in for anything the bot can't close.

- **Live site:** https://frontstep-phi.vercel.app
- **Who it's for:** owners of small Brazilian businesses (clinics, shops, event planners, lawyers, accountants) who are on WhatsApp and Instagram but have no site.
- **Status:** working prototype, early. The pipeline runs end to end, but there is no meaningful revenue yet. The five showcase sites on the landing page are fictional businesses, labeled as such. The first real customer site was built for a friendly customer with a 100% discount coupon. No funding.

## How it works

```
Capture    Google Maps scrape (Apify) -> CRM sheet (rating, reviews, phone, photos)
Outreach   WhatsApp template (Kapso) -> reply classifier: yes / no / opt-out / question
Build      "yes" -> brief -> POST /build to a worker -> Claude Code (headless)
           with the frontstep-coder skill -> QA gate -> Vercel deploy
Preview    preview link sent on WhatsApp (08:00-20:00 BRT window only)
Sales      negotiation bot (price floors enforced in code), domain check, Mercado Pago link
After      payment webhook -> mark paid -> confirm to the customer
Holding    ledger of costs and revenue per "factory", pricing A/B test, weekly report
```

Design choices worth knowing:

- **Rules live in code, not in the prompt.** The sales bot's price floors are enforced by a code step that scans every R$ value in the model's reply. The reply classifier and decision ledger are plain, tested JS.
- **QA gate.** `coder-skill/scripts/qa-gate.mjs` checks generated sites (photos, colour, brand, overflow) before anything is shown to a customer.
- **Push, not poll.** After an incident where polling burned the n8n execution quota in hours, the worker only receives pushes.
- **Messaging guardrails.** Customer messages only go out 08:00-20:00 BRT; outside that window they are scheduled, never dropped. Opt-outs are honored.

## Repo layout

| Path | What's in it |
|---|---|
| `coder-skill/` | The `frontstep-coder` skill: builder rules, style/motion/conversion references, the QA gate |
| `n8n/` | Exported n8n workflows (secrets masked) plus tested Code-node logic: reply classifier (`wf2-classificador/`), decision ledger (`wf2-decision-ledger/`), webhook signature check |
| `worker/` | Build-server notes. `worker/backup/` is a local fallback executor (SQLite job ledger, durable queue, budget caps, browser QA) |
| `site/` | The static landing page deployed on Vercel, plus per-change QA reports |
| `scripts/` | n8n export, mini-PC sync, and `deploy-vitrine.mjs` (preview deploy with Lighthouse and browser checks; never promotes to production by itself) |
| `docs/` | Status notes, brand, pricing/holding design, n8n + Kapso setup |

## Running it

This is a personal operations stack, not a one-command install. It depends on accounts for n8n, Kapso (WhatsApp), Apify, Vercel, Mercado Pago and Claude Code, plus a small always-on machine for the build worker.

1. Copy `.env.example` to the worker's env file and fill in the values (names only are in the repo; real tokens never are).
2. Import the workflows from `n8n/` into n8n.
3. Run the worker on the build machine (see `docs/` and `worker/`).

Checks you can run without any accounts:

```
node --test n8n/wf2-classificador/classificador.test.mjs \n  n8n/wf2-decision-ledger/decision-ledger.test.mjs \n  n8n/patches/webhook-lead-secret/test.mjs
```

Before committing, scan for secrets:

```
git grep -nE "sk-ant|APP_USR|ghp_|Bearer [A-Za-z0-9]{20}"
```

## Stack

Claude Code (headless) as the site builder, n8n for orchestration, Kapso/WAHA for WhatsApp, Apify for lead capture, Vercel for hosting, Mercado Pago for payments, Node.js and Python for glue, Lighthouse and a browser QA script for checks.

## Known gaps and next steps

- Worker source on the production mini PC is not fully mirrored here yet; `worker/backup/` generation is paused and was only tested with mocks.
- The lead webhook still needs authentication.
- CRM statuses need normalizing across workflows.
- Real WhatsApp number on the public site; customer approval loop; automated `.com` purchase.
- Clone the pipeline for a second vertical/factory once there are about 10 sales.
- Lessons for the accounting product ([AI4accounting](https://github.com/7thcapitalist/AI4accounting)): agent pipelines need hard guardrails in code, human checkpoints, and cost tracking from day one.

## Team / contact

Built by João Vitor Carvalho ([@7thcapitalist](https://github.com/7thcapitalist)).
Docs are mostly in English with some Portuguese notes, since the customers are Brazilian.
