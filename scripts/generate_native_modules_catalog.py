"""Regenerate public/native-modules-catalog.json — a static fallback for the
"/api/native-modules" endpoint, used when the sandbox runs without server.py
behind it (e.g. embedded as a static export on soundemote-site). Mirrors the
scan logic in server.py's native_module_entry_from_source/serve_native_modules
exactly; wasmUrl is a relative path so it resolves correctly regardless of
what subdirectory the sandbox is mounted under.

Run this after adding/changing a native module, before syncing to a static
host.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NATIVE_MODULES = ROOT / "native_modules"
OUTPUT = ROOT / "public" / "native-modules-catalog.json"

NATIVE_MODULE_HEADER_RE = re.compile(
    r"^\s*//\s*soemdsp-native-([a-zA-Z0-9_-]+)\s*:\s*(.*?)\s*$"
)


def native_module_entry_from_source(source_path: Path) -> dict[str, object] | None:
    headers: dict[str, str] = {}
    try:
        for line in source_path.read_text(encoding="utf-8").splitlines()[:48]:
            match = NATIVE_MODULE_HEADER_RE.match(line)
            if match:
                headers[match.group(1).lower()] = match.group(2).strip()
    except OSError:
        return None
    name = headers.get("module") or headers.get("name") or source_path.parent.name
    target_type = headers.get("target") or name
    label = headers.get("label") or name
    wasm_path = source_path.with_suffix(".wasm")
    relative_source = source_path.relative_to(ROOT).as_posix()
    relative_wasm = wasm_path.relative_to(ROOT).as_posix()
    return {
        "name": name,
        "label": label,
        "targetType": target_type,
        "kind": headers.get("kind") or "",
        # Module-declared "Major/Minor/Name" placement path (see
        # docs/NATIVE_MODULE_PLACEMENT_POLICY.md) -- each module states its
        # own path via a "soemdsp-native-path" header comment; there is no
        # enforced taxonomy, modules place themselves wherever makes sense.
        "path": headers.get("path") or "",
        "underConstruction": headers.get("construction", "").strip().lower() in ("true", "yes", "1"),
        "source": relative_source,
        "sourceUrl": f"https://github.com/soundemote/soemdsp-sandbox/blob/master/{relative_source}",
        "wasm": relative_wasm,
        "wasmUrl": relative_wasm,
        "wasmAvailable": wasm_path.exists(),
    }


def main() -> None:
    modules = []
    if NATIVE_MODULES.exists():
        for source_path in sorted(NATIVE_MODULES.glob("*/*.cpp")):
            entry = native_module_entry_from_source(source_path)
            if entry:
                modules.append(entry)
    OUTPUT.write_text(json.dumps({"ok": True, "modules": modules}, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(modules)} module entries to {OUTPUT}")


if __name__ == "__main__":
    main()
