export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  args?: any[];
}

export class Logger {
  private static buffer: LogEntry[] = [];
  private static MAX_BUFFER_SIZE = 100;

  private static log(level: LogLevel, message: string, ...args: any[]) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      args: args.length > 0 ? args : undefined,
    };

    // Add to buffer (rolling window)
    this.buffer.push(entry);
    if (this.buffer.length > this.MAX_BUFFER_SIZE) {
      this.buffer.shift();
    }

    // Log to console in development
    const formattedArgs = args.length > 0 ? JSON.stringify(args) : '';
    const output = `[${entry.timestamp}] [${level}] ${message} ${formattedArgs}`;
    
    switch (level) {
      case 'DEBUG':
        console.log(output);
        break;
      case 'INFO':
        console.info(output);
        break;
      case 'WARN':
        console.warn(output);
        break;
      case 'ERROR':
        console.error(output);
        break;
    }
  }

  static debug(message: string, ...args: any[]) {
    this.log('DEBUG', message, ...args);
  }

  static info(message: string, ...args: any[]) {
    this.log('INFO', message, ...args);
  }

  static warn(message: string, ...args: any[]) {
    this.log('WARN', message, ...args);
  }

  static error(message: string, error?: any, ...args: any[]) {
    this.log('ERROR', message, error, ...args);
  }

  static getLogs(): LogEntry[] {
    return [...this.buffer];
  }

  static clearLogs() {
    this.buffer = [];
  }
}
