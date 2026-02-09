interface Migration {
  name: string
  sql: string
}

export function getMigrations(): Migration[] {
  return [
    {
      name: '001_initial',
      sql: `
        CREATE TABLE workspaces (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          base_url TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE collections (
          id TEXT PRIMARY KEY,
          workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
          parent_id TEXT REFERENCES collections(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT,
          sort_order INTEGER DEFAULT 0,
          is_auto_generated BOOLEAN DEFAULT false,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE requests (
          id TEXT PRIMARY KEY,
          collection_id TEXT REFERENCES collections(id) ON DELETE CASCADE,
          workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          method TEXT NOT NULL DEFAULT 'GET',
          url TEXT NOT NULL,
          headers TEXT DEFAULT '[]',
          query_params TEXT DEFAULT '[]',
          body_type TEXT,
          body_content TEXT,
          auth_type TEXT,
          auth_config TEXT,
          sort_order INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE request_history (
          id TEXT PRIMARY KEY,
          request_id TEXT REFERENCES requests(id) ON DELETE SET NULL,
          workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
          method TEXT NOT NULL,
          url TEXT NOT NULL,
          request_headers TEXT,
          request_body TEXT,
          status_code INTEGER,
          response_headers TEXT,
          response_body TEXT,
          response_size_bytes INTEGER,
          response_time_ms INTEGER,
          error_message TEXT,
          executed_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE environments (
          id TEXT PRIMARY KEY,
          workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          is_active BOOLEAN DEFAULT false,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE env_variables (
          id TEXT PRIMARY KEY,
          environment_id TEXT REFERENCES environments(id) ON DELETE CASCADE,
          key TEXT NOT NULL,
          value TEXT NOT NULL,
          is_secret BOOLEAN DEFAULT false,
          UNIQUE(environment_id, key)
        );

        CREATE INDEX idx_requests_workspace ON requests(workspace_id);
        CREATE INDEX idx_requests_collection ON requests(collection_id);
        CREATE INDEX idx_history_workspace ON request_history(workspace_id);
        CREATE INDEX idx_history_executed ON request_history(executed_at);
        CREATE INDEX idx_collections_workspace ON collections(workspace_id);
      `,
    },
    {
      name: '002_discovered_endpoints',
      sql: `
        CREATE TABLE discovered_endpoints (
          id TEXT PRIMARY KEY,
          workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
          path TEXT NOT NULL,
          method TEXT NOT NULL,
          summary TEXT,
          description TEXT,
          parameters TEXT,
          request_schema TEXT,
          response_schema TEXT,
          tags TEXT DEFAULT '[]',
          auth_required BOOLEAN DEFAULT false,
          deprecated BOOLEAN DEFAULT false,
          source TEXT NOT NULL,
          discovered_at TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX idx_discovered_workspace ON discovered_endpoints(workspace_id);
        CREATE INDEX idx_discovered_method ON discovered_endpoints(method);
      `,
    },
  ]
}
