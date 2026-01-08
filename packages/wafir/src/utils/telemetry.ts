export interface BrowserInfo {
  userAgent: string;
  viewportWidth: number;
  viewportHeight: number;
  language: string;
  url: string;
}

export function getBrowserInfo(): BrowserInfo {
  return {
    userAgent: navigator.userAgent,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    language: navigator.language,
    url: window.location.href,
  };
}

export interface ConsoleLog {
  type: "warn" | "error";
  message: string;
  timestamp: string;
}

class ConsoleInterceptor {
  private logs: ConsoleLog[] = [];
  private maxLogs = 50;
  private originalWarn = console.warn;
  private originalError = console.error;

  constructor() {
    this.setupInterceptor();
  }

  private setupInterceptor() {
    console.warn = (...args: any[]) => {
      this.addLog("warn", args);
      this.originalWarn.apply(console, args);
    };

    console.error = (...args: any[]) => {
      this.addLog("error", args);
      this.originalError.apply(console, args);
    };
  }

  private addLog(type: "warn" | "error", args: any[]) {
    const message = args
      .map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg) : String(arg)
      )
      .join(" ")
      .trim();

    this.logs.push({
      type,
      message,
      timestamp: new Date().toISOString(),
    });

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  getLogs(): ConsoleLog[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
  }
}

export const consoleInterceptor = new ConsoleInterceptor();
