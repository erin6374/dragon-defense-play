// Local QA with a preview server owned and closed by the same process.
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
const root=resolve('.');
const types={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
const server=createServer(async(req,res)=>{
 try{
  let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  if((await stat(file)).isDirectory())file=resolve(file,'index.html');
  res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');
  res.end(await readFile(file));
 }catch{res.writeHead(404).end();}
});
await new Promise((done,fail)=>{server.once('error',fail);server.listen(8767,'127.0.0.1',done);});
process.argv[2]='http://127.0.0.1:8767/';
try{console.log('Local preview ready:',(await fetch(process.argv[2])).status);await import('./browser.mjs');}
finally{await new Promise(done=>server.close(done));}
