'use client';
import { useState } from 'react';
import { readApiJson } from '@/lib/api-response';
export default function AdminLogin() {
  const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  return <main className="identity-card"><span className="question-pill">JAVALAB · ADMIN</span><h1>Masuk pengawas</h1><form onSubmit={async e=>{e.preventDefault();const password=new FormData(e.currentTarget).get('password');setBusy(true);setError('');try{const r=await fetch('/api/admin/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});const data=await readApiJson<{error?:string}>(r);if(!r.ok)throw new Error(data.error);window.location.reload();}catch(err){setError(err instanceof Error?err.message:'Login gagal.');setBusy(false);}}}><label>Password admin<input name="password" type="password" required maxLength={512} autoComplete="current-password"/></label>{error&&<p role="alert">{error}</p>}<button className="check-button" disabled={busy}>{busy?'Memeriksa…':'Masuk'}</button></form><a href="/">Kembali</a></main>;
}
export function AdminLogout() {
  const [error,setError]=useState('');
  return <><button className="check-button" onClick={async()=>{try{const r=await fetch('/api/admin/session',{method:'DELETE'});await readApiJson(r);if(!r.ok)throw new Error('Gagal keluar');window.location.reload();}catch{setError('Gagal keluar. Coba lagi.');}}}>Keluar admin</button>{error&&<p role="alert">{error}</p>}</>;
}
