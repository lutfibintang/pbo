'use client';
import { readApiJson } from '@/lib/api-response';
import { useEffect,useState,type ReactNode } from 'react';
export type StudentProfile={nim:string;name:string;questionId:number};
export default function AssessmentEntry({children}:{children:(profile:StudentProfile,logout:()=>Promise<void>)=>ReactNode}) {
  const [profile,setProfile]=useState<StudentProfile|null>(null);
  const [loading,setLoading]=useState(true);
  const [ready,setReady]=useState(false);
  const [error,setError]=useState('');
  async function load(){
    setLoading(true);setError('');
    try{const r=await fetch('/api/profile',{cache:'no-store'});const data=await readApiJson(r) as {profile:StudentProfile|null;error?:string};if(!r.ok)throw new Error(data.error);setProfile(data.profile);setReady(true);}
    catch(e){setError(e instanceof Error?e.message:'Tidak dapat memuat sesi.');}finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[]);
  async function logout(){
    const r=await fetch('/api/profile',{method:'DELETE'});
    await readApiJson(r);
    if(!r.ok)throw new Error('Gagal keluar. Coba lagi sebelum mengganti praktikan.');
    setProfile(null);setError('');setReady(true);
  }
  if(profile)return children(profile,logout);
  async function login(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();const f=new FormData(e.currentTarget);setLoading(true);setError('');
    try{const r=await fetch('/api/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:f.get('code')})});const data=await readApiJson(r) as {profile:StudentProfile|null;error?:string};if(!r.ok)throw new Error(data.error);setProfile(data.profile);}
    catch(e){setError(e instanceof Error?e.message:'Login gagal.');}finally{setLoading(false);}
  }
  return <main className="identity-card"><span className="question-pill">JAVALAB · UTS PBO</span><h1>Masuk praktikan</h1><p>Masukkan kode NPM kamu. Nama dan soal akan ditentukan otomatis.</p>{error&&<p role="alert" className="stderr">{error}</p>}{ready?<form onSubmit={login}><label>Kode NPM<input name="code" required pattern="[0-9]{2,3}" inputMode="numeric" maxLength={3} autoComplete="off" placeholder="Contoh: 08, 79, atau 103" autoFocus/></label><p>Gunakan dua digit untuk 01–99, atau tiga digit untuk 100 ke atas.</p><button className="check-button" disabled={loading}>{loading?'Memeriksa…':'Masuk'}</button></form>:<button className="check-button" disabled={loading} onClick={load}>{loading?'Memuat sesi…':'Coba lagi'}</button>}</main>;
}
