"""Create and independently restore-check a code/public-evidence backup, never DB or secrets."""
import datetime
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "generated-artifacts/production-audit-2026-11-11"
OUT.mkdir(parents=True, exist_ok=True)
DEST = OUT / "Marenetto-backup-progetto-2026-11-11.zip"
if DEST.exists():
    raise SystemExit("Refusing to overwrite an existing immutable backup; choose a new dated destination.")
HEAD = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
names = subprocess.check_output(
    ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    cwd=ROOT,
).decode().split("\0")
roots = {"artifacts", "lib", "scripts", "docs"}
root_files = {
    "package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "tsconfig.json",
    "tsconfig.base.json", ".gitignore", ".replitignore", "replit.md", ".replit",
}
blocked_parts = {"node_modules", ".git", ".local", ".cache", "dist", "coverage"}
entries = []
omitted = []
sha = lambda data: hashlib.sha256(data).hexdigest()

def allowed(name):
    parts = Path(name).parts
    if not parts or (parts[0] not in roots and name not in root_files):
        return False
    return not (
        any(part in blocked_parts for part in parts)
        or any(part.startswith(".env") for part in parts)
        or re.search(r"(?i)(?:^|/)(?:secrets?|credentials)(?:[./_-]|$)", name)
        or Path(name).suffix.lower() in {".pem", ".key", ".p12", ".pfx", ".sql", ".dump"}
    )

def safe_replit(data):
    """Omit all userenv sections, including invite identities and approval flags."""
    lines = []
    omit = False
    for line in data.decode().splitlines(keepends=True):
        if line.lstrip().startswith("["):
            omit = bool(re.match(r"\[userenv(?:\.[^\]]+)?\]", line.strip()))
        if not omit:
            lines.append(line)
    return "".join(lines).encode()

with zipfile.ZipFile(DEST, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for name in sorted(set(filter(None, names))):
        if not allowed(name):
            continue
        file = ROOT / name
        if not file.is_file() or file.is_symlink():
            omitted.append(name)
            continue
        data = file.read_bytes()
        if name == ".replit":
            data = safe_replit(data)
        member = "source/" + name
        archive.writestr(member, data)
        entries.append({"path": member, "bytes": len(data), "sha256": sha(data),
                        "sanitized": name == ".replit"})
    reference = ROOT / "generated-artifacts/Marenetto-migrazione-2026-11-11.zip"
    data = reference.read_bytes()
    member = "reference/" + reference.name
    archive.writestr(member, data)
    entries.append({"path": member, "bytes": len(data), "sha256": sha(data)})
    manifest = {
        "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "gitHEAD": HEAD, "files": entries, "fileCount": len(entries),
        "bytesUncompressed": sum(row["bytes"] for row in entries),
        "excluded": ["secrets and environment files", ".replit userenv sections", "database data",
                     "private attachments", "node_modules/build/cache/Git internals", "account/provider settings"],
        "scope": "Code and public migration evidence only; not a complete database or cloud disaster-recovery backup.",
        "skippedSymlinksOrMissing": omitted,
    }
    archive.writestr("MANIFEST.json", json.dumps(manifest, indent=2, ensure_ascii=False))
    archive.writestr("README-RIPRISTINO.txt", (
        "Backup non completo per disaster recovery: contiene codice e prove pubbliche.\n"
        "Verificare MANIFEST.json, estrarre source/ in una cartella vuota, ricreare tramite il gestore "
        "sicuro i segreti e le configurazioni utente omesse, installare con pnpm install --frozen-lockfile. "
        "Non eseguire automaticamente migrazioni DB e non attivare l'indicizzazione.\n"
        "Ripristinare database, utenti autenticati e allegati privati soltanto da backup separati autorizzati. "
        "Verificare build, API, permessi e corrispondenza dei file prima del rilascio.\n"
        "reference/ contiene la copia delle fonti pubbliche, non dati di clienti.\n"
    ))

with tempfile.TemporaryDirectory(prefix="restore-check-", dir=OUT) as directory:
    with zipfile.ZipFile(DEST) as archive:
        bad = archive.testzip()
        if bad:
            raise RuntimeError("ZIP CRC failure: " + bad)
        for row in entries:
            relative = Path(row["path"])
            if relative.is_absolute() or ".." in relative.parts:
                raise RuntimeError("Unsafe ZIP path")
            target = Path(directory) / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(archive.read(row["path"]))
            if sha(target.read_bytes()) != row["sha256"]:
                raise RuntimeError("Restored file hash mismatch: " + row["path"])
backup = {
    **{key: manifest[key] for key in ["createdAt", "gitHEAD", "fileCount", "bytesUncompressed", "excluded", "scope"]},
    "file": str(DEST.relative_to(ROOT)),
    "zipBytes": DEST.stat().st_size, "sha256": sha(DEST.read_bytes()),
    "restoreVerification": {"passed": True, "filesIndependentlyExtractedAndHashed": len(entries),
                            "databaseRestoreTested": False, "applicationBootAfterRestoreTested": False},
}
(OUT / "backup-summary.json").write_text(json.dumps(backup, indent=2, ensure_ascii=False))
(OUT / "backup-file-manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
print(json.dumps(backup, indent=2, ensure_ascii=False))
