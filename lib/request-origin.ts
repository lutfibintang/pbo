/** Match the public Host, since Next.js may use an internal origin behind a proxy. */
export function sameOrigin(request: Request) {
  const origin=request.headers.get('origin');
  if(!origin)return false;
  try {
    const parsed=new URL(origin);
    const host=request.headers.get('host')||new URL(request.url).host;
    return ['http:','https:'].includes(parsed.protocol) && parsed.host===host && parsed.origin===origin;
  }catch{return false;}
}
