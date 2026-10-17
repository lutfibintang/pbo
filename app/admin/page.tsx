import { programOutput, durationLabel } from '@/lib/admin-output';
import roster from '@/data/roster.json';
import { isAdminSession } from '@/lib/admin-auth';
import AdminLogin, { AdminLogout } from '@/components/admin-login';
import { adminRecords, type AdminRow as Row } from '@/lib/admin-records';
export const dynamic = 'force-dynamic';

export default async function Admin({searchParams}:{searchParams:Promise<{page?:string;nim?:string;history?:string}>}) {
  if(!await isAdminSession())return <AdminLogin/>;
  const query=await searchParams;
  const page=Math.max(1,Math.min(10000,Number.parseInt(query.page||'1',10)||1));
  const nim=(query.nim||'').trim().slice(0,20);
  const history=query.history==='1';
  let rows:Row[]=[];let error='';
  try {
    const result=await adminRecords(nim,page,history);
    rows=result.results;
  } catch {error='Data belum dapat dimuat. Muat ulang halaman untuk mencoba lagi.';}
  const link=(p:number)=>`/admin?${new URLSearchParams({page:String(p),nim,history:history?'1':'0'})}`;
  return <main className="admin-panel"><h1>Penilaian UTS PBO Java</h1><AdminLogout/><p>Waktu pengerjaan dihitung dari login pertama sampai Run/Periksa pada baris ini. Waktu tetap berjalan saat keluar atau menutup halaman; durasi compile tidak dihitung.</p><p>Kode dan hasil penilaian tersimpan per akun, NIM, dan nomor soal. Nilai per soal: 100 jika output contoh dan seluruh tes tambahan lolos, 0 jika belum lolos. Gangguan compiler berstatus belum dinilai.</p><p>{history?'Menampilkan riwayat eksekusi.':'Menampilkan eksekusi terakhir setiap praktikan untuk setiap soal.'} Penilaian otomatis berdasarkan hasil uji; ketentuan cara penulisan seperti penggunaan for perlu ditinjau dari kode.</p><details><summary>Daftar kode praktikan ({roster.length})</summary><div className="admin-scroll"><table><thead><tr><th>Kode login</th><th>NPM</th><th>Nama</th><th>Soal</th></tr></thead><tbody>{roster.map(p=><tr key={p.nim}><td>{p.code}</td><td>{p.nim}</td><td>{p.name}</td><td>{p.questionId}</td></tr>)}</tbody></table></div></details><form method="get"><input aria-label="Filter NIM" name="nim" defaultValue={nim} placeholder="Cari NIM lengkap"/><label><input type="checkbox" name="history" value="1" defaultChecked={history}/> Semua riwayat</label><button className="check-button" type="submit">Tampilkan</button><a href="/admin">Reset filter</a></form>{error?<p role="alert">{error}</p>:<><div className="admin-scroll"><table><thead><tr><th>Praktikan</th><th>Soal</th><th>Nilai</th><th>Dikirim (WIB)</th><th>Waktu pengerjaan</th><th>Kode & output</th></tr></thead><tbody>{rows.slice(0,50).map(row=><tr key={row.id}><td><strong>{row.nim}</strong><br/>{row.name}</td><td>{row.questionId}</td><td>{row.status==='graded'?row.score:row.status==='processing'?'Menunggu hasil':'Belum dinilai'}</td><td>{new Date(row.createdAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})}</td><td>{durationLabel(row.durationSeconds)}</td><td><details><summary>Lihat kode</summary><pre>{row.code}</pre></details><details><summary>Output program</summary><pre>{programOutput(row.result,row.status)}</pre></details></td></tr>)}</tbody></table>{!rows.length&&<p>Belum ada pengumpulan yang sesuai. Kode tersimpan ketika praktikan menekan Run atau Periksa jawaban.</p>}</div><nav className="admin-pages">{page>1?<a href={link(page-1)}>← Sebelumnya</a>:<span/>}<span>Halaman {page}</span>{rows.length>50?<a href={link(page+1)}>Berikutnya →</a>:<span/>}</nav></>}<a href="/">Kembali ke soal</a></main>;
}
