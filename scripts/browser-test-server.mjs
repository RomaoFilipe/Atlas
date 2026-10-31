import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
const directory=await mkdtemp(join(tmpdir(),'atlas-browser-'));
const child=spawn(process.execPath,['scripts/start.mjs'],{env:{...process.env,PORT:'31482',ATLAS_HOST:'127.0.0.1',ATLAS_DATA_DIR:directory},stdio:'inherit'});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',async code=>{await rm(directory,{recursive:true,force:true});process.exitCode=code||0;});
