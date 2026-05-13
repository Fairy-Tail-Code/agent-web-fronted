import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { AgnoAgent } from '@ag-ui/agno';
import { CopilotRuntime } from '@copilotkit/runtime';
import { createCopilotExpressHandler } from '@copilotkit/runtime/v2/express';
import { SqliteAgentRunner } from '@copilotkit/sqlite-runner';
import { agentCatalog, getCatalogItem } from './catalog.js';

// 全局错误处理，防止进程意外退出
process.on('uncaughtException', (error) => {
  console.error('[adapter] Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[adapter] Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const port = Number(process.env.SERVICE_ADAPTER_PORT || 4000);
const dbPath =
  process.env.SERVICE_ADAPTER_SQLITE_PATH || path.resolve(process.cwd(), 'server', 'adapter', 'data', 'copilotkit-runtime.sqlite');

console.log('[adapter] Initializing with dbPath:', dbPath);
console.log('[adapter] SERVICE_BASE_URL:', process.env.SERVICE_BASE_URL);

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

let runner;
let sessionDb;
try {
  runner = new SqliteAgentRunner({ dbPath });
  sessionDb = new Database(dbPath);
  console.log('[adapter] SqliteAgentRunner created successfully');
} catch (error) {
  console.error('[adapter] Failed to create SqliteAgentRunner:', error);
  process.exit(1);
}

function initializeSessionSchema() {
  sessionDb.exec(`
    CREATE TABLE IF NOT EXISTS session_meta (
      thread_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      title_source TEXT NOT NULL DEFAULT 'auto',
      agent_id TEXT NOT NULL,
      agent_kind TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_session_meta_updated_at ON session_meta(updated_at DESC);
  `);

  try {
    sessionDb.exec(`ALTER TABLE session_meta ADD COLUMN title_source TEXT NOT NULL DEFAULT 'auto'`);
  } catch {
    // 列已存在时忽略
  }
}

initializeSessionSchema();

function getBaseUrl() {
  return (process.env.SERVICE_BASE_URL || 'http://localhost:8005').replace(/\/+$/, '');
}

function extractTextFromContent(content) {
  if (!content) {
    return '';
  }

  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        if (typeof parsed.content === 'string') {
          return parsed.content;
        }
      }
    } catch {
      // 非 JSON 字符串按普通文本处理
    }

    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map(part => {
        if (!part || typeof part !== 'object') {
          return '';
        }
        if (part.type === 'text' && typeof part.text === 'string') {
          return part.text;
        }
        return '';
      })
      .join(' ')
      .trim();
  }

  return '';
}

function sliceTitle(text) {
  const compact = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!compact) {
    return '未命名会话';
  }
  return compact.length > 36 ? `${compact.slice(0, 36)}...` : compact;
}

function deriveTitleFromMessages(messages, fallback) {
  const firstUserMessage = Array.isArray(messages)
    ? messages.find(message => message?.role === 'user' && extractTextFromContent(message.content).trim())
    : null;

  if (!firstUserMessage) {
    return fallback;
  }

  return sliceTitle(extractTextFromContent(firstUserMessage.content));
}

function toSessionRecord(row) {
  return {
    id: row.thread_id,
    title: row.title,
    agentId: row.agent_id,
    agentKind: row.agent_kind,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    messages: [],
  };
}

function ensureSessionMeta(threadId, agentId, agentKind, fallbackTitle) {
  const now = Date.now();
  const existing = sessionDb
    .prepare(
      `
        SELECT thread_id, title, title_source, agent_id, agent_kind, created_at, updated_at
        FROM session_meta
        WHERE thread_id = ?
      `
    )
    .get(threadId);

  if (!existing) {
    sessionDb
      .prepare(
        `
          INSERT INTO session_meta (thread_id, title, title_source, agent_id, agent_kind, created_at, updated_at)
          VALUES (?, ?, 'auto', ?, ?, ?, ?)
        `
      )
      .run(threadId, fallbackTitle, agentId, agentKind, now, now);
    return;
  }

  sessionDb
    .prepare(
      `
        UPDATE session_meta
        SET agent_id = ?, agent_kind = ?, updated_at = ?
        WHERE thread_id = ?
      `
    )
    .run(agentId, agentKind, now, threadId);
}

function updateSessionTitle(threadId, title) {
  if (!title || title === '未命名会话') {
    return;
  }

  const existing = sessionDb
    .prepare(`SELECT title_source FROM session_meta WHERE thread_id = ?`)
    .get(threadId);

  if (existing?.title_source === 'manual') {
    return;
  }

  sessionDb
    .prepare(
      `
        UPDATE session_meta
        SET title = ?, title_source = 'auto', updated_at = ?
        WHERE thread_id = ?
      `
    )
    .run(title, Date.now(), threadId);
}

function bootstrapSessionsFromRuns() {
  const rows = sessionDb
    .prepare(
      `
        SELECT latest.thread_id, latest.input AS latest_input, first_run.input AS first_input, first_run.created_at AS created_at, latest.created_at AS updated_at
        FROM (
          SELECT thread_id, MAX(created_at) AS latest_created_at
          FROM agent_runs
          GROUP BY thread_id
        ) latest_index
        JOIN agent_runs latest
          ON latest.thread_id = latest_index.thread_id
         AND latest.created_at = latest_index.latest_created_at
        JOIN (
          SELECT thread_id, MIN(created_at) AS first_created_at
          FROM agent_runs
          GROUP BY thread_id
        ) first_index
          ON first_index.thread_id = latest.thread_id
        JOIN agent_runs first_run
          ON first_run.thread_id = first_index.thread_id
         AND first_run.created_at = first_index.first_created_at
      `
    )
    .all();

  for (const row of rows) {
    const existing = sessionDb.prepare(`SELECT thread_id FROM session_meta WHERE thread_id = ?`).get(row.thread_id);
    if (existing) {
      continue;
    }

    const latestInput = JSON.parse(row.latest_input || '{}');
    const firstInput = JSON.parse(row.first_input || '{}');
    const agentId = String(latestInput?.forwardedProps?.agent_id || latestInput?.properties?.agent_id || 'data_agent');
    const agentKind = String(latestInput?.forwardedProps?.agent_kind || latestInput?.properties?.agent_kind || 'agent');
    const catalogItem = getCatalogItem(agentId);
    const title = deriveTitleFromMessages(firstInput?.messages, `${catalogItem.name} 会话`);

    sessionDb
      .prepare(
        `
          INSERT INTO session_meta (thread_id, title, title_source, agent_id, agent_kind, created_at, updated_at)
          VALUES (?, ?, 'auto', ?, ?, ?, ?)
        `
      )
      .run(row.thread_id, title, agentId, agentKind, row.created_at, row.updated_at);
  }
}

function listSessions() {
  bootstrapSessionsFromRuns();
  const rows = sessionDb
    .prepare(
      `
        SELECT thread_id, title, title_source, agent_id, agent_kind, created_at, updated_at
        FROM session_meta
        ORDER BY updated_at DESC, created_at DESC
      `
    )
    .all();

  return rows.map(toSessionRecord);
}

function readForwardedProps(req) {
  if (!req.body || typeof req.body !== 'object') {
    return {};
  }

  const forwardedProps = req.body.forwardedProps;
  if (!forwardedProps || typeof forwardedProps !== 'object') {
    return {};
  }

  return forwardedProps;
}

function resolveAgentSelection(req) {
  const forwardedProps = readForwardedProps(req);
  const headerAgentId = String(req.headers['x-agent-id'] || '').trim();
  const headerAgentKind = String(req.headers['x-agent-kind'] || '').trim();
  const payloadAgentId = String(forwardedProps.agent_id || '').trim();
  const payloadAgentKind = String(forwardedProps.agent_kind || '').trim();

  const selectedAgentId = payloadAgentId || headerAgentId;
  const catalogItem = getCatalogItem(selectedAgentId);

  const resolvedAgentId = selectedAgentId || catalogItem.id;
  const resolvedAgentKind = payloadAgentKind || headerAgentKind || catalogItem.kind;

  if (
    (headerAgentId && payloadAgentId && headerAgentId !== payloadAgentId) ||
    (headerAgentKind && payloadAgentKind && headerAgentKind !== payloadAgentKind)
  ) {
    console.warn('[adapter] Agent selection mismatch between headers and forwardedProps', {
      headers: { agentId: headerAgentId, agentKind: headerAgentKind },
      forwardedProps: { agentId: payloadAgentId, agentKind: payloadAgentKind },
      resolved: { agentId: resolvedAgentId, agentKind: resolvedAgentKind },
    });
  }

  return {
    resolvedAgentId,
    resolvedAgentKind,
    selectionSource: payloadAgentId || payloadAgentKind ? 'forwardedProps' : headerAgentId || headerAgentKind ? 'headers' : 'catalog-default',
  };
}

function createRuntimeHandler(req) {
  const { resolvedAgentId, resolvedAgentKind, selectionSource } = resolveAgentSelection(req);
  const resourcePath = resolvedAgentKind === 'team' ? 'teams' : 'agents';
  const agentUrl = `${getBaseUrl()}/${resourcePath}/${encodeURIComponent(resolvedAgentId)}/agui`;

  console.log(
    `[adapter] ${req.method} ${req.originalUrl} -> ${agentUrl} (runtimeAgent=agno_agent, selected=${resolvedAgentKind}:${resolvedAgentId}, source=${selectionSource}, auth=${req.headers.authorization ? 'present' : 'missing'})`
  );

  const runtime = new CopilotRuntime({
    agents: {
      agno_agent: new AgnoAgent({
        url: agentUrl,
        headers: {
          ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
          ...(resolvedAgentId ? { 'x-agent-id': resolvedAgentId } : {}),
          ...(resolvedAgentKind ? { 'x-agent-kind': resolvedAgentKind } : {}),
        },
      }),
    },
    runner,
  });

  return createCopilotExpressHandler({
    runtime: runtime.instance,
    basePath: '/',
    cors: false,
  });
}

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Agent-Id, X-Agent-Kind');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    backendBaseUrl: getBaseUrl(),
    sqlitePath: dbPath,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/config', (_req, res) => {
  res.json({
    appName: 'Agent Workbench',
    backendBaseUrl: getBaseUrl(),
    agents: agentCatalog,
  });
});

app.get('/api/sessions', (_req, res) => {
  res.json(listSessions());
});

app.post('/api/sessions/prepare', (req, res) => {
  const threadId = String(req.body?.threadId || '').trim();
  const agentId = String(req.body?.agentId || '').trim();
  const agentKind = String(req.body?.agentKind || '').trim() || 'agent';
  const fallbackTitle = String(req.body?.title || '').trim() || `${getCatalogItem(agentId).name} 会话`;

  if (!threadId) {
    res.status(400).json({ error: 'threadId is required' });
    return;
  }

  ensureSessionMeta(threadId, agentId || getCatalogItem().id, agentKind, fallbackTitle);
  const session = sessionDb.prepare(`SELECT * FROM session_meta WHERE thread_id = ?`).get(threadId);
  res.status(201).json(toSessionRecord(session));
});

app.patch('/api/sessions/:threadId', (req, res) => {
  const threadId = String(req.params.threadId || '').trim();
  const title = String(req.body?.title || '').trim();

  if (!threadId || !title) {
    res.status(400).json({ error: 'threadId and title are required' });
    return;
  }

  sessionDb
    .prepare(
      `
        UPDATE session_meta
        SET title = ?, title_source = 'manual', updated_at = ?
        WHERE thread_id = ?
      `
    )
    .run(title, Date.now(), threadId);

  const session = sessionDb.prepare(`SELECT * FROM session_meta WHERE thread_id = ?`).get(threadId);
  res.json(toSessionRecord(session));
});

app.delete('/api/sessions/:threadId', (req, res) => {
  const threadId = String(req.params.threadId || '').trim();
  if (!threadId) {
    res.status(400).json({ error: 'threadId is required' });
    return;
  }

  sessionDb.prepare(`DELETE FROM session_meta WHERE thread_id = ?`).run(threadId);
  sessionDb.prepare(`DELETE FROM run_state WHERE thread_id = ?`).run(threadId);
  sessionDb.prepare(`DELETE FROM agent_runs WHERE thread_id = ?`).run(threadId);
  res.status(204).end();
});

app.use('/agui', (req, res, next) => {
  console.log('[adapter] /agui middleware reached:', {
    method: req.method,
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl,
    headers: { 'x-agent-id': req.headers['x-agent-id'], 'x-agent-kind': req.headers['x-agent-kind'] },
    forwardedProps: readForwardedProps(req),
  });
  try {
    if (req.method === 'POST' && /\/agent\/[^/]+\/run$/.test(req.path)) {
      const forwardedProps = readForwardedProps(req);
      const threadId = String(req.body?.threadId || '').trim();
      const agentId = String(forwardedProps.agent_id || req.headers['x-agent-id'] || '').trim();
      const agentKind = String(forwardedProps.agent_kind || req.headers['x-agent-kind'] || '').trim() || 'agent';
      const fallbackTitle = `${getCatalogItem(agentId).name} 会话`;
      const derivedTitle = deriveTitleFromMessages(req.body?.messages, fallbackTitle);

      if (threadId) {
        ensureSessionMeta(threadId, agentId || getCatalogItem().id, agentKind, fallbackTitle);
        updateSessionTitle(threadId, derivedTitle);
      }
    }

    const handler = createRuntimeHandler(req);
    return handler(req, res, next);
  } catch (error) {
    console.error('Failed to handle /agui request:', error);
    next(error);
  }
});

const shutdown = () => {
  try {
    runner.close();
    sessionDb.close();
  } catch (error) {
    console.error('Failed to close runner:', error);
    process.exit(1);
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

app.listen(port, () => {
  console.log(`Agent adapter listening on http://localhost:${port}`);
  console.log('[adapter] Service is running and keeping process alive...');
});
