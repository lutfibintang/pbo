import { adminCookie, makeAdminSession, validPassword } from '@/lib/admin-auth';
import { assessmentDb } from '@/lib/assessment';
import { createHash } from 'node:crypto';
export const runtime='nodejs';
import { sameOrigin } from '@/lib/request-origin';
export async function POST(request:Request) {
  if(!sameOrigin(request))return Response.json({error:'Permintaan tidak diizinkan.'},{status:403});
  try {
    const body=await request.text();
    if(body.length>2048)return Response.json({error:'Input terlalu panjang.'},{status:400});
    let input;try{input=JSON.parse(body);}catch{return Response.json({error:'Format tidak valid.'},{status:400});}
    const ip=process.env.VERCEL ? request.headers.get('x-vercel-forwarded-for')||'unknown' : 'local';
    const key=createHash('sha256').update(ip).digest('hex');
    const now=Date.now();
    const limit=await assessmentDb().prepare(`INSERT INTO login_limits (key,count,reset_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN login_limits.reset_at<=? THEN 1 ELSE login_limits.count+1 END,reset_at=CASE WHEN login_limits.reset_at<=? THEN excluded.reset_at ELSE login_limits.reset_at END RETURNING count`).bind(key,now+900000,now,now).first<{count:number}>();
    if(!limit || limit.count>10)return Response.json({error:'Terlalu banyak percobaan. Tunggu 15 menit.'},{status:429});
    if(typeof input?.password!=='string'||!validPassword(input.password))return Response.json({error:'Password admin salah.'},{status:401});
    return Response.json({ok:true},{headers:{'Set-Cookie':adminCookie(makeAdminSession(),28800),'Cache-Control':'no-store'}});
  }catch(error){console.error('Admin login failed:',error instanceof Error?error.message:'unknown');return Response.json({error:'Login admin belum tersedia. Periksa konfigurasi dan migrasi database.'},{status:503});}
}
export async function DELETE(request:Request) {
  if(!sameOrigin(request))return Response.json({error:'Permintaan tidak diizinkan.'},{status:403});
  return Response.json({ok:true},{headers:{'Set-Cookie':adminCookie('',0),'Cache-Control':'no-store'}});
}
