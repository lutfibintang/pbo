import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const db=new PGlite();globalThis.testPg=db;process.env.DATABASE_URL='postgres://test';
const read=p=>readFileSync(p,'utf8');
const mod=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const pg=mod('export class Pool {on(){} async query(text,args){return globalThis.testPg.query(text,args);} }');
const assessment=mod(read('lib/assessment.ts').replace("'pg'",JSON.stringify(pg)));
const session=mod(read('lib/student-session.ts').replace("'./assessment'",JSON.stringify(assessment)));
const origin=mod(read('lib/request-origin.ts'));
const grading=mod(read('lib/grading.ts'));
function refs(s){return s.replaceAll("'@/lib/assessment'",JSON.stringify(assessment)).replaceAll("'@/lib/student-session'",JSON.stringify(session)).replaceAll("'@/lib/request-origin'",JSON.stringify(origin)).replaceAll("'@/lib/grading'",JSON.stringify(grading));}
const profile=await import(mod(refs(read('app/api/profile/route.ts')).replace("import roster from '@/data/roster.json';",'const roster='+read('data/roster.json')+';')));
const runner=mod(`export class RunnerError extends Error{status=502} export async function executeJava(code){if(globalThis.failCompiler)throw new RunnerError('Compiler test error');const nonce=code.match(/JL_GRADE_"\\+"([a-f0-9]+)"/)[1];return {stdout:'JL_GRADE_'+nonce+'=1\\nJL_OUTPUT_'+nonce+'=OA==',stderr:'',compiler:'',exitCode:0,elapsed:10,signal:'',timedOut:false};}`);
const run=await import(mod(refs(read('app/api/run/route.ts')).replace("'@/lib/java-runner'",JSON.stringify(runner)).replace("import bank from '@/data/questions.json';",'const bank='+read('data/questions.json')+';')));
const records=await import(mod(read('lib/admin-records.ts').replace("'./assessment'",JSON.stringify(assessment))));
const output=await import(mod(read('lib/admin-output.ts')));
const request=(body,cookie='',method='POST')=>new Request('http://localhost/api/test',{method,headers:{origin:'http://localhost','content-type':'application/json',cookie},body:method==='GET'||method==='DELETE'?undefined:JSON.stringify(body)});
try{
 await db.exec(read('db/schema.sql'));await db.exec(read('db/schema.sql'));
 const entries=await Promise.all(['901','902','115','08','12','14'].map(async code=>{const r=await profile.POST(request({code}));assert.equal(r.status,200);return {profile:(await r.json()).profile,cookie:r.headers.get('set-cookie').split(';')[0]};}));
 assert.equal(new Set(entries.map(x=>x.profile.nim)).size,6);assert.equal(entries[0].profile.questionId,4);assert.equal(entries[1].profile.questionId,6);
 const dummy=entries[0];
 await db.query("UPDATE assignments SET started_at=clock_timestamp()-interval '5 minutes 12 seconds' WHERE user_id=$1",['npm:'+dummy.profile.nim]);
 const started=(await db.query('SELECT started_at FROM assignments WHERE user_id=$1',['npm:'+dummy.profile.nim])).rows[0].started_at;
 assert.equal((await profile.POST(request({code:'901'}))).status,200);
 assert.equal(String((await db.query('SELECT started_at FROM assignments WHERE user_id=$1',['npm:'+dummy.profile.nim])).rows[0].started_at),String(started));
 const code='public class Main {public static void main(String[]args){System.out.println(8);}}';
 const body={code,questionId:4,studentNim:dummy.profile.nim,durationSeconds:1,score:999};
 let r=await run.POST(request({...body,questionId:6},dummy.cookie));assert.equal(r.status,403);
 r=await run.POST(request(body,dummy.cookie));assert.equal(r.status,200);const result=await r.json();assert.equal(result.gradePassed,true);
 let rows=(await records.adminRecords(dummy.profile.nim,1,false)).results;assert.equal(rows.length,1);assert.equal(rows[0].score,100);assert.equal(rows[0].code,code);assert.ok(rows[0].durationSeconds>=312&&rows[0].durationSeconds<325);assert.equal(output.programOutput(rows[0].result,rows[0].status),'8');
 globalThis.failCompiler=true;r=await run.POST(request(body,dummy.cookie));assert.equal(r.status,502);
 rows=(await records.adminRecords('',1,false)).results;assert.equal(rows.length,1);assert.equal(rows[0].status,'error');assert.equal(rows[0].score,null);
 assert.equal((await records.adminRecords(dummy.profile.nim,1,true)).results.length,2);
 assert.equal(output.durationLabel(312),'5 menit 12 detik');assert.equal(output.durationLabel(null),'Belum tercatat');assert.equal(output.programOutput('{','graded'),'Output tidak dapat dibaca.');assert.match(output.programOutput(JSON.stringify({stderr:'oops'}),'graded'),/oops/);
 // PostgreSQL parameter typing and upsert used by admin throttle.
 const {assessmentDb}=await import(assessment);const throttleSql=read('app/api/admin/session/route.ts').match(/prepare\(`([^`]+)`\)/)[1];const limit=await assessmentDb().prepare(throttleSql).bind('test',Date.now()+10000,Date.now(),Date.now()).first();assert.equal(limit.count,1);const again=await assessmentDb().prepare(throttleSql).bind('test',Date.now()+10000,Date.now(),Date.now()).first();assert.equal(again.count,2);
 assert.equal((await profile.DELETE(request(undefined,dummy.cookie,'DELETE'))).status,200);assert.equal((await (await profile.GET(request(undefined,dummy.cookie,'GET'))).json()).profile,null);
 console.log('PASS: PostgreSQL schema/idempotency, 6 identities, sessions, fixed questions, persistence, latest/history SQL, server duration, no timer reset, output formatting and compiler error. External compiler mocked.');
}finally{await db.close();}
