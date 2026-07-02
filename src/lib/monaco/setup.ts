/**
 * Local (self-hosted) Monaco bootstrap.
 *
 * Registers the bundled `monaco-editor` package with `@monaco-editor/react`'s
 * loader so nothing is fetched from a CDN at runtime, and points
 * `MonacoEnvironment` at the base editor worker bundled by Vite.
 *
 * SQL / shell highlighting only needs the base editor worker — no
 * TS/JSON/CSS/HTML language workers.
 *
 * Imported once for its side effects from `main.tsx` before the app renders.
 */
import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

self.MonacoEnvironment = {
  getWorker() {
    return new EditorWorker();
  },
};

loader.config({ monaco });
