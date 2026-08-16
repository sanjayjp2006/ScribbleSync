export interface Logger {
  readonly info: (message: string, metadata?: Readonly<Record<string, unknown>>) => void;
  readonly warn: (message: string, metadata?: Readonly<Record<string, unknown>>) => void;
  readonly error: (message: string, metadata?: Readonly<Record<string, unknown>>) => void;
}

const writeLog = (
  level: 'info' | 'warn' | 'error',
  message: string,
  metadata?: Readonly<Record<string, unknown>>
): void => {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(metadata === undefined ? {} : { metadata })
  };

  const serialized = JSON.stringify(payload);

  if (level === 'error') {
    console.error(serialized);
    return;
  }

  if (level === 'warn') {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
};

export const logger: Logger = {
  info: (message, metadata) => {
    writeLog('info', message, metadata);
  },
  warn: (message, metadata) => {
    writeLog('warn', message, metadata);
  },
  error: (message, metadata) => {
    writeLog('error', message, metadata);
  }
};
