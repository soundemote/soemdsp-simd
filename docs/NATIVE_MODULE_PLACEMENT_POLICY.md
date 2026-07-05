# Native module placement policy

Every native module declares its own placement in its `.cpp` header comment
block, alongside the existing `soemdsp-native-module` / `-label` / `-target`
/ `-kind` tags:

```cpp
// soemdsp-native-path: Major/Minor/Name
// soemdsp-native-construction: true
```

- `soemdsp-native-path` — a free-form `Major/Minor/Name` string. There is no
  enforced taxonomy: each module places itself wherever makes sense to its
  author. `generate_native_modules_catalog.py` and `server.py`'s
  `/api/native-modules` endpoint pass this straight through into the
  catalog's `path` field, unvalidated.
- `soemdsp-native-construction` — `true` or `false` (defaults to `false` if
  the tag is omitted). Marks a module as still under construction /
  incomplete, surfaced in the catalog as `underConstruction`.

Both tags are read by the same generic header parser as the existing
`soemdsp-native-*` tags (`NATIVE_MODULE_HEADER_RE` in `server.py` and
`scripts/generate_native_modules_catalog.py`) — no parser changes are needed
for future tags of this shape.

This is metadata only for now: it is not yet consumed by the Module Browser
UI (still grouped by `node-graph-module-store.js`'s single-level `category`
field). Wiring the Module Browser to this path is a deliberate follow-up,
not part of this policy.

After adding or changing a module's path/construction tags, regenerate the
static catalog:

```
python scripts/generate_native_modules_catalog.py
```
