# Code Settings Editor Contract

This is the small shared editor shape currently used by the sandbox metaparameter script editor and intended for Asciiscope/Yculth settings editors.

## Principle

The script is the source of truth. Buttons, suggestions, and diagnostics are helpers around readable assignment text.

Use literal values. Do not add hidden aliases such as `any -> 0` or `default -> def`.

```js
param.level.def = 1;
param.level.step = 0;
param.level.linearSmoothing = true;
```

## Shared Shell

The reusable browser helper is:

```html
<script src="./public/node-code-settings-editor.js"></script>
```

It exposes:

```js
window.nodeCodeSettingsEditor
```

Useful functions:

```js
nodeCodeSettingsEditor.assignmentInfo(line, { keyFromPath });
nodeCodeSettingsEditor.colorizeLine(line, options);
nodeCodeSettingsEditor.highlightHtml(text, options);
nodeCodeSettingsEditor.findTokenAt(text, caretIndex, options);
nodeCodeSettingsEditor.referenceHtml(options);
nodeCodeSettingsEditor.referenceContextHtml(context, options);
nodeCodeSettingsEditor.referenceOptionHtml(option, context, options);
nodeCodeSettingsEditor.escapeHtml(value);
```

The helper owns only editor mechanics:

- assignment line parsing
- textarea/highlight rendering helpers
- contextual suggestion strip HTML
- token-at-caret lookup
- HTML escaping and token classes

It does not own domain settings, persistence, presets, or audio/visual behavior.

## Domain Adapter

Each editor should provide a small adapter around the shared shell:

```js
const asciiscopeSettingsAdapter = {
  id: "asciiscope",
  title: "Asciiscope Settings",
  keyFromPath(path) {
    return String(path || "").split(".").pop();
  },
  optionsForKey(key) {
    if (key === "mode") {
      return { label: "mode", options: ["scope", "spectral", "particle"].map(value => ({ label: value, value })) };
    }
    if (key === "enabled") {
      return { label: "enabled", options: [{ label: "true", value: "true" }, { label: "false", value: "false" }] };
    }
    return null;
  },
  analyze(source) {},
  apply(source) {},
  normalize(source) {},
  defaultScript() {},
};
```

The sandbox metaparameter editor keeps its domain-specific functions in `public/node-graph-metadata-editor.js` and calls the shared shell for generic editor work.

## Script Shape

Prefer one setting per line:

```js
scope.gain = 1;
scope.decay = 0.08;

spectral.lanes = 64;
spectral.minHz = 40;
spectral.maxHz = 16000;
spectral.frequencySkew = 0.65;

particle.count = 512;
particle.size = 2;
particle.drag = 0.04;
```

Parser rules for first pass:

- ignore blank lines
- ignore `// comments`
- parse `path.to.key = value;`
- accept only known keys
- report ignored/unsupported lines in diagnostics
- normalize to explicit literal values

## UI Shape

Mirror this DOM structure:

```html
<section class="metadata-script-panel">
  <div class="metadata-script-heading">
    <strong id="exampleScriptTarget">Current target</strong>
  </div>
  <div id="exampleScriptReference" class="metadata-script-reference"></div>
  <div class="metadata-script-editor">
    <pre id="exampleScriptHighlight" class="metadata-script-highlight" aria-hidden="true"></pre>
    <textarea id="exampleScriptSource" spellcheck="false"></textarea>
  </div>
  <div class="metadata-script-actions">
    <button>Save</button>
    <button>Restore</button>
    <button>Normalize</button>
    <button>Copy</button>
    <button>Paste</button>
  </div>
  <output class="pill">script ready</output>
</section>
```

The suggestion strip must have a stable height and scroll internally. Do not let contextual suggestions resize the editor.

## Handoff Notes For Asciiscope

Start by hard-coding useful settings for `scope`, `spectral`, and `particle`. Use the shared helper for editor mechanics, then keep Asciiscope-specific parsing and application local to Asciiscope.

Do not build a giant settings framework yet. The goal is compatible editor language and widget behavior.
