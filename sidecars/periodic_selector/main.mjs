import { execFile } from 'node:child_process';
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import http from 'node:http';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(__dirname, '..', '..');
const PLUGIN_JSON_PATH = join(PLUGIN_ROOT, 'plugin.json');
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
const LAST_UPDATED_FILE = join(DATA_DIR, 'last-updated.json');

const GITHUB_OWNER = 'trrrrrryg';
const GITHUB_REPO = 'antigravity-periodic-model-selector';
const REPO_SLUG = `${GITHUB_OWNER}/${GITHUB_REPO}`;
const RELEASES_PAGE_URL = `https://github.com/${REPO_SLUG}/releases`;
const UPDATE_CORE_FILES = [
  'plugin.json',
  'assets/logo.svg',
  'sidecars/periodic_selector/sidecar.json',
  'sidecars/periodic_selector/main.mjs',
  'sidecars/periodic_selector/inject.js',
];

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

function normalizeVersion(v) {
  return String(v || '').trim().replace(/^v/i, '');
}

function compareSemver(a, b) {
  const pa = normalizeVersion(a).split('-')[0].split('.').map((n) => Number.parseInt(n, 10) || 0);
  const pb = normalizeVersion(b).split('-')[0].split('.').map((n) => Number.parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length, 3);
  for (let i = 0; i < len; i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

function readLocalVersion() {
  try {
    if (existsSync(PLUGIN_JSON_PATH)) {
      const parsed = JSON.parse(readFileSync(PLUGIN_JSON_PATH, 'utf8'));
      if (parsed?.version) return normalizeVersion(parsed.version);
    }
  } catch {}
  return '1.0.0';
}

function summarizeReleaseNotes(body) {
  const clean = String(body || '')
    .replace(/\r\n/g, '\n')
    .replace(/^#+\s*/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .trim();
  if (!clean) return '包含最新功能优化与问题修复。';
  const lines = clean
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5);
  const joined = lines.join('\n');
  return joined.length > 260 ? `${joined.slice(0, 257)}...` : joined;
}

function consumeRecentUpdateMarker() {
  try {
    if (!existsSync(LAST_UPDATED_FILE)) return null;
    const raw = JSON.parse(readFileSync(LAST_UPDATED_FILE, 'utf8'));
    try { unlinkSync(LAST_UPDATED_FILE); } catch {}
    if (raw && Date.now() - Number(raw.at || 0) <= 30_000) {
      return { from: normalizeVersion(raw.from), to: normalizeVersion(raw.to), at: Number(raw.at) };
    }
  } catch {}
  return null;
}

const recentMarker = consumeRecentUpdateMarker();

const updateState = {
  repo: REPO_SLUG,
  currentVersion: readLocalVersion(),
  latestVersion: null,
  tagName: null,
  releaseName: '',
  releaseNotes: '',
  releaseUrl: RELEASES_PAGE_URL,
  assetZipUrl: null,
  zipballUrl: null,
  publishedAt: null,
  source: null,
  hasUpdate: false,
  deferred: false,
  status: 'idle', // 'idle' | 'checking' | 'available' | 'up-to-date' | 'updating' | 'updated' | 'error'
  progressText: '',
  error: null,
  checkedAt: 0,
  justUpdatedFrom: recentMarker?.from || null,
  justUpdatedTo: recentMarker?.to || null,
  justUpdatedAt: recentMarker?.at || 0,
};

function getPublicUpdateState() {
  const showBannerNotice =
    updateState.justUpdatedTo && Date.now() - Number(updateState.justUpdatedAt || 0) <= 25_000;
  return {
    repo: updateState.repo,
    currentVersion: updateState.currentVersion,
    latestVersion: updateState.latestVersion,
    tagName: updateState.tagName,
    releaseName: updateState.releaseName,
    releaseNotes: updateState.releaseNotes,
    releaseUrl: updateState.releaseUrl,
    publishedAt: updateState.publishedAt,
    source: updateState.source,
    hasUpdate: updateState.hasUpdate,
    deferred: updateState.deferred,
    status: updateState.status,
    progressText: updateState.progressText,
    error: updateState.error,
    checkedAt: updateState.checkedAt,
    justUpdatedFrom: showBannerNotice ? updateState.justUpdatedFrom : null,
    justUpdatedTo: showBannerNotice ? updateState.justUpdatedTo : null,
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

let checkInFlight = null;

async function checkForUpdates({ resetDeferred = false } = {}) {
  if (updateState.status === 'updating' || updateState.status === 'updated') {
    return getPublicUpdateState();
  }
  if (checkInFlight) return checkInFlight;

  checkInFlight = (async () => {
    updateState.currentVersion = readLocalVersion();
    if (resetDeferred) updateState.deferred = false;
    updateState.status = 'checking';
    updateState.error = null;

    let fetched = null;
    let lastErr = null;

    // 1. Primary: GitHub Releases API
    try {
      const res = await fetchWithTimeout(
        `https://api.github.com/repos/${REPO_SLUG}/releases/latest`,
        {
          headers: {
            Accept: 'application/vnd.github+json',
            'User-Agent': 'antigravity-periodic-model-selector',
          },
        },
        6000
      );
      if (!res.ok) throw new Error(`GitHub API HTTP ${res.status}`);
      const data = await res.json();
      const tagName = String(data.tag_name || '').trim();
      const latestVersion = normalizeVersion(tagName);
      if (!latestVersion) throw new Error('Release tag missing');
      const zipAsset = Array.isArray(data.assets)
        ? data.assets.find((a) => /\.zip$/i.test(String(a.name || '')) && a.browser_download_url)
        : null;
      fetched = {
        latestVersion,
        tagName,
        releaseName: String(data.name || tagName),
        releaseNotes: summarizeReleaseNotes(data.body || ''),
        releaseUrl: String(data.html_url || RELEASES_PAGE_URL),
        assetZipUrl: zipAsset ? String(zipAsset.browser_download_url) : null,
        zipballUrl:
          String(data.zipball_url || '') ||
          `https://github.com/${REPO_SLUG}/archive/refs/tags/${encodeURIComponent(tagName)}.zip`,
        publishedAt: data.published_at || null,
        source: 'github-release',
      };
    } catch (err) {
      lastErr = err;
    }

    // 2. Fallback: jsDelivr CDN / GitHub Raw plugin.json
    if (!fetched) {
      const fallbacks = [
        {
          source: 'jsdelivr',
          url: `https://cdn.jsdelivr.net/gh/${REPO_SLUG}@main/plugin.json?t=${Date.now()}`,
        },
        {
          source: 'github-raw',
          url: `https://raw.githubusercontent.com/${REPO_SLUG}/main/plugin.json?t=${Date.now()}`,
        },
      ];
      for (const fb of fallbacks) {
        try {
          const res = await fetchWithTimeout(
            fb.url,
            { headers: { 'User-Agent': 'antigravity-periodic-model-selector' } },
            5000
          );
          if (!res.ok) throw new Error(`${fb.source} HTTP ${res.status}`);
          const pkg = await res.json();
          const latestVersion = normalizeVersion(pkg?.version);
          if (!latestVersion) throw new Error('plugin.json version missing');
          const tagName = `v${latestVersion}`;
          fetched = {
            latestVersion,
            tagName,
            releaseName: `${tagName}`,
            releaseNotes: summarizeReleaseNotes(pkg?.releaseNotes || pkg?.description || ''),
            releaseUrl: RELEASES_PAGE_URL,
            assetZipUrl: `https://github.com/${REPO_SLUG}/releases/download/${tagName}/antigravity-periodic-model-selector-${tagName}.zip`,
            zipballUrl: `https://github.com/${REPO_SLUG}/archive/refs/heads/main.zip`,
            publishedAt: null,
            source: fb.source,
          };
          break;
        } catch (err) {
          lastErr = err;
        }
      }
    }

    updateState.checkedAt = Date.now();
    if (!fetched) {
      updateState.status = 'error';
      updateState.error = String(lastErr?.message || '检查更新失败，请检查网络连接');
      return getPublicUpdateState();
    }

    updateState.latestVersion = fetched.latestVersion;
    updateState.tagName = fetched.tagName;
    updateState.releaseName = fetched.releaseName;
    updateState.releaseNotes = fetched.releaseNotes;
    updateState.releaseUrl = fetched.releaseUrl;
    updateState.assetZipUrl = fetched.assetZipUrl;
    updateState.zipballUrl = fetched.zipballUrl;
    updateState.publishedAt = fetched.publishedAt;
    updateState.source = fetched.source;

    const isNewer = compareSemver(fetched.latestVersion, updateState.currentVersion) > 0;
    updateState.hasUpdate = isNewer;
    updateState.status = isNewer ? 'available' : 'up-to-date';
    return getPublicUpdateState();
  })().finally(() => {
    checkInFlight = null;
  });

  return checkInFlight;
}

function findPluginRootInDir(dir, depth = 0) {
  if (depth > 3 || !existsSync(dir)) return null;
  if (existsSync(join(dir, 'plugin.json'))) return dir;
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const ent of entries) {
    if (ent.isDirectory() && !ent.name.startsWith('.')) {
      const found = findPluginRootInDir(join(dir, ent.name), depth + 1);
      if (found) return found;
    }
  }
  return null;
}

async function extractZipFile(zipPath, destDir) {
  mkdirSync(destDir, { recursive: true });
  try {
    await execFileAsync('tar', ['-xf', zipPath, '-C', destDir], { timeout: 25_000, windowsHide: true });
    return;
  } catch {}
  if (process.platform === 'win32') {
    const psCmd = `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force`;
    await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psCmd], {
      timeout: 30_000,
      windowsHide: true,
    });
    return;
  }
  await execFileAsync('unzip', ['-o', zipPath, '-d', destDir], { timeout: 25_000 });
}

async function stageFromZip(stagingDir) {
  const candidates = [
    updateState.assetZipUrl,
    updateState.zipballUrl,
    updateState.tagName
      ? `https://github.com/${REPO_SLUG}/archive/refs/tags/${encodeURIComponent(updateState.tagName)}.zip`
      : null,
    `https://github.com/${REPO_SLUG}/archive/refs/heads/main.zip`,
  ].filter(Boolean);

  const uniqueUrls = [...new Set(candidates)];
  const zipPath = join(stagingDir, 'release.zip');
  const extractDir = join(stagingDir, 'extract');
  let lastErr = null;

  for (const url of uniqueUrls) {
    try {
      const res = await fetchWithTimeout(
        url,
        {
          redirect: 'follow',
          headers: { 'User-Agent': 'antigravity-periodic-model-selector' },
        },
        25_000
      );
      if (!res.ok) throw new Error(`下载失败 HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1024) throw new Error('下载的压缩包无效');
      writeFileSync(zipPath, buf);
      updateState.progressText = '正在解压并校验更新包...';
      rmSync(extractDir, { recursive: true, force: true });
      await extractZipFile(zipPath, extractDir);
      const foundRoot = findPluginRootInDir(extractDir);
      if (!foundRoot) throw new Error('压缩包中未找到 plugin.json');
      return foundRoot;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('压缩包下载失败');
}

async function stageFromCdn(stagingDir) {
  const cdnRoot = join(stagingDir, 'cdn');
  const refs = [updateState.tagName, 'main'].filter(Boolean);
  let lastErr = null;

  for (const ref of refs) {
    try {
      rmSync(cdnRoot, { recursive: true, force: true });
      for (const rel of UPDATE_CORE_FILES) {
        const urls = [
          `https://cdn.jsdelivr.net/gh/${REPO_SLUG}@${encodeURIComponent(ref)}/${rel}`,
          `https://raw.githubusercontent.com/${REPO_SLUG}/${encodeURIComponent(ref)}/${rel}`,
        ];
        let content = null;
        for (const u of urls) {
          try {
            const res = await fetchWithTimeout(
              u,
              { headers: { 'User-Agent': 'antigravity-periodic-model-selector' } },
              12_000
            );
            if (!res.ok) continue;
            content = Buffer.from(await res.arrayBuffer());
            if (content.length > 0) break;
          } catch {}
        }
        if (!content) throw new Error(`无法下载 ${rel}`);
        const dst = join(cdnRoot, ...rel.split('/'));
        mkdirSync(dirname(dst), { recursive: true });
        writeFileSync(dst, content);
      }
      return cdnRoot;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('CDN 文件下载失败');
}

function validateAndApplyStagedFiles(stagedRoot) {
  const pkgPath = join(stagedRoot, 'plugin.json');
  const mainPath = join(stagedRoot, 'sidecars', 'periodic_selector', 'main.mjs');
  const injectPath = join(stagedRoot, 'sidecars', 'periodic_selector', 'inject.js');

  if (!existsSync(pkgPath) || !existsSync(mainPath) || !existsSync(injectPath)) {
    throw new Error('更新包缺少核心插件文件');
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  if (!pkg?.version || pkg?.name !== 'antigravity-periodic-model-selector') {
    throw new Error('plugin.json 校验失败');
  }
  if (statSync(mainPath).size < 500 || statSync(injectPath).size < 500) {
    throw new Error('核心脚本文件大小异常');
  }

  for (const rel of UPDATE_CORE_FILES) {
    const src = join(stagedRoot, ...rel.split('/'));
    if (!existsSync(src)) continue;
    const dst = join(PLUGIN_ROOT, ...rel.split('/'));
    mkdirSync(dirname(dst), { recursive: true });
    const data = readFileSync(src);
    writeFileSync(dst, data);
  }

  return normalizeVersion(pkg.version);
}

let updateInFlight = null;

async function performDirectUpdate() {
  if (updateInFlight) return updateInFlight;

  updateInFlight = (async () => {
    const prevVersion = readLocalVersion();
    updateState.status = 'updating';
    updateState.error = null;
    updateState.deferred = false;
    updateState.progressText = '正在连接 GitHub 获取最新版本信息...';

    if (!updateState.latestVersion) {
      await checkForUpdates({ resetDeferred: true });
      updateState.status = 'updating';
      updateState.error = null;
    }

    const stagingDir = join(DATA_DIR, `update-staging-${Date.now()}`);
    try {
      let appliedVersion = null;

      // Fast path if installed via git clone with a clean working tree
      if (existsSync(join(PLUGIN_ROOT, '.git'))) {
        try {
          updateState.progressText = '正在通过 Git 拉取最新代码...';
          const { stdout } = await execFileAsync('git', ['-C', PLUGIN_ROOT, 'status', '--porcelain'], {
            timeout: 8000,
            windowsHide: true,
          });
          if (!stdout.trim()) {
            await execFileAsync('git', ['-C', PLUGIN_ROOT, 'pull', '--ff-only'], {
              timeout: 25_000,
              windowsHide: true,
            });
            const gitVer = readLocalVersion();
            if (compareSemver(gitVer, prevVersion) > 0) {
              appliedVersion = gitVer;
            }
          }
        } catch {}
      }

      if (!appliedVersion) {
        mkdirSync(stagingDir, { recursive: true });
        updateState.progressText = `正在下载 ${updateState.tagName || '最新版本'} 更新包...`;
        let stagedRoot = null;
        try {
          stagedRoot = await stageFromZip(stagingDir);
        } catch {
          updateState.progressText = '切换 CDN 备用源下载更新文件...';
          stagedRoot = await stageFromCdn(stagingDir);
        }

        updateState.progressText = '正在替换本地插件文件...';
        appliedVersion = validateAndApplyStagedFiles(stagedRoot);
      }

      try {
        mkdirSync(DATA_DIR, { recursive: true });
        writeFileSync(
          LAST_UPDATED_FILE,
          JSON.stringify({ from: prevVersion, to: appliedVersion, at: Date.now() })
        );
      } catch {}

      updateState.justUpdatedFrom = prevVersion;
      updateState.justUpdatedTo = appliedVersion;
      updateState.justUpdatedAt = Date.now();
      updateState.currentVersion = appliedVersion;
      updateState.hasUpdate = false;
      updateState.status = 'updated';
      updateState.progressText = `已成功更新至 v${appliedVersion}，正在重载插件...`;

      // Allow inject.js to display the completion state before restarting into the new sidecar
      setTimeout(() => {
        releaseOwnLock();
        if (cdpClient) cdpClient.close();
        try { server.close(); } catch {}
        process.exit(0);
      }, 1600);

      return getPublicUpdateState();
    } catch (err) {
      updateState.status = 'error';
      updateState.progressText = '';
      updateState.error = String(err?.message || '自动更新失败，请手动前往 GitHub 下载');
      return getPublicUpdateState();
    } finally {
      try { rmSync(stagingDir, { recursive: true, force: true }); } catch {}
    }
  })().finally(() => {
    updateInFlight = null;
  });

  return updateInFlight;
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

function readDevToolsPortFile() {
  const candidates = [
    process.env.APPDATA ? join(process.env.APPDATA, 'Antigravity', 'DevToolsActivePort') : '',
    process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'Antigravity', 'DevToolsActivePort') : '',
  ].filter(Boolean);

  for (const file of candidates) {
    try {
      if (!existsSync(file)) continue;
      const firstLine = readFileSync(file, 'utf8').split(/\r?\n/)[0].trim();
      if (/^\d+$/.test(firstLine)) return Number(firstLine);
    } catch {}
  }
  return null;
}

async function discoverTarget() {
  const ports = [];
  const filePort = readDevToolsPortFile();
  if (filePort) ports.push(filePort);
  for (const p of [9222, 9223, 9229]) {
    if (!ports.includes(p)) ports.push(p);
  }

  for (const port of ports) {
    try {
      const list = await fetchJson(`http://127.0.0.1:${port}/json/list`);
      if (!Array.isArray(list)) continue;
      const pages = list.filter((t) => {
        const u = String(t.url || '');
        return (
          t.type === 'page' &&
          t.webSocketDebuggerUrl &&
          !u.startsWith('devtools://') &&
          !u.startsWith('data:') &&
          u !== 'about:blank'
        );
      });
      const preferred =
        pages.find((t) => /^https?:\/\/127\.0\.0\.1:\d+\/c\//.test(String(t.url || ''))) ||
        pages.find((t) => /^https?:\/\/127\.0\.0\.1/.test(String(t.url || ''))) ||
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
  update: getPublicUpdateState(),
};

let cdpClient = null;
let currentTargetWs = '';

async function tick() {
  try {
    state.update = getPublicUpdateState();

    const target = await discoverTarget();
    if (!target) {
      if (cdpClient) {
        cdpClient.close();
        cdpClient = null;
        currentTargetWs = '';
      }
      state.cdpConnected = false;
      state.cdpPort = null;
      state.mounted = false;
      return 3000;
    }

    if (!cdpClient || cdpClient.dead || currentTargetWs !== target.wsUrl) {
      if (cdpClient) cdpClient.close();
      cdpClient = await CdpClient.connect(target.wsUrl);
      currentTargetWs = target.wsUrl;
    }
    state.cdpConnected = true;
    state.cdpPort = target.port;

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

    const updAction = await cdpClient.eval(
      'window.__AGY_PTABLE && window.__AGY_PTABLE.consumePendingUpdateAction ? window.__AGY_PTABLE.consumePendingUpdateAction() : null'
    );
    if (updAction === 'defer') {
      updateState.deferred = true;
    } else if (updAction === 'apply') {
      performDirectUpdate().catch(() => {});
    } else if (updAction === 'check') {
      checkForUpdates({ resetDeferred: true }).catch(() => {});
    }

    state.update = getPublicUpdateState();
    const payloadJson = JSON.stringify({ config: state.config, update: state.update });
    const res = await cdpClient.eval(
      `window.__AGY_PTABLE ? window.__AGY_PTABLE.update(${payloadJson}) : null`
    );
    if (res && typeof res === 'object') {
      state.installedVer = ver;
      state.mounted = !!res.ok;
      state.telemetry = res.telemetry || null;
    }

    const busyUpdating = updateState.status === 'updating' || updateState.status === 'updated';
    return busyUpdating ? 350 : 900;
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
  .badge.new { background: rgba(56,189,248,.18); color: #7DD3FC; }
  .badge.ok { background: rgba(16,185,129,.16); color: #6EE7B7; }
  .btns { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .btn { background: var(--well); color: var(--text); border: 1px solid var(--border); border-radius: 7px; padding: 5px 10px; font-size: 11.5px; cursor: pointer; }
  .btn.active, .btn.primary { border-color: #2F71E3; background: rgba(47,113,227,.18); color: #90B8FF; font-weight: 600; }
  .btn:disabled { opacity: .5; cursor: not-allowed; }
  .notes { margin-top: 8px; padding: 8px 10px; border-radius: 8px; background: var(--well); border: 1px solid var(--border); color: var(--muted); white-space: pre-wrap; font-size: 11.5px; line-height: 1.45; }
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
    <div class="row">
      <strong>版本与 GitHub 更新</strong>
      <span id="upd-badge" class="badge">检测中</span>
    </div>
    <div style="margin-top:8px; color:var(--muted);" id="upd-info">正在查询最新版本...</div>
    <div class="notes" id="upd-notes" style="display:none;"></div>
    <div class="btns">
      <button class="btn" id="btn-check-upd">重新检查更新</button>
      <button class="btn primary" id="btn-apply-upd" style="display:none;">直接更新</button>
    </div>
  </div>
  <div class="panel">
    <div class="row"><strong>当前已匹配的元素模型（动态识别，不写死接口）</strong></div>
    <div class="list" id="el-list"></div>
  </div>
<script>
async function refresh() {
  try {
    const res = await fetch('/api/state');
    const d = await res.json();
    document.getElementById('status').textContent = d.mounted ? ('已注入 v' + d.installedVer + ' (:' + d.cdpPort + ')') : '等待 Antigravity 窗口';
    const t = d.telemetry || {};
    document.getElementById('tier-info').textContent =
      '账户订阅: ' + (t.detectedTierName || '未检测') + ' (' + (t.detectedTierKind || 'auto') + ') · 当前生效模式: ' + (d.config?.tierOverride || 'auto');
    document.querySelectorAll('[data-tier]').forEach(b => b.classList.toggle('active', b.dataset.tier === (d.config?.tierOverride || 'auto')));

    const u = d.update || {};
    const badge = document.getElementById('upd-badge');
    const info = document.getElementById('upd-info');
    const notes = document.getElementById('upd-notes');
    const applyBtn = document.getElementById('btn-apply-upd');
    const checkBtn = document.getElementById('btn-check-upd');
    checkBtn.disabled = u.status === 'checking' || u.status === 'updating';

    if (u.status === 'updating') {
      badge.className = 'badge new';
      badge.textContent = '更新中';
      info.textContent = u.progressText || '正在下载并应用更新...';
      applyBtn.style.display = 'inline-block';
      applyBtn.disabled = true;
      applyBtn.textContent = '正在更新...';
    } else if (u.status === 'updated' || u.justUpdatedTo) {
      badge.className = 'badge ok';
      badge.textContent = '已更新';
      info.textContent = '当前版本 v' + (u.currentVersion || u.justUpdatedTo) + '（刚完成升级）';
      applyBtn.style.display = 'none';
    } else if (u.hasUpdate) {
      badge.className = 'badge new';
      badge.textContent = '有新版本 v' + u.latestVersion;
      info.textContent = '当前 v' + (u.currentVersion || '?') + ' → 最新 v' + u.latestVersion + (u.deferred ? '（本次已选择稍后更新）' : '');
      applyBtn.style.display = 'inline-block';
      applyBtn.disabled = false;
      applyBtn.textContent = '直接更新到 v' + u.latestVersion;
    } else if (u.status === 'error') {
      badge.className = 'badge';
      badge.textContent = '检查异常';
      info.textContent = '当前 v' + (u.currentVersion || '?') + ' · ' + (u.error || '无法连接 GitHub');
      applyBtn.style.display = 'none';
    } else {
      badge.className = 'badge ok';
      badge.textContent = u.status === 'checking' ? '检查中...' : ('已是最新 v' + (u.currentVersion || '1.0.0'));
      info.textContent = '当前版本 v' + (u.currentVersion || '1.0.0') + ' · 仓库 ' + (u.repo || '');
      applyBtn.style.display = 'none';
    }

    if (u.hasUpdate && u.releaseNotes) {
      notes.style.display = 'block';
      notes.textContent = u.releaseNotes;
    } else {
      notes.style.display = 'none';
    }

    const els = t.matchedElements || [];
    document.getElementById('el-list').innerHTML = els.map(e =>
      '<div class="item"><span><b>' + e.num + ' ' + e.symbol + ' (' + e.zh + ')</b> · ' + e.family + '</span><span style="color:var(--muted)">' + (e.available ? '可用 (' + e.variants + '档)' : e.reason || '不可用') + '</span></div>'
    ).join('') || '<div style="color:var(--muted)">暂未捕获模型列表</div>';
  } catch {}
}
document.querySelectorAll('[data-tier]').forEach(b => {
  b.onclick = async () => {
    await fetch('/api/config', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ tierOverride: b.dataset.tier }) });
    refresh();
  };
});
document.getElementById('btn-check-upd').onclick = async () => {
  await fetch('/api/update/check', { method: 'POST' });
  refresh();
};
document.getElementById('btn-apply-upd').onclick = async () => {
  await fetch('/api/update/apply', { method: 'POST' });
  refresh();
};
setInterval(refresh, 1200);
refresh();
</script>
</body>
</html>`;

const port = MY_PORT || 0;
const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  if (url === '/api/state') {
    state.update = getPublicUpdateState();
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(state));
    return;
  }
  if (url === '/api/update/check' && req.method === 'POST') {
    checkForUpdates({ resetDeferred: true }).then((u) => {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(u));
    });
    return;
  }
  if (url === '/api/update/defer' && req.method === 'POST') {
    updateState.deferred = true;
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(getPublicUpdateState()));
    return;
  }
  if (url === '/api/update/apply' && req.method === 'POST') {
    performDirectUpdate().catch(() => {});
    res.writeHead(202, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(getPublicUpdateState()));
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
  // Query GitHub for a new release automatically on every startup
  setTimeout(() => {
    checkForUpdates().catch(() => {});
  }, 600).unref();
  // Re-check periodically during long-running sessions (every 6 hours)
  setInterval(() => {
    checkForUpdates().catch(() => {});
  }, 6 * 3_600_000).unref();
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    releaseOwnLock();
    if (cdpClient) cdpClient.close();
    process.exit(0);
  });
}
process.on('exit', releaseOwnLock);
