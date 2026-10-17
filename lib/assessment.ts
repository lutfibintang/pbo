import { Pool } from 'pg';
let pool: Pool | undefined;
export function postgresSql(sql: string) {
  let i=0;
  // Replace only placeholders outside quoted SQL strings/identifiers.
  return sql.replace(/'(?:''|[^'])*'|"(?:""|[^"])*"|\?/g,token=>token==='?'?'$'+(++i):token);
}
export function assessmentDb() {
  if (!pool) {
    const connectionString=process.env.DATABASE_URL;
    if(!connectionString)throw new Error('DATABASE_URL belum diisi.');
    pool=new Pool({connectionString,max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:10000,allowExitOnIdle:true});
    pool.on('error',()=>console.error('Koneksi database terputus.'));
  }
  const db=pool;
  return {prepare(sql:string){
    const text=postgresSql(sql);
    function bound(args:unknown[]){return {
      async first<T=Record<string,unknown>>(){const r=await db.query(text,args);return (r.rows[0] as T)??null;},
      async all<T=Record<string,unknown>>(){const r=await db.query(text,args);return {results:r.rows as T[]};},
      async run(){return db.query(text,args);}
    };}
    return {...bound([]),bind:(...args:unknown[])=>bound(args)};
  }};
}
