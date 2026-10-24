declare module "@libsql/client" {
  export interface ClientConfig {
    url: string;
    authToken?: string;
  }

  export interface ResultSet {
    columns: string[];
    columnTypes: string[];
    rows: any[];
    rowsAffected: number;
    lastInsertRowid: bigint | undefined;
  }

  export interface InStatement {
    sql: string;
    args?: any[] | Record<string, any>;
  }

  export interface Client {
    execute(stmt: string | InStatement): Promise<ResultSet>;
    batch(stmts: (string | InStatement)[], mode?: string): Promise<ResultSet[]>;
    close(): void;
  }

  export function createClient(config: ClientConfig): Client;
}
