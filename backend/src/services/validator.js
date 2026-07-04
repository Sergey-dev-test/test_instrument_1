const Joi = require('joi');

/**
 * Генерация схемы валидации для таблицы
 */
const generateValidationSchema = (tableSchema) => {
  const schema = {};
  
  tableSchema.columns.forEach(col => {
    const fieldSchema = {};
    
    if (col.type === 'number') {
      fieldSchema[Joi.number().integer()];
    } else if (col.type === 'text') {
      fieldSchema[Joi.string().max(col.maxLength || 255)];
    } else if (col.type === 'boolean') {
      fieldSchema[Joi.boolean()];
    } else if (col.type === 'datetime') {
      fieldSchema[Joi.date()];
    }
    
    if (!col.nullable) {
      fieldSchema.forbidden();
    }
    
    schema[col.name] = fieldSchema;
  });
  
  return Joi.object(schema);
};

/**
 * Валидация имени таблицы
 */
const validateTableName = (tableName) => {
  const schema = Joi.string().pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/);
  return schema.validate(tableName);
};

module.exports = { generateValidationSchema, validateTableName };
