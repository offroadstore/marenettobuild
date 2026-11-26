// Isolated browser-test fixture only; never an artifact's run command.
import { readFile, writeFile } from 'node:fs/promises';
import { editorialTopology } from './test-support/editorial-topology.mjs';
const snapshot=JSON.parse(await readFile('generated-artifacts/indexing-recovery/candidate-active.json','utf8'));
const fixture=await editorialTopology({snapshot,publicIndexing:true});
await writeFile('generated-artifacts/indexing-recovery/browser-fixture.json',JSON.stringify({origin:fixture.origin}));
console.log(`Isolated browser candidate: ${fixture.origin}`);
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await fixture.close();process.exit();});
