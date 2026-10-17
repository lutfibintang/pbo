'use client';
import { readApiJson } from '@/lib/api-response';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowRight, BookOpen, Braces, Check, CheckCheck, ChevronRight, Circle, Clock3, Coffee, Expand, HelpCircle, Loader2, Pause, Play, RotateCcw, Sparkles, Square, Terminal, X } from 'lucide-react';
import JavaEditor from '@/components/java-editor';
import AssessmentEntry, { type StudentProfile } from '@/components/assessment-entry';
import { formatTime, normalizeOutput, parseSavedProgress, questions, reusableResult, STORAGE_KEY, type Draft, type ExecutionResult, type Progress } from '@/lib/practice';

type RunRecord = { questionId: number; code: string; stdin: string; reused?: boolean; result?: ExecutionResult; error?: string; checked: boolean };
type ModalType = 'guide' | 'reset' | null;

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const node = dialog.current; node?.showModal(); return () => node?.close(); }, []);
  return <dialog ref={dialog} className="modal" aria-label={title} onCancel={onClose} onClick={e => { if (e.target === dialog.current) onClose(); }}><header className="modal-header"><h2>{title}</h2><button className="icon-button" aria-label="Tutup dialog" onClick={onClose}><X size={20} /></button></header>{children}</dialog>;
}
function downloadFile(name: string, content: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Page() { return <AssessmentEntry>{(profile,logout) => <JavaLab key={profile.nim} profile={profile} onLogout={logout}/>}</AssessmentEntry>; }

function JavaLab({profile,onLogout}: {profile:StudentProfile;onLogout:()=>Promise<void>}) {
  const storageKey = `${STORAGE_KEY}:${profile.nim}`;
  const currentId = profile.questionId;
  const [progress, setProgress] = useState<Progress>({});
  const [seen, setSeen] = useState<number[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [leftTab, setLeftTab] = useState<'description' | 'expected'>('description');
  const [consoleTab, setConsoleTab] = useState<'output' | 'result' | 'input'>('output');
  const [run, setRun] = useState<RunRecord | null>(null);
  const [running, setRunning] = useState(false);
  const [stdin, setStdin] = useState('');
  const [modal, setModal] = useState<ModalType>(null);
  const [paused, setPaused] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [toast, setToast] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [savedAt, setSavedAt] = useState(false);
  const [online, setOnline] = useState(true);
  const controller = useRef<AbortController | null>(null);
  const runLock = useRef(false);
  const question = questions.find(q => q.id === currentId)!;
  const draft = progress[currentId];
  const code = draft?.code ?? question.starter;
  const activeRun = run?.questionId === currentId ? run : null;
  const outputStale = Boolean(activeRun && (activeRun.code !== code || activeRun.stdin !== stdin));
  const passed = Boolean(activeRun?.result?.gradePassed);
  const snapshot = useRef({ version: 1, current: currentId, progress, seen });
  snapshot.current = { version: 1, current: currentId, progress, seen };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const saved = raw ? parseSavedProgress(JSON.parse(raw)) : null;
      if (saved) { setProgress(saved.progress); setSeen(saved.seen); }
      else { setSeen([profile.questionId]); }
    } catch { setStorageError(true); }
    setHydrated(true); setOnline(navigator.onLine);
    const connection = () => setOnline(navigator.onLine);
    window.addEventListener('online', connection); window.addEventListener('offline', connection);
    return () => { window.removeEventListener('online', connection); window.removeEventListener('offline', connection); };
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    setSavedAt(false);
    const timer = window.setTimeout(() => {
      try { localStorage.setItem(storageKey, JSON.stringify(snapshot.current)); setSavedAt(true); setStorageError(false); }
      catch { setStorageError(true); }
    }, 450);
    const flush = () => { try { localStorage.setItem(storageKey, JSON.stringify(snapshot.current)); } catch { /* The editor still allows downloading Main.java. */ } };
    window.addEventListener('beforeunload', flush);
    return () => { window.clearTimeout(timer); window.removeEventListener('beforeunload', flush); };
  }, [progress, currentId, seen, hydrated]);
  useEffect(() => {
    if (!hydrated || paused || modal) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      setProgress(previous => {
        const d = previous[currentId] ?? { code: question.starter, seconds: 0, attempts: 0 };
        return { ...previous, [currentId]: { ...d, seconds: d.seconds + 1 } };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [currentId, hydrated, paused, question.starter, modal]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 4000); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => () => controller.current?.abort(), []);
  const updateCode = useCallback((next: string) => {
    setProgress(previous => ({ ...previous, [currentId]: { ...(previous[currentId] ?? { seconds: 0, attempts: 0 }), code: next } }));
  }, [currentId]);

  async function logout() {
    if (runLock.current) return;
    try {
      try { localStorage.setItem(storageKey,JSON.stringify(snapshot.current)); } catch { /* Server submissions remain saved. */ }
      await onLogout();
    } catch(error) { setToast(error instanceof Error ? error.message : 'Gagal keluar.'); }
  }
  async function execute(check: boolean) {
    if (runLock.current || !hydrated) return;
    const previousResult = check ? reusableResult(activeRun, currentId, code, stdin) : null;
    if (previousResult) {
      setConsoleTab('result');
      setRun({ questionId: currentId, code, stdin, result: previousResult, checked: true, reused: true });
      if (previousResult.gradePassed) {
        setProgress(previous => ({
          ...previous,
          [currentId]: { ...(previous[currentId] ?? { code, seconds: 0, attempts: 0 }), passedCode: code },
        }));
      }
      setToast(previousResult.gradePassed ? 'Tes logika lolos dari hasil Run terakhir.' : 'Ada tes logika yang belum lolos dari hasil Run terakhir.');
      return;
    }
    if (!online) { setToast('Kamu sedang offline. Kode tetap bisa diedit; Run perlu internet.'); return; }
    runLock.current = true; setRunning(true); setConsoleTab(check ? 'result' : 'output');
    const abort = new AbortController(); controller.current = abort;
    const timeout = window.setTimeout(() => abort.abort('timeout'), 42000);
    const submittedId = currentId; const submittedCode = code; const submittedInput = stdin;
    setRun(null);
    setProgress(previous => {
      const d: Draft = previous[submittedId] ?? { code: submittedCode, seconds: 0, attempts: 0 };
      return { ...previous, [submittedId]: { ...d, attempts: d.attempts + 1 } };
    });
    try {
      const response = await fetch('/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: submittedCode, stdin: submittedInput, questionId: submittedId, studentNim: profile.nim }), signal: abort.signal });
      const payload = await readApiJson(response) as ExecutionResult & { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Compiler belum tersedia. Coba lagi.');
      const result = payload as ExecutionResult;
      setRun({ questionId: submittedId, code: submittedCode, stdin: submittedInput, result, checked: check });
      if (check && result.gradePassed) {
        setProgress(previous => ({ ...previous, [submittedId]: { ...previous[submittedId], passedCode: submittedCode } }));
        setToast('Semua tes logika lolos. Progres soal ini disimpan.');
      }
    } catch (error) {
      const message = abort.signal.aborted ? (abort.signal.reason === 'timeout' ? 'Waktu tunggu habis. Coba lagi atau periksa perulanganmu.' : 'Menunggu hasil dihentikan. Proses remote mungkin masih menyelesaikan eksekusi.') : error instanceof Error ? error.message : 'Tidak dapat menjalankan kode.';
      setRun({ questionId: submittedId, code: submittedCode, stdin: submittedInput, error: message, checked: check });
    } finally { window.clearTimeout(timeout); setRunning(false); runLock.current = false; controller.current = null; }
  }
  function resetQuestion() {
    setProgress(previous => ({ ...previous, [currentId]: { code: question.starter, seconds: 0, attempts: 0 } }));
    setRun(null); setModal(null); setToast('Kode soal ini dikembalikan ke kode awal.');
  }
  const resultContent = activeRun?.result;
  return <div className={`app-shell exam-shell ${focusMode ? 'focus-mode' : ''}`}>
    <main className="main-area">
      <section className="workspace-heading"><div><h1>UTS Praktikum <span>PBO Java</span></h1><p>Lengkapi bagian TODO, jalankan kode, lalu periksa hasilnya.</p></div><div className="student-badge"><strong>{profile.name}</strong><span>{profile.nim}</span><button className="text-button" disabled={running} onClick={logout}>Keluar / Ganti praktikan</button></div></section>
      {storageError && <div className="notice warning">Penyimpanan browser tidak tersedia. Unduh Main.java melalui ikon unduh di editor agar jawaban tidak hilang.</div>}
      {!online && <div className="notice warning">Kamu sedang offline. Menulis tetap bisa; menjalankan Java perlu koneksi internet.</div>}
      <section className="workbench" aria-label="Area pengerjaan UTS Java">
        <section className="problem-panel">
          <div className="panel-tabs"><button className={leftTab === 'description' ? 'selected' : ''} onClick={() => setLeftTab('description')}><BookOpen size={15} />Deskripsi soal</button><button className={leftTab === 'expected' ? 'selected' : ''} onClick={() => setLeftTab('expected')}><Terminal size={15} />Contoh output</button><button className="icon-button panel-help" aria-label="Panduan mengerjakan" onClick={() => setModal('guide')}><HelpCircle size={15} /></button></div>
          <div className="problem-scroll">
            <div className="problem-meta"><span className="question-pill">SOAL {String(currentId).padStart(2, '0')}</span><span className={`difficulty ${question.level === 'Menengah' ? 'medium' : ''}`}><span />{question.level}</span><span className="estimate"><Clock3 size={12} />{question.minutes} menit</span></div>
            <h2>{question.title}</h2><div className="topic-tags">{question.topic.split(', ').map(tag => <span key={tag}>{tag}</span>)}</div>
            {leftTab === 'description' ? <><p className="problem-story">{question.description}</p><div className="task-heading"><h3>Tantanganmu</h3><span>2 TODO</span></div><ol className="task-list">{question.tasks.map((task, i) => <li key={i}><span className="task-number">{i + 1}</span><div>{task}</div></li>)}</ol><div className="expected-heading"><h3>Keluaran yang diharapkan</h3><span>stdout</span></div><pre className="expected-code">{question.expected}</pre><div className="tip-box"><span className="tip-icon"><Sparkles size={16} /></span><div><strong>Mulai dari bagian TODO</strong><p>Lengkapi dua bagian kosong pada TODO. Pertahankan kode <code>main</code> yang diberikan.</p></div></div></> : <><p className="problem-story">Jalankan kode dengan data contoh pada method <code>main</code>. Output berikut harus muncul sesuai urutan.</p><pre className="expected-code large">{question.expected}</pre><div className="tip-box"><HelpCircle size={18} /><div><strong>Apa yang diperiksa?</strong><p>Selain memastikan program berjalan, pemeriksa mencoba perilaku method dengan beberapa nilai tambahan, termasuk kondisi batas. Lolos contoh output saja belum cukup.</p></div></div></>}
          </div>
          <footer className="problem-footer"><span><Circle size={9} />{question.category}</span></footer>
        </section>
        <section className="coding-panel">
          <div className="editor-toolbar"><div className="file-tab"><Coffee size={15} /><span>Main.java</span><span className="file-dot" /></div><div className="editor-toolbar-right"><span>Java 21</span><button className="dark-icon" title="Unduh Main.java" aria-label="Unduh Main.java" onClick={() => downloadFile('Main.java', code)}><ArrowDownToLine size={15} /></button><button className="dark-icon" title="Kembalikan kode awal" aria-label="Kembalikan kode awal" disabled={running} onClick={() => setModal('reset')}><RotateCcw size={14} /></button><button className="dark-icon" title={focusMode ? 'Keluar mode fokus' : 'Mode fokus'} aria-label={focusMode ? 'Keluar mode fokus' : 'Mode fokus'} onClick={() => setFocusMode(!focusMode)}>{focusMode ? <ArrowLeft size={15} /> : <Expand size={15} />}</button></div></div>
          <div className="editor-breadcrumb"><span>uts-pbo</span><ChevronRight size={11} /><span>soal-{String(currentId).padStart(2, '0')}</span><ChevronRight size={11} /><Coffee size={12} /><span>Main.java</span></div>
          <div className="editor-container"><JavaEditor value={code} questionId={currentId} onChange={updateCode} onRun={() => execute(false)} onCursor={(line, column) => setCursor({ line, column })} fontSize={14} errors={outputStale ? '' : resultContent?.compiler ?? ''} readOnly={running || !hydrated} /></div>
          <div className="editor-status"><span>{storageError ? 'Penyimpanan gagal' : savedAt ? <><Check size={11} />Tersimpan di browser</> : 'Menyimpan…'}</span><div><span>Ln {cursor.line}, Col {cursor.column}</span><span>UTF-8</span><span>{'{ }'} Java</span></div></div>
          <div className="run-toolbar"><div className="timer"><button className="dark-icon" aria-label={paused ? 'Lanjutkan timer' : 'Jeda timer'} onClick={() => setPaused(!paused)}>{paused ? <Play size={12} /> : <Pause size={12} />}</button><span>{formatTime(draft?.seconds ?? 0)}</span><span className="timer-divider" /><span className="run-shortcut">Ctrl <span>+</span> Enter</span></div><div className="run-actions">{running ? <button className="run-button" onClick={() => controller.current?.abort()}><Square size={12} />Hentikan tunggu</button> : <button className="run-button" disabled={!hydrated} onClick={() => execute(false)}><Play size={13} fill="currentColor" />Run</button>}<button className="check-button" disabled={running || !hydrated} onClick={() => execute(true)}>{running ? <Loader2 size={15} className="spin" /> : <CheckCheck size={15} />}Periksa jawaban</button></div></div>
          <section className="console-panel" aria-label="Terminal hasil Java">
            <div className="console-tabs"><div><button className={consoleTab === 'output' ? 'selected' : ''} onClick={() => setConsoleTab('output')}><Terminal size={13} />Terminal</button><button className={consoleTab === 'result' ? 'selected' : ''} onClick={() => setConsoleTab('result')}>Hasil uji{activeRun?.checked && <span className={`result-dot ${passed ? 'pass' : 'fail'}`} />}</button><button className={consoleTab === 'input' ? 'selected' : ''} onClick={() => setConsoleTab('input')}>Input</button></div><span className="compiler-label"><span />OpenJDK 21</span></div>
            <div className="console-content" aria-live="polite">
              {consoleTab === 'input' ? <><label className="stdin-label" htmlFor="stdin">Standard input (opsional; soal bawaan tidak membutuhkan input)</label><textarea id="stdin" className="stdin" value={stdin} onChange={e => setStdin(e.target.value)} placeholder="Input untuk Scanner, satu nilai per baris…" maxLength={10000} disabled={running} /></> : running ? <div className="console-empty"><Loader2 className="spin" size={22} /><div><strong>Mengompilasi & menjalankan Java…</strong><p>Hasil dari programmu akan tampil di sini.</p></div></div> : activeRun?.error ? <div className="console-error"><strong>Eksekusi belum selesai</strong><p>{activeRun.error}</p></div> : resultContent ? <>
                {activeRun?.reused && !outputStale && <div className="stale-note">Memakai hasil Run terakhir. Klik Run untuk menjalankan ulang.</div>}{outputStale && <div className="stale-note">Kode atau input sudah berubah. Jalankan kembali untuk hasil terbaru.</div>}
                {consoleTab === 'output' ? <><div className="terminal-command"><span>❯</span> javac Main.java && java Main</div>{resultContent.compiler && <pre className="stderr">{resultContent.compiler}</pre>}{resultContent.stdout && <pre className="stdout">{resultContent.stdout}</pre>}{resultContent.stderr && <pre className="stderr">{resultContent.stderr}</pre>}{resultContent.signal && <p className="stderr">Proses dihentikan: {resultContent.signal}</p>}{!resultContent.stdout && !resultContent.stderr && !resultContent.compiler && <p className="muted">Program tidak menghasilkan output.</p>}<div className="exit-info">Exit code {resultContent.exitCode} · {(resultContent.elapsed / 1000).toFixed(1)}s termasuk waktu tunggu</div></> : <><div className={`result-banner ${passed ? 'pass' : 'fail'}`}><span>{passed ? <CheckCheck size={20} /> : <X size={20} />}</span><div><strong>{passed ? 'Tes logika lolos!' : resultContent.exitCode !== 0 ? 'Perbaiki error di terminal' : resultContent.gradeTestsPassed && !resultContent.examplePassed ? 'Output contoh belum sesuai' : 'Masih ada tes logika yang gagal'}</strong><p>{passed ? activeRun?.checked ? 'Progres soal ini sudah disimpan.' : 'Klik Periksa jawaban untuk mencatat progres.' : 'Pemeriksa mengecek output contoh dan perilaku method pada beberapa nilai.'}</p></div></div><div className="output-comparison"><div><span>DIHARAPKAN</span><pre>{question.expected}</pre></div><div><span>OUTPUT KAMU</span><pre>{normalizeOutput(resultContent.stdout) || '(belum ada output)'}</pre></div></div><p className="test-note">Pemeriksa menjalankan beberapa tes perilaku tambahan. Daftar nilai penguji tidak ditampilkan.</p></>}
              </> : <div className="console-empty"><span className="terminal-empty-icon"><Terminal size={23} /></span><div><strong>{consoleTab === 'result' ? 'Siap menguji pemahamanmu?' : 'Terminal siap. Giliran kodemu.'}</strong><p>{consoleTab === 'result' ? 'Klik Periksa jawaban untuk membandingkan hasil.' : <>Klik <b>Run</b> atau tekan <kbd>Ctrl + Enter</kbd> untuk mulai.</>}</p></div></div>}
            </div>
          </section>
        </section>
      </section>
      <div className="workspace-footer"><span><span className="green-dot" />Draf di browser · kode dan nilai tersimpan di server setiap Run/Periksa.</span><span>Kode dikirim ke Wandbox saat dijalankan · <button onClick={() => setModal('guide')}>Cara kerja</button></span></div>
    </main>
    {toast && <div className="toast" role="status"><Check size={16} />{toast}<button aria-label="Tutup notifikasi" onClick={() => setToast('')}><X size={14} /></button></div>}
    {modal === 'guide' && <Modal title="Petunjuk pengerjaan UTS" onClose={() => setModal(null)}><div className="modal-body guide"><div className="guide-intro"><span className="brand-symbol"><Braces size={25} /></span><div><h3>Satu soal. Dua bagian TODO.</h3><p>Lengkapi kode Java sesuai instruksi pada soal.</p></div></div><ol className="guide-steps"><li><b>01</b><div><strong>Soal ditetapkan otomatis</strong><p>Setiap kode NPM mendapat satu soal tetap. Muat ulang halaman atau pindah laptop tidak mengganti soal.</p></div></li><li><b>02</b><div><strong>Lengkapi Main.java</strong><p>Isi dua bagian TODO yang masih kosong. Pertahankan class dan method yang disediakan. Editor mendukung warna sintaks, indentasi, pencarian, dan pelengkapan kata dasar.</p></div></li><li><b>03</b><div><strong>Run, lalu periksa</strong><p>Run mengompilasi kode sekali, menjalankan program, dan menguji perilaku method dengan beberapa nilai tambahan. Periksa jawaban memakai hasil Run terakhir selama kode dan input belum berubah.</p></div></li></ol><div className="shortcut-grid"><span>Jalankan kode <kbd>Ctrl / ⌘ + Enter</kbd></span><span>Cari di editor <kbd>Ctrl / ⌘ + F</kbd></span><span>Undo <kbd>Ctrl / ⌘ + Z</kbd></span><span>Saran kode dasar <kbd>Ctrl + Space</kbd></span></div><div className="guide-note"><strong>Tentang kode & progres</strong><p>Kode dikirim ke layanan kompilasi Wandbox saat Run. Fitur permalink tidak diaktifkan. Internet diperlukan dan layanan dapat membatasi eksekusi. Draf disimpan di browser sesuai NIM. Setiap eksekusi menyimpan kode dan hasil penilaian di server; gunakan ikon unduh untuk salinan Main.java.</p><p>Timer menghitung waktu saat halaman aktif; berhenti ketika tab disembunyikan, dialog terbuka, atau tombol jeda ditekan. Editor menyediakan pelengkapan kata dasar, bukan seluruh IntelliSense Java VS Code.</p></div></div></Modal>}
    {modal === 'reset' && <Modal title="Kembalikan kode awal?" onClose={() => setModal(null)}><div className="modal-body"><p>Kode, timer, dan status untuk <strong>{question.title}</strong> akan direset. Jawaban pada soal lainnya tetap tersimpan.</p><div className="reset-actions"><button className="outline-button" onClick={() => setModal(null)}>Batal</button><button className="primary-button" onClick={resetQuestion}><RotateCcw size={15} />Reset soal ini</button></div></div></Modal>}
  </div>;
}
