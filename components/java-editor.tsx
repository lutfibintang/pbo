'use client';

import Editor, { loader, type OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { useEffect, useRef, useState } from 'react';

loader.config({ paths: { vs: '/monaco/vs' } });

type Props = { value: string; questionId: number; onChange: (value: string) => void; onRun: () => void; onCursor: (line: number, column: number) => void; fontSize: number; errors: string; readOnly: boolean };
export default function JavaEditor({ value, questionId, onChange, onRun, onCursor, fontSize, errors, readOnly }: Props) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const runRef = useRef(onRun);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  useEffect(() => { runRef.current = onRun; }, [onRun]);
  useEffect(() => {
    const timer = window.setTimeout(() => { if (!editorRef.current) setFallback(true); }, 16000);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    const model = editorRef.current?.getModel();
    const monaco = monacoRef.current;
    if (!model || !monaco) return;
    const markers: Monaco.editor.IMarkerData[] = [];
    for (const match of errors.matchAll(/Main\.java:(\d+):\s*(?:error:)?\s*([^\n]+)/g)) {
      const line = Math.min(Number(match[1]), model.getLineCount());
      markers.push({ startLineNumber: line, endLineNumber: line, startColumn: 1, endColumn: model.getLineMaxColumn(line), message: match[2], severity: monaco.MarkerSeverity.Error });
    }
    monaco.editor.setModelMarkers(model, 'java-compiler', markers);
  }, [errors, questionId, ready]);
  const mount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    monaco.editor.defineTheme('javalab', {
      base: 'vs-dark', inherit: true,
      rules: [
        { token: 'comment', foreground: '738787', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C6A0F6' },
        { token: 'string', foreground: 'A8CF91' },
        { token: 'number', foreground: 'F1BC85' },
        { token: 'type.identifier', foreground: '83D6CF' },
      ],
      colors: { 'editor.background': '#172125', 'editor.foreground': '#D7E2E4', 'editorLineNumber.foreground': '#52676D', 'editorLineNumber.activeForeground': '#A4BCBF', 'editor.lineHighlightBackground': '#1D2B30', 'editor.selectionBackground': '#2F535B', 'editorCursor.foreground': '#82D6C5', 'editorIndentGuide.background1': '#293A40' },
    });
    monaco.editor.setTheme('javalab');
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current());
    editor.onDidChangeCursorPosition(e => onCursor(e.position.lineNumber, e.position.column));
    setReady(true);
  };
  if (fallback && !ready) return <div className="fallback-editor"><div className="fallback-note">Editor sederhana aktif. Kode tetap bisa dijalankan.</div><textarea aria-label="Kode Java" spellCheck={false} value={value} readOnly={readOnly} onChange={e => onChange(e.target.value)} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); onRun(); } }} /></div>;
  return <Editor height="100%" language="java" path={`file:///soal-${questionId}/Main.java`} theme="vs-dark" value={value} onChange={v => onChange(v ?? '')} onMount={mount} loading={<div className="editor-loading"><span className="spinner" /> Menyiapkan editor Java…</div>} options={{ fontSize, fontFamily: '"JetBrains Mono", "Cascadia Code", Consolas, monospace', lineHeight: 24, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 18, bottom: 20 }, automaticLayout: true, tabSize: 4, insertSpaces: true, wordWrap: 'off', bracketPairColorization: { enabled: true }, renderLineHighlight: 'all', smoothScrolling: true, folding: true, fontLigatures: true, suggest: { showWords: true }, quickSuggestions: true, readOnly, accessibilitySupport: 'auto', ariaLabel: 'Editor kode Java Main.java', scrollbar: { verticalScrollbarSize: 7, horizontalScrollbarSize: 7 } }} />;
}
