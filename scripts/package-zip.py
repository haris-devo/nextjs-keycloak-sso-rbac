# scripts/package-zip.py
"""Create a source-only portfolio archive without local credentials or build output."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
import os

root = Path(__file__).resolve().parent.parent
output = root / "dist" / "nextjs-keycloak-sso-rbac.zip"
root_files = {"README.md", "LICENSE", ".gitignore", ".dockerignore", ".editorconfig", ".nvmrc", "package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml"}
source_dirs = {"apps", "infra", "docs", "scripts", ".github"}
excluded_dirs = {"node_modules", ".next", ".git", "dist", "coverage", "playwright-report", "test-results", "__pycache__", ".codex", ".agents"}

def included(path: Path) -> bool:
    relative = path.relative_to(root)
    if path.is_symlink() or any(part in excluded_dirs for part in relative.parts):
        return False
    if len(relative.parts) == 1:
        return path.name in root_files
    if relative.parts[0] not in source_dirs:
        return False
    if path.name.startswith(".env") and path.name != ".env.example":
        return False
    if path.name == ".DS_Store" or path.suffix in {".zip", ".log", ".tsbuildinfo", ".pem", ".key", ".p12", ".pyc"}:
        return False
    return True

output.parent.mkdir(exist_ok=True)
files = []
for directory, children, names in os.walk(root, followlinks=False):
    current = Path(directory)
    children[:] = [name for name in children if name not in excluded_dirs
                   and not (current / name).is_symlink()
                   and (current != root or name in source_dirs)]
    files.extend(current / name for name in names if (current / name).is_file() and included(current / name))
files.sort()
with ZipFile(output, "w", ZIP_DEFLATED) as archive:
    for path in files:
        archive.write(path, Path(root.name) / path.relative_to(root))
print(f"Created {output} with {len(files)} source files.")
