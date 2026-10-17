import { assessmentDb } from './assessment';
export type AdminRow = {id:string;nim:string;name:string;questionId:number;code:string;status:string;score:number|null;createdAt:string;durationSeconds:number|null;result:string|null};
export async function adminRecords(nim:string,page:number,history:boolean){
  return assessmentDb().prepare(`SELECT s.id,p.nim,p.name,s.question_id AS "questionId",s.code,s.status,s.score,s.created_at AS "createdAt",s.duration_seconds AS "durationSeconds",s.result FROM submissions s JOIN students p ON p.user_id=s.user_id WHERE (? = '' OR p.nim = ?) ${history?'':`AND s.seq = (SELECT MAX(s2.seq) FROM submissions s2 WHERE s2.user_id=s.user_id AND s2.question_id=s.question_id)`} ORDER BY p.nim,s.question_id,s.created_at DESC LIMIT 51 OFFSET ?`).bind(nim,nim,(page-1)*50).all<AdminRow>();
}
