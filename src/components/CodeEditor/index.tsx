import { useCallback, useEffect, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: "sql" | "shell";
  /** Minimum editor height in px. Default 120. */
  minHeight?: number;
  /**
   * Maximum editor height in px. When omitted, defaults to a viewport-based
   * value (recomputed on window resize) so the editor can grow to nearly fill
   * the screen before scrolling internally.
   */
  maxHeight?: number;
  readOnly?: boolean;
  /** Overlay text shown when the editor is empty (Monaco has no native placeholder). */
  placeholder?: string;
}

/** Leave room for form chrome (labels, drawer padding, buttons) below the editor. */
const VIEWPORT_OFFSET = 220;
const VIEWPORT_MIN = 240;

function viewportMaxHeight(): number {
  return Math.max(VIEWPORT_MIN, window.innerHeight - VIEWPORT_OFFSET);
}

/**
 * Auto-grow the editor with its content, clamped to [minHeight, maxHeight].
 * When `maxHeight` is omitted, tracks a viewport-based max (updated on resize).
 * Returns the current height and a `notifyContentHeight` callback to feed
 * Monaco's content height into the clamp.
 */
function useAutoGrowHeight(minHeight: number, maxHeight?: number) {
  const [height, setHeight] = useState(minHeight);
  const [viewportMax, setViewportMax] = useState(viewportMaxHeight);
  const maxPx = maxHeight ?? viewportMax;

  useEffect(() => {
    if (maxHeight != null) return;
    const onResize = () => setViewportMax(viewportMaxHeight());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [maxHeight]);

  const notifyContentHeight = useCallback(
    (contentHeight: number) => setHeight(Math.min(Math.max(contentHeight, minHeight), maxPx)),
    [minHeight, maxPx],
  );

  return { height, notifyContentHeight };
}

const EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  fontSize: 13,
  lineNumbers: "on",
  quickSuggestions: true,
  // Don't let commit characters (notably space) auto-accept the highlighted
  // suggestion — that duplicates the word and swallows the space. Tab/Enter
  // still accept.
  acceptSuggestionOnCommitCharacter: false,
  wordWrap: "on",
  scrollbar: { alwaysConsumeMouseWheel: false },
  overviewRulerLanes: 0,
};

/**
 * Monaco-backed code editor that auto-grows with its content between
 * `minHeight` and `maxHeight`, then scrolls internally once content exceeds
 * the max. Matches the app's light Ant Design theme.
 */
export default function CodeEditor({
  value,
  onChange,
  language,
  minHeight = 120,
  maxHeight,
  readOnly = false,
  placeholder,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  // Guards the onChange handler while we push an *external* value via setValue —
  // Monaco fires onDidChangeModelContent synchronously from setValue, and
  // without this we'd echo the imported value straight back to the parent.
  const suppressChangeRef = useRef(false);
  const { height, notifyContentHeight } = useAutoGrowHeight(minHeight, maxHeight);

  // Re-clamp when bounds change (e.g. window resized while editing).
  useEffect(() => {
    const ed = editorRef.current;
    if (ed) notifyContentHeight(ed.getContentHeight());
  }, [notifyContentHeight]);

  const handleMount: OnMount = (ed) => {
    editorRef.current = ed;
    notifyContentHeight(ed.getContentHeight());
    ed.onDidContentSizeChange(() => notifyContentHeight(ed.getContentHeight()));
  };

  // Sync *external* value changes (e.g. switching tasks) into the model, but
  // never while the user is typing — echoing our own `onChange` back into a
  // controlled `value` prop races with rapid keystrokes and scrambles input.
  // The editor is the source of truth while focused.
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed || ed.hasTextFocus()) return;
    if (value !== ed.getValue()) {
      suppressChangeRef.current = true;
      ed.setValue(value);
      suppressChangeRef.current = false;
    }
  }, [value]);

  const handleChange = (v: string | undefined) => {
    if (suppressChangeRef.current) return;
    onChange(v ?? "");
  };

  const isEmpty = !value;

  return (
    <div
      style={{
        position: "relative",
        border: "1px solid #E1E4E8",
        borderRadius: 0,
        overflow: "hidden",
      }}
    >
      <Editor
        height={height}
        language={language}
        theme="vs"
        defaultValue={value}
        onChange={handleChange}
        onMount={handleMount}
        options={{ ...EDITOR_OPTIONS, readOnly }}
      />
      {isEmpty && placeholder ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 62,
            padding: "1px 0",
            fontSize: 13,
            lineHeight: "19px",
            fontFamily: "Menlo, Monaco, 'Courier New', monospace",
            color: "#8B949E",
            pointerEvents: "none",
            whiteSpace: "pre",
          }}
        >
          {placeholder}
        </div>
      ) : null}
    </div>
  );
}
