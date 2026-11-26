// Test adapter only; bundled exclusively by test-commercial-release.mjs.
// No network, credentials, SQL server or persistent database is used.
const rows=[];
let transaction;
const clone=v=>structuredClone(v);
async function query(sql,params=[]) {
  if(sql==='BEGIN') {transaction=clone(rows);return {rows:[]};}
  if(sql==='COMMIT') {transaction=undefined;return {rows:[]};}
  if(sql==='ROLLBACK') {rows.splice(0,rows.length,...transaction);transaction=undefined;return {rows:[]};}
  if(sql.includes('pg_advisory')) return {rows:[]};
  if(sql==='DELETE FROM editorial_editions WHERE identity=$1') {
    for(let i=rows.length-1;i>=0;i--)if(rows[i].identity===params[0])rows.splice(i,1);
    return {rows:[]};
  }
  if(sql.startsWith('INSERT INTO editorial_editions')) {
    const [id,identity,locale,path,kind]=params;
    if(rows.some(r=>r.id===id||r.path===path||r.identity===identity&&r.locale===locale)) return {rows:[]};
    rows.push({id,identity,locale,path,kind,version:params.length===7?params[5]:1,data:clone(params.at(-1))});
    return {rows:[]};
  }
  if(sql.startsWith('UPDATE editorial_editions e SET data=jsonb_set')) {
    for(const row of rows) if(row.version===1) row.data.revisions[0].sourceHash=rows.find(r=>r.identity===row.identity&&r.locale==='it')?.data.revisions[0].hash??'';
    return {rows:[]};
  }
  if(sql.startsWith('UPDATE editorial_editions SET data=')) {
    const row=rows.find(r=>r.id===params.at(-1));
    if(!row) throw new Error('Missing row');
    row.data=clone(params[0]);
    if(sql.includes('path=$2')){row.path=params[1];row.version++;}
    else row.version=params.length===3?params[1]:row.version+1;
    return {rows:[]};
  }
  if(sql.startsWith('SELECT * FROM editorial_editions')) {
    if(sql.includes('WHERE id=$1')) return {rows:rows.filter(r=>r.id===params[0])};
    if(sql.includes("data->>'activeRevisionId'")) return {rows:rows.filter(r=>r.data.activeRevisionId||r.data.withdrawn)};
    // pg returns a result array, never the database's own row collection.
    // The series importer appends newly inserted rows to its local result.
    return {rows:[...rows]};
  }
  throw new Error('Unsupported isolated SQL: '+sql);
}
export const pool={__isolatedTestOnly:true,query,connect:async()=>({query,release(){}}),end:async()=>{}};
