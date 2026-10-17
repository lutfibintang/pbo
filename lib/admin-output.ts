export function programOutput(result:string|null,status:string) {
 if(!result)return status==='processing'?'Program masih diproses.':'Output belum tersedia.';
 try {
  const data=JSON.parse(result);
  const parts:string[]=[];
  if(typeof data.stdout==='string'&&data.stdout.length)parts.push(data.stdout);
  if(typeof data.compiler==='string'&&data.compiler.trim())parts.push('Pesan compiler:\n'+data.compiler);
  if(typeof data.stderr==='string'&&data.stderr.trim())parts.push('Error program:\n'+data.stderr);
  if(typeof data.error==='string'&&data.error.trim())parts.push(data.error);
  return parts.join('\n\n')||'(Tidak ada output)';
 }catch{return 'Output tidak dapat dibaca.';}
}
export function durationLabel(seconds:number|null) {
 if(seconds===null || !Number.isFinite(seconds))return 'Belum tercatat';
 const total=Math.max(0,Math.floor(seconds));
 const h=Math.floor(total/3600),m=Math.floor(total%3600/60),s=total%60;
 return `${h?h+' jam ':''}${m} menit ${s} detik`;
}
