# Impeccable playbooks in the local Frontstep builder

The source is [pbakaus/impeccable](https://github.com/pbakaus/impeccable), Apache 2.0, inspected at commit `6af45ac9a5eb8792f033d3242f52e99812fd91fa` on 2026-10-16. The complete skill lives in `skills/impeccable/`. The local builder uses four **text playbooks**: layout, animate, polish and bolder. It does not run Impeccable's launcher, install its browser extension, invoke its detector or download a binary at job time.

Use these playbooks as critiques and design techniques, alongside the ten skills explicitly supplied by the user. `brief.json`, image provenance, synthetic-demo limits, selected direction and browser QA remain authoritative. Some Impeccable style prohibitions conflict with valid Frontstep examples, so assess eyebrow labels, section numbers, typography and decorative geometry in the rendered composition instead of treating a source's absolute rule as a pass/fail gate.

Art direction: inspect the layout and bolder playbooks for ways to create a recognizable composition tied to the business. Build: use the animate playbook to specify one purposeful focal motion and state feedback. Repair: use the polish and layout playbooks to fix screenshot findings. Independent visual review still decides whether the result passes; citing a playbook is not evidence of quality.
