export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'AUDIT' | 'PERF';

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  requestId?: string;
  correlationId?: string;
  userId?: string;
  action?: string;
  latencyMs?: number;
  statusCode?: number;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class StructuredLogger {
  private serviceName: string;

  constructor(serviceName = 'nexora-arena-backend') {
    this.serviceName = serviceName;
  }

  private write(entry: StructuredLogEntry) {
    const formatted = JSON.stringify(entry);
    if (entry.level === 'ERROR') {
      console.error(formatted);
    } else if (entry.level === 'WARN') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  info(message: string, context: Partial<StructuredLogEntry> = {}) {
    this.write({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: this.serviceName,
      message,
      ...context,
    });
  }

  warn(message: string, context: Partial<StructuredLogEntry> = {}) {
    this.write({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      service: this.serviceName,
      message,
      ...context,
    });
  }

  error(message: string, err?: Error | unknown, context: Partial<StructuredLogEntry> = {}) {
    let errorDetails: StructuredLogEntry['error'] = undefined;
    if (err instanceof Error) {
      errorDetails = {
        name: err.name,
        message: err.message,
        stack: err.stack,
      };
    } else if (typeof err === 'string') {
      errorDetails = { name: 'Error', message: err };
    }

    this.write({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: this.serviceName,
      message,
      error: errorDetails,
      ...context,
    });
  }

  audit(action: string, actorUserId: string, targetResource: string, metadata: Record<string, unknown> = {}) {
    this.write({
      timestamp: new Date().toISOString(),
      level: 'AUDIT',
      service: this.serviceName,
      message: `Audit Action: ${action} on ${targetResource}`,
      action,
      userId: actorUserId,
      metadata: { targetResource, ...metadata },
    });
  }

  perf(message: string, latencyMs: number, context: Partial<StructuredLogEntry> = {}) {
    this.write({
      timestamp: new Date().toISOString(),
      level: 'PERF',
      service: this.serviceName,
      message,
      latencyMs,
      ...context,
    });
  }
}

export const logger = new StructuredLogger();
