import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import http from 'node:http';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INJECT_PATH = join(__dirname, 'inject.js');
const DATA_DIR = join(
  homedir(),
  '.gemini',
  'antigravity',
  'sidecar_data',
  'antigravity-periodic-model-selector'
);
const LOCK_FILE = join(DATA_DIR, 'sidecar.lock');
const CONFIG_FILE = join(DATA_DIR, 'config.json');

const MY_PORT = Number(process.env.ANTIGRAVITY_SIDECAR_WEB_PORT || 0);
const MY_LS = process.env.ANTIGRAVITY_LS_ADDRESS || '';

function lockPayload() {
  return JSON.stringify({ pid: process.pid, port: MY_PORT, ls: MY_LS, at: Date.now() });
}

function acquireSingletonLock() {
  mkdirSync(DATA_DIR, { recursive: true });
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const fd = openSync(LOCK_FILE, 'wx');
      writeFileSync(fd, lockPayload());
      closeSync(fd);
      return true;
    } catch (e) {
      if (e.code !== 'EEXIST') return true;
      try {
        const raw = JSON.parse(readFileSync(LOCK_FILE, 'utf8'));
        const holder = Number(raw.pid);
        const age = Date.now() - Number(raw.at || 0);
        let alive = false;
        try {
          process.kill(holder, 0);
          alive = true;
        } catch {}
        const sameSession =
          String(raw.ls || '') === MY_LS && Number(raw.port || 0) === MY_PORT;
        if (!alive || age > 30_000 || !sameSession) {
          if (alive && !sameSession && holder && holder !== process.pid) {
            try { process.kill(holder); } catch {}
          }
          try { unlinkSync(LOCK_FILE); } catch {}
          continue;
        }
        return false;
      } catch {
        try { unlinkSync(LOCK_FILE); } catch {}
      }
    }
  }
  return false;
}

function releaseOwnLock() {
  try {
    const raw = JSON.parse(readFileSync(LOCK_FILE, 'utf8'));
    if (Number(raw.pid) === process.pid) unlinkSync(LOCK_FILE);
  } catch {}
}

if (!acquireSingletonLock()) {
  process.exit(0);
}

setInterval(() => {
  try {
    writeFileSync(LOCK_FILE, lockPayload());
  } catch {}
}, 10_000).unref();

const DEFAULT_CONFIG = {
  tierOverride: 'auto', // 'auto' | 'free' | 'pro' | 'ultra'
  particleScale: 1,
  updatedAt: 0,
};

function sanitizeConfig(raw) {
  const tier = ['auto', 'free', 'pro', 'ultra'].includes(raw?.tierOverride) ? raw.tierOverride : 'auto';
  const scale = Number.isFinite(Number(raw?.particleScale))
    ? Math.max(0.5, Math.min(2, Number(raw.particleScale)))
    : 1;
  return {
    tierOverride: tier,
    particleScale: scale,
    updatedAt: Number(raw?.updatedAt || 0),
  };
}

function loadConfig() {
  try {
    if (existsSync(CONFIG_FILE)) {
      return sanitizeConfig(JSON.parse(readFileSync(CONFIG_FILE, 'utf8')));
    }
  } catch {}
  return { ...DEFAULT_CONFIG };
}

function saveConfig(patch) {
  const merged = sanitizeConfig({ ...loadConfig(), ...(patch || {}), updatedAt: Date.now() });
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2));
  } catch {}
  return merged;
}

let cachedInjectSrc = '';
let cachedInjectMtime = 0;
let cachedInjectVer = 1;

function loadInjectScript() {
  try {
    if (!existsSync(INJECT_PATH)) return { src: '', ver: 0 };
    const st = statSync(INJECT_PATH);
    if (st.mtimeMs !== cachedInjectMtime || !cachedInjectSrc) {
      cachedInjectSrc = readFileSync(INJECT_PATH, 'utf8');
      cachedInjectMtime = st.mtimeMs;
      const m = cachedInjectSrc.match(/const VER = (\d+)/);
      cachedInjectVer = m ? Number(m[1]) : 1;
    }
  } catch {}
  return { src: cachedInjectSrc, ver: cachedInjectVer };
}

class CdpClient {
  constructor(ws, url) {
    this.ws = ws;
    this.url = url;
    this.seq = 0;
    this.pending = new Map();
    this.dead = false;
  }

  static connect(wsUrl) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      const timer = setTimeout(() => {
        try { ws.close(); } catch {}
        reject(new Error('CDP timeout'));
      }, 6000);
      ws.addEventListener('open', () => {
        clearTimeout(timer);
        const client = new CdpClient(ws, wsUrl);
        ws.addEventListener('message', (ev) => {
          let msg;
          try { msg = JSON.parse(ev.data); } catch { return; }
          if (msg.id && client.pending.has(msg.id)) {
            const { resolve: res, reject: rej, t } = client.pending.get(msg.id);
            client.pending.delete(msg.id);
            clearTimeout(t);
            if (msg.error) rej(new Error(msg.error.message || 'CDP error'));
            else res(msg.result);
          }
        });
        ws.addEventListener('close', () => client.cleanup());
        ws.addEventListener('error', () => client.cleanup());
        resolve(client);
      });
      ws.addEventListener('error', (e) => {
        clearTimeout(timer);
        reject(e?.error || new Error('CDP connect failed'));
      });
    });
  }

  cleanup() {
    this.dead = true;
    for (const { reject, t } of this.pending.values()) {
      clearTimeout(t);
      reject(new Error('CDP closed'));
    }
    this.pending.clear();
  }

  send(method, params = {}) {
    if (this.dead) return Promise.reject(new Error('CDP dead'));
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, 5000);
      this.pending.set(id, { resolve, reject, t });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
    });
    if (res?.exceptionDetails) {
      throw new Error(res.exceptionDetails.text || 'Eval exception');
    }
    return res?.result?.value;
  }

  close() {
    this.cleanup();
    try { this.ws.close(); } catch {}
  }
}

async function fetchJson(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 1800);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function discoverTarget() {
  for (const port of [9222, 9223, 9229]) {
    try {
      const list = await fetchJson(`http://127.0.0.1:${port}/json/list`);
      if (!Array.isArray(list)) continue;
      const pages = list.filter(
        (t) => t.type === 'page' && t.webSocketDebuggerUrl && !String(t.url || '').startsWith('devtools://')
      );
      const preferred =
        pages.find((t) => String(t.url || '').includes('127.0.0.1') && String(t.title || '').includes('Antigravity')) ||
        pages.find((t) => String(t.title || '').includes('Antigravity')) ||
        pages[0];
      if (preferred) return { port, wsUrl: preferred.webSocketDebuggerUrl };
    } catch {}
  }
  return null;
}

const state = {
  cdpConnected: false,
  cdpPort: null,
  installedVer: 0,
  mounted: false,
  telemetry: null,
  config: loadConfig(),
};

let cdpClient = null;
let currentTargetWs = '';

async function tick() {
  try {
    if (!cdpClient || cdpClient.dead) {
      const target = await discoverTarget();
      if (!target) {
        state.cdpConnected = false;
        state.mounted = false;
        return 3000;
      }
      if (cdpClient) cdpClient.close();
      cdpClient = await CdpClient.connect(target.wsUrl);
      currentTargetWs = target.wsUrl;
      state.cdpConnected = true;
      state.cdpPort = target.port;
    }

    const { src, ver } = loadInjectScript();
    if (!src) return 2000;

    const aliveVer = await cdpClient.eval('window.__AGY_PTABLE ? window.__AGY_PTABLE.ver : 0');
    if (aliveVer !== ver) {
      await cdpClient.eval(src);
    }

    const cfgPatch = await cdpClient.eval(
      'window.__AGY_PTABLE && window.__AGY_PTABLE.consumePendingConfig ? window.__AGY_PTABLE.consumePendingConfig() : null'
    );
    if (cfgPatch && typeof cfgPatch === 'object') {
      state.config = saveConfig(cfgPatch);
    }

    const payloadJson = JSON.stringify({ config: state.config });
    const res = await cdpClient.eval(
      `window.__AGY_PTABLE ? window.__AGY_PTABLE.update(${payloadJson}) : null`
    );
    if (res && typeof res === 'object') {
      state.installedVer = ver;
      state.mounted = !!res.ok;
      state.telemetry = res.telemetry || null;
    }
    return 1000;
  } catch {
    if (cdpClient) {
      cdpClient.close();
      cdpClient = null;
      currentTargetWs = '';
    }
    state.cdpConnected = false;
    state.mounted = false;
    return 3000;
  }
}

async function runLoop() {
  for (;;) {
    const delay = await tick();
    await new Promise((r) => setTimeout(r, delay));
  }
}

const AUX_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Periodic Model Selector</title>
<script src="/preload.js"></script>
<style>
  :root { --bg: #0D0D11; --card: #121216; --well: #17171B; --border: rgba(255,255,255,.08); --text: #EAEBF1; --muted: #8E909A; --accent: #2F71E3; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 14px; background: var(--bg); color: var(--text); font-family: "Google Sans Flex", system-ui, "Microsoft YaHei", sans-serif; font-size: 12.5px; }
  .panel { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 14px; margin-bottom: 10px; }
  .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .badge { font-size: 10.5px; padding: 2px 8px; border-radius: 6px; background: rgba(47,113,227,.16); color: #70A4FF; font-weight: 600; }
  .btns { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .btn { background: var(--well); color: var(--text); border: 1px solid var(--border); border-radius: 7px; padding: 5px 10px; font-size: 11.5px; cursor: pointer; }
  .btn.active { border-color: #2F71E3; background: rgba(47,113,227,.18); color: #90B8FF; font-weight: 600; }
  .list { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
  .item { background: var(--well); border: 1px solid var(--border); border-radius: 8px; padding: 7px 10px; display: flex; justify-content: space-between; align-items: center; }
</style>
</head>
<body>
  <div class="panel">
    <div class="row">
      <strong>元素周期表模型选择器</strong>
      <span id="status" class="badge">加载中</span>
    </div>
    <div style="margin-top:8px; color:var(--muted);" id="tier-info">正在检测账户订阅状态...</div>
    <div class="btns" id="tier-btns">
      <button class="btn" data-tier="auto">自动识别 (实际订阅)</button>
      <button class="btn" data-tier="free">模拟 Free 免费版</button>
      <button class="btn" data-tier="pro">模拟 Pro 版</button>
      <button class="btn" data-tier="ultra">模拟 Ultra 版</button>
    </div>
  </div>
  <div class="panel">
    <div class="row"><strong>当前已匹配的元素模型（动态识别，不写死接口）</strong></div>
    <div class="list" id="el-list"></div>
  </div>
<script>
async function refresh() {
  const res = await fetch('/api/state');
  const d = await res.json();
  document.getElementById('status').textContent = d.mounted ? ('已注入 v' + d.installedVer + ' (:' + d.cdpPort + ')') : '等待 Antigravity 窗口';
  const t = d.telemetry || {};
  document.getElementById('tier-info').textContent =
    '账户订阅: ' + (t.detectedTierName || '未检测') + ' (' + (t.detectedTierKind || 'auto') + ') · 当前生效模式: ' + (d.config?.tierOverride || 'auto');
  document.querySelectorAll('[data-tier]').forEach(b => b.classList.toggle('active', b.dataset.tier === (d.config?.tierOverride || 'auto')));
  const els = t.matchedElements || [];
  document.getElementById('el-list').innerHTML = els.map(e =>
    '<div class="item"><span><b>' + e.num + ' ' + e.symbol + ' (' + e.zh + ')</b> · ' + e.family + '</span><span style="color:var(--muted)">' + (e.available ? '可用 (' + e.variants + '档)' : e.reason || '不可用') + '</span></div>'
  ).join('') || '<div style="color:var(--muted)">暂未捕获模型列表</div>';
}
document.querySelectorAll('[data-tier]').forEach(b => {
  b.onclick = async () => {
    await fetch('/api/config', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ tierOverride: b.dataset.tier }) });
    refresh();
  };
});
setInterval(refresh, 1500);
refresh();
</script>
</body>
</html>`;

const port = MY_PORT || 0;
const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  if (url === '/api/state') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(state));
    return;
  }
  if (url === '/api/config' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      try {
        const patch = JSON.parse(body || '{}');
        state.config = saveConfig(patch);
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(state.config));
      } catch (e) {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }
  if (url === '/preload.js') {
    res.writeHead(200, { 'content-type': 'application/javascript; charset=utf-8' });
    res.end('window.__AGY_PTABLE_AUX = true;');
    return;
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(AUX_HTML);
});

server.listen(port, '127.0.0.1', () => {
  runLoop();
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    releaseOwnLock();
    if (cdpClient) cdpClient.close();
    process.exit(0);
  });
}
process.on('exit', releaseOwnLock);
