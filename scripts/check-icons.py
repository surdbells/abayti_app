#!/usr/bin/env python3
"""
check-icons.py — Lint guard for the AX_ICON_SET registry.

Verifies that every <ax-icon name="..."> reference in the
codebase's HTML templates resolves to an icon that's actually
registered in src/app/shared/ax-mobile/icon/icon-set.ts.

Without this guard, a typo or a forgotten registration just
causes the icon to silently not render at runtime — there's
no compile error and no console warning. M68 surfaced one
such case ('rotate-ccw' on the failed.page) that had been
broken for some time.

Exits with code 0 if all icons are registered, 1 otherwise.

Also prints a list of icons that are registered but not used
anywhere — these aren't fatal (the registry can pre-load
icons for future use), just informational.

Usage:
    python3 scripts/check-icons.py
    npm run check-icons   (if wired into package.json scripts)

The script is intentionally dependency-free (just stdlib) so
it works in CI without an npm install pass.
"""
from __future__ import annotations
import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
ICON_SET_PATH = REPO_ROOT / "src/app/shared/ax-mobile/icon/icon-set.ts"
TEMPLATE_GLOB = "src/**/*.html"


def parse_registered_icons(icon_set_text: str) -> set[str]:
    """Extract the kebab-case keys from AX_ICON_SET entries.

    Matches lines like:
        'arrow-left': ArrowLeft,

    Tolerant of whitespace; ignores commented lines.
    """
    keys: set[str] = set()
    for line in icon_set_text.splitlines():
        # Strip leading whitespace, skip comments
        stripped = line.lstrip()
        if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
            continue
        m = re.match(r"'([a-z][a-z0-9-]*)'\s*:\s*[A-Z]", stripped)
        if m:
            keys.add(m.group(1))
    return keys


def find_icon_usages(repo_root: Path) -> dict[str, list[Path]]:
    """Find all <ax-icon name="..."> references in HTML templates.

    Returns a map: icon_name -> [list of files using it].

    Only matches LITERAL string names. Dynamic bindings like
    [name]="someExpr" can't be statically validated and are
    skipped.
    """
    usages: dict[str, list[Path]] = {}
    pattern = re.compile(r'<ax-icon\b[^>]*\bname="([^"{}]+)"')
    for html in repo_root.glob("src/**/*.html"):
        text = html.read_text()
        for m in pattern.finditer(text):
            name = m.group(1)
            usages.setdefault(name, []).append(html.relative_to(repo_root))
    return usages


def main() -> int:
    if not ICON_SET_PATH.exists():
        print(f"  ✗ icon-set.ts not found at {ICON_SET_PATH}", file=sys.stderr)
        return 2

    registered = parse_registered_icons(ICON_SET_PATH.read_text())
    usages = find_icon_usages(REPO_ROOT)

    print(f"check-icons: {len(registered)} registered, {len(usages)} unique names used")
    print()

    # Missing — used but not registered (FATAL)
    missing = sorted(name for name in usages if name not in registered)
    if missing:
        print(f"  ✗ {len(missing)} icon(s) used but NOT registered:")
        for name in missing:
            files = usages[name]
            preview = ", ".join(str(f) for f in files[:3])
            extra = "" if len(files) <= 3 else f" (+{len(files)-3} more)"
            print(f"      '{name}'  -- in {preview}{extra}")
        print()
        print("  Fix: add the missing entries to AX_ICON_SET in")
        print(f"  {ICON_SET_PATH.relative_to(REPO_ROOT)}")
        print()

    # Unused — registered but not in any template (informational)
    unused = sorted(name for name in registered if name not in usages)
    if unused:
        print(f"  ℹ {len(unused)} icon(s) registered but not currently used in templates:")
        for name in unused:
            print(f"      '{name}'")
        print()
        print("  These can be removed from AX_ICON_SET and the import list to")
        print("  reduce the bundle, or kept if planned for upcoming use.")
        print()

    if missing:
        return 1
    print("  ✓ All used icons are registered.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
