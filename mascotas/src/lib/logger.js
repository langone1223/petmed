export const logger = {
  info: (action, message, meta = {}) => {
    console.log(JSON.stringify({ level: 'INFO', timestamp: new Date().toISOString(), action, message, ...meta }));
  },
  warn: (action, message, meta = {}) => {
    console.warn(JSON.stringify({ level: 'WARN', timestamp: new Date().toISOString(), action, message, ...meta }));
  },
  error: (action, error, meta = {}) => {
    console.error(JSON.stringify({ 
      level: 'ERROR', 
      timestamp: new Date().toISOString(), 
      action, 
      error: error?.message || error, 
      stack: error?.stack,
      ...meta 
    }));
  }
};
