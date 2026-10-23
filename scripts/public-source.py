"""List and check the explicit source-publication allowlist; never emit secret values."""
from pathlib import Path
import json
import subprocess
import sys
ROOT = Path(__file__).resolve().parents[1]
NAMES = ['.env.example', '.gitignore', '.vercelignore', 'README.md', 'LICENSE', 'package.json', 'package-lock.json', 'index.html', 'tsconfig.json', 'vite.config.ts', 'vercel.json', 'scripts/public-source.py', 'scripts/validate-live.mjs', 'media/source/image-generation-provenance.json', 'evidence/youcam-live-validation.json']
TREES = ['src', 'server', 'api', 'tests', 'public']
files = {ROOT / n for n in NAMES}
for tree in TREES:
    files.update(p for p in (ROOT / tree).rglob('*') if p.is_file() and p.name != '.DS_Store')
secrets = []
for line in (ROOT / '.env').read_text().splitlines() if (ROOT / '.env').exists() else []:
    name, sep, value = line.partition('=')
    if sep and name.strip() in ('YOUCAM_API_KEY', 'YOUCAM_SECRET_KEY'):
        value = value.strip().strip('\"\'')
        if value: secrets.append(value.encode())
for path in files:
    if not path.is_file(): raise SystemExit('Missing allowlisted file: ' + str(path.relative_to(ROOT)))
    if any(secret in path.read_bytes() for secret in secrets): raise SystemExit('Credential check failed; publication stopped.')
paths = sorted(str(p.relative_to(ROOT)) for p in files)
if '--stage' in sys.argv:
    subprocess.run(['git', 'add', '--', *paths], cwd=ROOT, check=True)
    staged = subprocess.check_output(['git','diff','--cached','--name-only'], cwd=ROOT,text=True).splitlines()
    if any(p not in paths for p in staged): raise SystemExit('Staging contains files outside the allowlist; review before publishing.')
print(json.dumps({'files': len(paths), 'credentialCheck': 'passed', 'paths': paths}, indent=2))
