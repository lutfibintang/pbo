import { createHmac, timingSafeEqual, createHash } from 'node:crypto';
import { cookies } from 'next/headers';
export const ADMIN_COOKIE = process.env.NODE_ENV === 'production' ? '__Host-javalab-admin' : 'javalab-admin';
function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('Konfigurasi admin belum lengkap.');
  return value;
}
function equal(a: string,b: string) {
  return timingSafeEqual(createHash('sha256').update(a).digest(),createHash('sha256').update(b).digest());
}
export function validPassword(value:string) {
  const password=process.env.ADMIN_PASSWORD;
  if (!password || password.length<16) throw new Error('ADMIN_PASSWORD minimal 16 karakter.');
  secret();
  return equal(value,password);
}
function sign(body:string) { return createHmac('sha256',secret()).update(body).digest('base64url'); }
export function makeAdminSession() {
  const body=JSON.stringify({expires:Date.now()+8*60*60*1000,nonce:crypto.randomUUID()});
  const encoded=Buffer.from(body).toString('base64url');
  return encoded+'.'+sign(encoded);
}
export function verifyAdminSession(value:string) {
  try {
    const parts=value.split('.');
    if(parts.length!==2 || !equal(parts[1],sign(parts[0])))return false;
    const data=JSON.parse(Buffer.from(parts[0],'base64url').toString());
    return typeof data.expires==='number' && data.expires>Date.now();
  } catch{return false;}
}
export async function isAdminSession() { return verifyAdminSession((await cookies()).get(ADMIN_COOKIE)?.value||''); }
export function adminCookie(value:string,age:number) {
  return `${ADMIN_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${process.env.NODE_ENV==='production'?'; Secure':''}`;
}
