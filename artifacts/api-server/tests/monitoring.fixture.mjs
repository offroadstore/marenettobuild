import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import pg from 'pg';
import { and, eq } from 'drizzle-orm';
import router from '../src/routes/monitoring.ts';
import { db, pool, monitoringSettingsTable as settings, monitoringOauthStatesTable as states } from '@workspace/db';
import { addDays, dayInTimezone, decryptTokens, encryptTokens, getPeriod, hash, metric, MonitoringError, oauthConfig, scopes } from '../src/lib/monitoring/core.ts';
import { getSettings, accessToken, lockedSettings } from '../src/lib/monitoring/store.ts';
import { exchangeToken, googleJson, listProperties } from '../src/lib/monitoring/google.ts';
import { gaReport, searchReport, ReportCache, reportCache } from '../src/lib/monitoring/reports.ts';

test('calendar periods, equal comparisons and weighted-rate conventions', () => {
  const now = new Date('2026-11-12T12:00:00Z');
  const p = getPeriod({days:7}, now);
  assert.deepEqual(p, {start:'2026-11-05',end:'2026-11-11',previousStart:'2026-10-29',previousEnd:'2026-11-04',days:7});
  assert.equal(getPeriod({start:'2024-02-28',end:'2024-03-01'}, now).days,3);
  for(const q of [{start:'2026-02-30',end:'2026-03-01'},{start:'2026-01-01'},{days:30},{start:'2026-11-12',end:'2026-11-13'},{start:'2025-01-01',end:'2026-11-01'}]) assert.throws(()=>getPeriod(q,now));
  assert.equal(addDays('2024-02-28',1),'2024-02-29');
  assert.equal(dayInTimezone('America/Los_Angeles',new Date('2026-03-08T07:30:00Z')),'2026-03-07');
  assert.equal(metric('rate','CTR',.25,.1,'percent').change,15);
  assert.equal(metric('x','X',10,0).change,null);
  assert.equal(metric('x','X',0,10).change,-1);
  assert.equal(metric('x','X',null,10).change,null);
});

test('all routes, encrypted persistence, OAuth, provider fixtures, cache and operational isolation', async () => {
  const schema=process.env.MONITORING_TEST_SCHEMA;
  assert.match(schema,/^monitoring_fixture_[a-f0-9]{32}$/);
  const admin = new pg.Pool({connectionString:process.env.DATABASE_URL});
  const realFetch=globalThis.fetch;
  let server;
  let calls=[], mode='ok', refreshes=0, revokeOk=true, pagination=false;
  const gaRow=(values,label)=>({dimensionValues:label?[{value:label}]:undefined,metricValues:values.map(value=>({value:String(value)}))});
  const fixtureResponse=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
  globalThis.fetch=async (url,init={})=>{
    const u=new URL(url);
    if(u.hostname==='127.0.0.1')return realFetch(url,init);
    calls.push({host:u.hostname,path:u.pathname,body:init.body});
    assert.ok(['oauth2.googleapis.com','analyticsadmin.googleapis.com','analyticsdata.googleapis.com','www.googleapis.com','searchconsole.googleapis.com'].includes(u.hostname),`Unexpected network host ${u.hostname}`);
    if(u.pathname==='/revoke')return new Response('',{status:revokeOk?200:503});
    if(mode==='timeout')throw new DOMException('fixture','TimeoutError');
    if(mode==='quota')return fixtureResponse({error:{status:'RESOURCE_EXHAUSTED'}},429);
    if(mode==='quota403')return fixtureResponse({error:{errors:[{reason:'quotaExceeded'}]}},403);
    if(mode==='forbidden')return fixtureResponse({error:{message:'private provider payload must never escape'}},403);
    if(mode==='revoked')return fixtureResponse({error:'invalid_grant',error_description:'private refresh-token'},400);
    if(u.pathname==='/token'){
      refreshes++;
      const form=new URLSearchParams(init.body);
      if(form.get('grant_type')==='authorization_code')assert.ok(form.get('code_verifier'));
      return fixtureResponse({access_token:'fixture-access',refresh_token:'fixture-refresh',expires_in:3600,scope:mode==='partialScopes'?scopes[0]:mode==='extraScopes'?[...scopes,'https://www.googleapis.com/auth/analytics.edit'].join(' '):scopes.join(' ')});
    }
    if(u.pathname.includes('accountSummaries'))return fixtureResponse({accountSummaries:[{displayName:'Fixture account',propertySummaries:[{property:'properties/123',displayName:'Fixture GA4'}]}],...(pagination&&!u.searchParams.has('pageToken')?{nextPageToken:'page-two'}:{})});
    if(u.hostname==='analyticsadmin.googleapis.com')return fixtureResponse({timeZone:'Europe/Rome'});
    if(u.hostname==='analyticsdata.googleapis.com'){
      const reports=JSON.parse(init.body).requests.map((r,i)=>{
        assert.deepEqual(r.metrics.map(m=>m.name),['activeUsers','sessions','screenPageViews','engagementRate']);
        if(mode==='empty')return {rows:[],metadata:{}};
        return {rows:[gaRow(mode==='zero'?[0,0,0,0]:i===1?[50,30,90,.2]:[100,60,180,.4],i===2?'20260110':i===3?'Organic Search':i===4?'/servizi':null)],metadata:{subjectToThresholding:true,dataLossFromOtherRow:true}};
      });
      return fixtureResponse({reports});
    }
    if(u.pathname==='/webmasters/v3/sites')return fixtureResponse({siteEntry:[{siteUrl:'sc-domain:example.invalid',permissionLevel:'siteOwner'},{siteUrl:'sc-domain:not-verified.invalid',permissionLevel:'siteUnverifiedUser'}]});
    if(u.hostname==='searchconsole.googleapis.com'){
      const q=JSON.parse(init.body);
      assert.ok(q.rowLimit<=366);
      const dimension=q.dimensions?.[0];
      return fixtureResponse(mode==='empty'?{}:{rows:[{clicks:10,impressions:100,ctr:.1,position:3,...(dimension?{keys:dimension==='date'?['2026-01-10']:['fixture top result']}: {})}]});
    }
    throw new Error('Missing provider fixture');
  };
  try {
    await admin.query(`CREATE SCHEMA "${schema}"`);
    await pool.query(`CREATE TABLE monitoring_settings (
      environment text PRIMARY KEY, revision text NOT NULL, encrypted_tokens text,
      ga4_property text, search_console_property text, measurement_id text NOT NULL DEFAULT '',
      container_id text NOT NULL DEFAULT '', checks jsonb NOT NULL DEFAULT '{}',updated_at timestamptz NOT NULL DEFAULT now());
      CREATE TABLE monitoring_oauth_states (hash text PRIMARY KEY,environment text NOT NULL,member_id integer NOT NULL,session_hash text NOT NULL,verifier text NOT NULL,revision text NOT NULL,expires_at timestamptz NOT NULL);
      CREATE TABLE project_requests (created_at timestamptz NOT NULL,is_synthetic boolean NOT NULL,lead_status text NOT NULL,service text NOT NULL,preferred_language text NOT NULL);
      INSERT INTO project_requests VALUES
        ('2026-01-10T13:00:00Z',true,'approved','manutenzione','it'),
        ('2026-01-09T13:00:00Z',true,'new','ristrutturazione','en'),
        ('2026-01-10T13:00:00Z',false,'approved','produzione','nl');`);
    process.env.NODE_ENV='development';
    for(const key of ['GOOGLE_ANALYTICS_CLIENT_ID','GOOGLE_ANALYTICS_CLIENT_SECRET','GOOGLE_ANALYTICS_REDIRECT_URI','MONITORING_TOKEN_KEY','MARENETTO_PRIVACY_APPROVED','MARENETTO_PROVIDERS_APPROVED','MARENETTO_TESTING_APPROVED'])delete process.env[key];
    const app=express();
    app.use(express.json()); app.use((req,_res,next)=>{req.log={warn(){},error(){}}; next();});
    app.use('/api',router);
    server=app.listen(0,'127.0.0.1'); await new Promise(r=>server.once('listening',r));
    const base=`http://127.0.0.1:${server.address().port}/api`;
    const request=async(path,role='owner',method='GET',data,extra={})=>{
      const response=await realFetch(base+path,{method,redirect:'manual',headers:{'x-forwarded-host':'console.example.invalid',origin:'https://console.example.invalid','content-type':'application/json','x-fixture-role':role,...extra},body:data===undefined?undefined:JSON.stringify(data)});
      return {status:response.status,headers:response.headers,data:await response.json().catch(()=>null)};
    };
    assert.equal((await request('/internal/monitoring','anonymous')).status,401);
    let r=await request('/internal/monitoring','viewer');
    assert.equal(r.data.canManage,false);assert.equal(r.data.trackingEnabled,false);
    assert.equal(r.data.services[0].state,'not_configured');
    assert.equal(r.data.tags.measurementId,'G-YP31TW342Z','owner supplied ID is configuration only');
    assert.equal((await request('/internal/monitoring/google/start','editor','POST')).status,403);
    assert.equal((await request('/internal/monitoring/tags','viewer','PUT',{})).status,403);
    assert.equal((await request('/internal/monitoring/tags','owner','PUT',{measurementId:'G-ABCD1234',containerId:''},{origin:'https://evil.invalid'})).status,403);
    assert.equal((await request('/internal/monitoring/tags','owner','PUT',{measurementId:'<script>alert(1)</script>',containerId:''})).status,400);
    assert.equal((await request('/internal/monitoring/tags','owner','PUT',{measurementId:'G-ABCD1234',containerId:'GTM-ABCD1234'})).status,200);
    assert.equal((await getSettings()).measurementId,'G-ABCD1234');
    let dashboard=(await request('/internal/dashboard?start=2026-01-10&end=2026-01-10','viewer')).data;
    assert.equal(dashboard.operational.metrics[0].value,1);assert.equal(dashboard.dataMode,'synthetic');
    assert.equal(dashboard.operational.tables[0].rows[0].label,'Approvata');
    assert.equal(dashboard.ga4.state,'not_configured');
    assert.equal(calls.length,0,'no provider requests before OAuth setup');
    for(const key of ['MARENETTO_PRIVACY_APPROVED','MARENETTO_PROVIDERS_APPROVED','MARENETTO_TESTING_APPROVED'])process.env[key]='true';
    dashboard=(await request('/internal/dashboard?start=2026-01-10&end=2026-01-10')).data;
    assert.equal(dashboard.dataMode,'live');assert.equal(dashboard.operational.tables[1].rows[0].label,'produzione');
    for(const key of ['MARENETTO_PRIVACY_APPROVED','MARENETTO_PROVIDERS_APPROVED','MARENETTO_TESTING_APPROVED'])delete process.env[key];
    process.env.GOOGLE_ANALYTICS_CLIENT_ID='fixture-client';
    process.env.GOOGLE_ANALYTICS_CLIENT_SECRET='fixture-secret';
    process.env.GOOGLE_ANALYTICS_REDIRECT_URI='https://console.example.invalid/api/internal/monitoring/google/callback';
    process.env.MONITORING_TOKEN_KEY='a'.repeat(64);
    assert.ok(oauthConfig());
    for(const scopeMode of ['partialScopes','extraScopes']){
      mode=scopeMode;
      await assert.rejects(exchangeToken({grant_type:'refresh_token',refresh_token:'fixture-refresh'}),e=>e.state==='forbidden');
    }
    mode='ok';
    const encrypted=encryptTokens({refresh:'fixture-refresh',access:'fixture-access',expires:1});
    assert.ok(!encrypted.includes('fixture'));assert.equal(decryptTokens(encrypted).refresh,'fixture-refresh');
    assert.throws(()=>decryptTokens(encrypted,'production'));
    assert.throws(()=>decryptTokens(encrypted.slice(0,-3)+'bad'));
    const begin=async()=>{
      const result=await request('/internal/monitoring/google/start','owner','POST');
      assert.equal(result.status,200);
      const url=new URL(result.data.url);
      assert.equal(url.searchParams.get('scope'),scopes.join(' '));
      assert.equal(url.searchParams.get('code_challenge_method'),'S256');
      return {state:url.searchParams.get('state'),cookie:result.headers.get('set-cookie').split(';')[0],challenge:url.searchParams.get('code_challenge')};
    };
    let attempt=await begin();
    let [stored]=await db.select().from(states);
    assert.equal(stored.hash,hash(attempt.state));assert.equal(attempt.challenge,hash(stored.verifier));
    assert.equal((await request(`/internal/monitoring/google/callback?state=${attempt.state}&code=fixture`)).status,400);
    assert.equal((await request(`/internal/monitoring/google/callback?state=${attempt.state}&code=fixture`,'owner','GET',undefined,{cookie:attempt.cookie,'x-fixture-session':'other-session'})).status,400);
    await db.update(states).set({expiresAt:new Date(1)});
    assert.equal((await request(`/internal/monitoring/google/callback?state=${attempt.state}&code=fixture`,'owner','GET',undefined,{cookie:attempt.cookie})).status,400);
    attempt=await begin();
    r=await request(`/internal/monitoring/google/callback?state=${attempt.state}&error=access_denied`,'owner','GET',undefined,{cookie:attempt.cookie});
    assert.match(r.headers.get('location'),/cancelled$/);
    assert.equal((await request(`/internal/monitoring/google/callback?state=${attempt.state}&code=fixture`,'owner','GET',undefined,{cookie:attempt.cookie})).status,400);
    attempt=await begin();
    r=await request(`/internal/monitoring/google/callback?state=${attempt.state}&code=fixture`,'owner','GET',undefined,{cookie:attempt.cookie});
    assert.equal(r.status,303);assert.match(r.headers.get('location'),/connected$/);
    r=await request('/internal/monitoring','viewer');
    assert.equal(r.data.connected,true);
    assert.doesNotMatch(JSON.stringify(r.data),/fixture-refresh|fixture-secret|encryptedTokens|access_token/);
    assert.equal((await request('/internal/monitoring/properties/ga4','editor')).status,403);
    pagination=true;
    assert.equal((await listProperties('ga4','fixture-access')).length,2);
    pagination=false;
    assert.equal((await request('/internal/monitoring/properties/searchConsole')).data.length,1);
    assert.equal((await request('/internal/monitoring/properties/ga4','owner','PUT',{property:'properties/unauthorized'})).status,403);
    assert.equal((await request('/internal/monitoring/properties/ga4','owner','PUT',{property:'properties/123'})).status,200);
    assert.equal((await request('/internal/monitoring/properties/searchConsole','owner','PUT',{property:'sc-domain:example.invalid'})).status,200);
    assert.equal((await request('/internal/monitoring/verify/ga4','owner','POST')).status,200);
    assert.equal((await request('/internal/monitoring/verify/searchConsole','owner','POST')).status,200);
    const period=getPeriod({start:'2026-01-10',end:'2026-01-10'});
    let ga=await gaReport('properties/123','fixture-access',period);
    assert.equal(ga.metrics[0].value,100);assert.equal(ga.metrics[0].previous,50);
    assert.equal(ga.metrics[3].value,.4);assert.equal(ga.metrics[3].change,20);
    assert.equal(ga.timezone,'Europe/Rome');assert.ok(ga.limitations.some(v=>v.includes('soglie')));
    let sc=await searchReport('sc-domain:example.invalid','fixture-access',period);
    assert.equal(sc.metrics[2].value,.1);assert.equal(sc.metrics[3].value,3);
    mode='zero';
    ga=await gaReport('properties/123','fixture-access',period);
    assert.equal(ga.state,'ready');assert.equal(ga.metrics[0].value,0);assert.equal(ga.metrics[3].value,null,'zero sessions do not define an engagement denominator');
    mode='empty';
    ga=await gaReport('properties/123','fixture-access',period);assert.equal(ga.state,'empty');assert.equal(ga.metrics[0].value,null);
    sc=await searchReport('sc-domain:example.invalid','fixture-access',getPeriod({days:7}));assert.equal(sc.state,'delayed');
    mode='ok';
    await db.update(settings).set({encryptedTokens:encrypted});
    const before=refreshes;await Promise.all([accessToken(),accessToken(),accessToken()]);
    assert.equal(refreshes,before+1,'refresh serialized, credentials persisted');
    assert.equal((await getSettings()).encryptedTokens.includes('fixture'),false);
    let time=0, count=0;
    const cache=new ReportCache(()=>time);
    const value=await gaReport('properties/123','fixture-access',period);
    await Promise.all([cache.get('key',async()=>{count++;return value;}),cache.get('key',async()=>{count++;return value;})]);
    assert.equal(count,1);time+=16*60000;
    const stale=await cache.get('key',async()=>{throw new MonitoringError('quota','Quota Google esaurita.');});
    assert.equal(stale.state,'stale');assert.equal(stale.updatedAt,value.updatedAt);
    let retries=0;
    await cache.get('key',async()=>{retries++;return value;});
    assert.equal(retries,0,'quota backoff prevents duplicate retry');
    time+=6*60000;
    await assert.rejects(cache.get('key',async()=>{throw new MonitoringError('revoked','Autorizzazione revocata.');}),e=>e.state==='revoked');
    time+=2*60000;
    await cache.get('key',async()=>value);
    time+=25*3600000;
    await assert.rejects(cache.get('key',async()=>{throw new Error('private failure');}));
    for(const [m,state] of [['quota','quota'],['quota403','quota'],['forbidden','forbidden'],['revoked','revoked'],['timeout','unavailable']]){
      mode=m;await assert.rejects(googleJson('https://www.googleapis.com/webmasters/v3/sites'),e=>e.state===state&&!e.message.includes('private'));
    }
    mode='ok';reportCache.clear();
    dashboard=(await request('/internal/dashboard?start=2026-01-10&end=2026-01-10','editor')).data;
    assert.equal(dashboard.ga4.metrics[0].value,100);assert.equal(dashboard.searchConsole.metrics[0].value,10);
    assert.ok(!calls.some(c=>String(c.body).includes('fixture@example.invalid')),'no lead identities sent to Google');
    // A new settings read / cache instance represents process restart: persisted config remains.
    assert.equal((await getSettings()).ga4Property,'properties/123');
    const oldRevision=(await getSettings()).revision;
    await lockedSettings(async(tx,row)=>{await tx.update(settings).set({encryptedTokens:encrypted}).where(eq(settings.environment,row.environment));});
    mode='revoked';
    assert.equal((await request('/internal/monitoring/verify/ga4','owner','POST')).status,401);
    assert.equal((await request('/internal/monitoring')).data.services[0].state,'revoked');
    mode='ok';revokeOk=false;
    r=await request('/internal/monitoring/google/disconnect','owner','POST');
    assert.equal(r.status,200);assert.match(r.data.message,/non confermata/);
    assert.equal((await getSettings()).encryptedTokens,null);assert.notEqual((await getSettings()).revision,oldRevision);
    assert.equal((await getSettings()).ga4Property,null);
    assert.equal((await db.select().from(states)).length,0);
    dashboard=(await request('/internal/dashboard?start=2026-01-10&end=2026-01-10','viewer')).data;
    assert.equal(dashboard.ga4.state,'disconnected');
    assert.equal((await request('/internal/dashboard?start=2026-02-30&end=2026-03-01')).status,400);
    process.env.NODE_ENV='production';
    assert.equal((await getSettings()).encryptedTokens,null);
    assert.equal((await getSettings()).containerId,'','settings separated across environments');
  } finally {
    globalThis.fetch=realFetch;
    if(server)await new Promise(r=>server.close(r));
    await pool.end();
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.end();
  }
});
