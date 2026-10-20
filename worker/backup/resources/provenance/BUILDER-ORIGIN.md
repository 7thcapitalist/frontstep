# Origem do builder recuperado

`builder/` contém uma cópia local do repositório privado [7thcapitalist/frontstep-coder](https://github.com/7thcapitalist/frontstep-coder), branch `main`, commit `0c24be3ea0990abcd0860450de89c09d55c0438d` (02/10/2026). A recuperação foi feita em 16/10/2026 pelo conector GitHub autenticado porque o Git local não conseguiu acessar o remoto. Os 80 arquivos foram lidos naquele commit e gravados sem instalar ou executar o worker. O SHA de blob produzido por `git hash-object` para cada arquivo local coincide com o SHA retornado pelo GitHub.

Este é o código histórico do mini PC: `builder/worker/worker.mjs` chama Claude Code, executa deploy e callbacks externos. `builder/install.sh` instala no mini PC. **Não iniciar o worker ou o instalador para a demonstração local.** A execução pelo Codex fica em `local-factory/`.

O snapshot antigo em `coder-skill/` foi preservado. Dos sete arquivos correspondentes, `SKILL.md`, `references/brief-schema.json` e `scripts/qa-gate.mjs` diferem do builder recuperado; os outros quatro têm o mesmo blob SHA. O builder também traz `scripts/qa.mjs`, starter, efeitos, referências consolidadas e regras por nicho que faltavam no snapshot.

O repositório original não foi modificado nem recebeu push. Esta pasta foi integrada como arquivos, sem copiar o histórico Git do repositório privado para dentro do checkout `frontstep/`.
