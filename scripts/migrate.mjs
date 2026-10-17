import { Pool } from 'pg';
import { readFile } from 'node:fs/promises';
if(!process.env.DATABASE_URL)throw new Error('Isi DATABASE_URL di .env.local.');
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1});
try {await pool.query(await readFile(new URL('../db/schema.sql',import.meta.url),'utf8'));console.log('Skema PostgreSQL siap.');}finally{await pool.end();}
