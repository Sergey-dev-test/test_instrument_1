const xss = require('xss');

/**
 * Санитизация строковых полей от XSS
 */
const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  return xss(value);
};

/**
 * Санитизация объекта (рекурсивно)
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

module.exports = { sanitizeString, sanitizeObject };
