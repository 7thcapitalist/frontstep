# frontstep-coder

O builder de sites da Frontstep que roda no mini PC.

## Pastas

- `skills/frontstep-coder/` — a skill que o Claude Code usa para montar cada site: `SKILL.md` (as regras), `references/` (o que ler em cada passo), `scripts/` (QA e o gate), `assets/` (starter e efeitos). Em produção fica em `~/.claude/skills/frontstep-coder/`.
- `worker/` — o serviço `frontstep-worker` (systemd): recebe os jobs do n8n, roda o Claude, passa no gate e publica na Vercel. `skill-hook.mjs` + `hook-settings.json` registram as skills chamadas em cada build. Em produção fica em `~/worker/`.
- `install.sh` — copia o repo para produção.

## Atualizar o mini PC

```bash
cd ~/frontstep && git pull && bash install.sh
```

O `install.sh` roda `node --check`, faz backup em `~/backups/frontstep-<data>.tar.gz`, copia os arquivos e diz o que mudou. Ele **não** reinicia o serviço; se o worker mudou, ele imprime a linha:

```bash
sudo systemctl restart frontstep-worker
```

Para testar sem tocar em produção: `bash install.sh --dry-run` ou `bash install.sh --dest /tmp/teste`.

## Segredos

Nenhum segredo vive aqui. Tokens e chaves ficam só em `/etc/frontstep-worker.env` no mini PC, que o systemd carrega e que nunca entra no repo.
