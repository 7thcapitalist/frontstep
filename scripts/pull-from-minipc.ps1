# Traz o codigo do worker e os assets do coder do mini PC para este repo.
# Rode no PowerShell, na pasta do repo:
#
#   powershell -ExecutionPolicy Bypass -File scripts\pull-from-minipc.ps1
#
# Pede a senha do sudo do mini PC uma vez. Nao traz .env, node_modules, sites/ nem logs.

param(
  [string]$MiniPC = "joao-vitor@100.113.73.59",
  [string]$WorkerDir = "",
  [string]$SkillDir = ""
)
$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

$remote = @'
set -e
W="__W__"; S="__S__"
if [ -z "$W" ]; then
  W=$(systemctl cat frontstep-worker 2>/dev/null | sed -n 's/^WorkingDirectory=//p' | head -1)
  if [ -z "$W" ]; then
    E=$(systemctl cat frontstep-worker 2>/dev/null | sed -n 's/^ExecStart=//p' | head -1 | awk '{print $NF}')
    W=$(dirname "$E")
  fi
fi
if [ -z "$S" ]; then
  S=$(sudo find /home /root /opt -path '*skills/frontstep-coder/SKILL.md' 2>/dev/null | head -1 | xargs -r dirname)
fi
echo "worker: $W"; echo "skill: $S"
[ -d "$W" ] || { echo "Nao achei a pasta do worker. Rode de novo com -WorkerDir"; exit 1; }
[ -d "$S" ] || { echo "Nao achei a skill. Rode de novo com -SkillDir"; exit 1; }
EX="--exclude=node_modules --exclude=sites --exclude=.git --exclude=logs --exclude=*.log --exclude=.env --exclude=*.env --exclude=.env.* --exclude=uploads --exclude=screenshots"
sudo tar czf /tmp/fs-worker.tgz $EX -C "$W" .
sudo tar czf /tmp/fs-skill.tgz $EX -C "$S" .
sudo chown $(id -u):$(id -g) /tmp/fs-worker.tgz /tmp/fs-skill.tgz
'@
$remote = $remote.Replace("__W__", $WorkerDir).Replace("__S__", $SkillDir).Replace("`r", "")

$remote | ssh -t $MiniPC "bash -s"
if ($LASTEXITCODE -ne 0) { throw "Falhou no mini PC." }

$tmp = Join-Path $env:TEMP "fs-pull"
Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory $tmp | Out-Null
scp "${MiniPC}:/tmp/fs-worker.tgz" "${MiniPC}:/tmp/fs-skill.tgz" $tmp
ssh $MiniPC "rm -f /tmp/fs-worker.tgz /tmp/fs-skill.tgz"

# worker: entra inteiro em worker/
New-Item -ItemType Directory -Force worker | Out-Null
tar -xzf (Join-Path $tmp "fs-worker.tgz") -C worker

# skill: SKILL.md, references/ e qa-gate.mjs do repo sao a versao mais nova.
# Do mini PC so entra o que ainda nao existe aqui (assets/, scripts/qa.mjs etc).
$sk = Join-Path $tmp "skill"
New-Item -ItemType Directory $sk | Out-Null
tar -xzf (Join-Path $tmp "fs-skill.tgz") -C $sk
robocopy $sk coder-skill /E /XC /XN /XO /NFL /NDL /NJH /NJS | Out-Null
# guarda a versao do mini PC para comparar, fora do git
New-Item -ItemType Directory -Force .minipc | Out-Null
Copy-Item (Join-Path $sk "*") .minipc -Recurse -Force

Write-Host ""
Write-Host "Pronto. Confira no GitHub Desktop o que entrou em worker/ e coder-skill/."
Write-Host "A copia da skill como esta no mini PC ficou em .minipc/ (ignorada pelo git)."
Write-Host "Procure segredos antes de commitar:  git grep -nE 'sk-ant|APP_USR|ghp_|Bearer [A-Za-z0-9]{20}'"
