// Uso: node measure.mjs <ancho> <alto> "<expresión JS>" [--shot salida.png] [--url http://127.0.0.1:5173/] [--reduce]
// Emula el viewport por CDP (sirve para <500px), espera fonts.ready, evalúa la expresión y opcionalmente captura página completa.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv.splice(i, 2)[1] : d; };
const shot = opt('--shot', null), url = opt('--url', 'http://127.0.0.1:5173/');
const reduceIdx = argv.indexOf('--reduce'); const reduce = reduceIdx >= 0; if (reduce) argv.splice(reduceIdx, 1);
const [w, h, expr = '1'] = [Number(argv[0]), Number(argv[1]), argv[2]];
const port = 9300 + (process.pid % 900);
const profile = mkdtempSync(join(tmpdir(), 'cdp-'));
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--window-size=1280,900', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 50 && !wsUrl; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); wsUrl = l.find(t => t.type === 'page')?.webSocketDebuggerUrl; } catch { await sleep(200); } }
if (!wsUrl) { chrome.kill(); throw new Error('Chrome no respondió por CDP'); }
const ws = new WebSocket(wsUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map(); const events = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } else if (m.method) events.push(m.method); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'error en la expresión'); return r.result?.result?.value; };
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 768 });
if (reduce) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await send('Page.navigate', { url });
for (let i = 0; i < 100 && !events.includes('Page.loadEventFired'); i++) await sleep(100);
await evalJs('document.fonts.ready.then(() => new Promise(r => setTimeout(r, 600)))');
const value = await evalJs(`(async () => (${expr}))()`);
console.log(JSON.stringify(value, null, 2));
if (shot) {
  const sh = await evalJs('document.documentElement.scrollHeight');
  const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: sh, scale: 1 } });
  const { writeFileSync } = await import('node:fs'); writeFileSync(shot, Buffer.from(r.result.data, 'base64'));
  console.error(`captura ${w}x${sh} -> ${shot}`);
}
ws.close(); chrome.kill(); await sleep(300); try { rmSync(profile, { recursive: true, force: true }); } catch {}
