/**
 * Генерация методики ведения таблицы
 */
const generateMethodology = (tableSchema) => {
  if (!tableSchema) return '';

  const lines = [];
  
  // Заголовок
  lines.push(`# Методика ведения таблицы: ${tableSchema.name}`);
  lines.push('');
  lines.push('## 1. Назначение таблицы');
  lines.push(`Таблица "${tableSchema.name}" предназначена для хранения справочных данных.`);
  lines.push('');
  
  // Структура полей
  lines.push('## 2. Структура полей');
  lines.push('');
  lines.push('| Поле | Тип | Обязательное | Описание |');
  lines.push('|------|-----|--------------|----------|');
  
  tableSchema.columns.forEach(col => {
    const isRequired = !col.nullable && !col.default?.includes('nextval');
    const typeDescription = getTypeDescription(col.type);
    const fkInfo = col.fk ? ` → ${col.fk.table}.${col.fk.column}` : '';
    const defaultInfo = col.default ? ` (по умолчанию: ${col.default})` : '';
    
    lines.push(`| ${col.name} | ${col.type}${fkInfo} | ${isRequired ? 'Да' : 'Нет'} | ${typeDescription}${defaultInfo} |`);
  });
  
  lines.push('');
  
  // Правила заполнения
  lines.push('## 3. Правила заполнения');
  lines.push('');
  
  // Обязательные поля
  const requiredFields = tableSchema.columns.filter(col => !col.nullable && !col.default?.includes('nextval'));
  if (requiredFields.length > 0) {
    lines.push('### 3.1. Обязательные поля');
    requiredFields.forEach(col => {
      lines.push(`- **${col.name}** - заполнение обязательно`);
    });
    lines.push('');
  }
  
  // Поля с внешними ключами
  const fkFields = tableSchema.columns.filter(col => col.fk);
  if (fkFields.length > 0) {
    lines.push('### 3.2. Связи с другими таблицами');
    fkFields.forEach(col => {
      lines.push(`- **${col.name}** - ссылка на таблицу "${col.fk.table}" (поле "${col.fk.column}")`);
    });
    lines.push('');
  }
  
  // Ограничения
  lines.push('### 3.3. Ограничения');
  lines.push('- ✅ Допускается добавление новых записей');
  lines.push('- ❌ Изменение существующих записей запрещено');
  lines.push('- ❌ Удаление существующих записей запрещено');
  lines.push('- 📥 Загрузка данных возможна через Excel (формат: первая строка - заголовки)');
  lines.push('');
  
  // Технические детали
  lines.push('## 4. Технические детали');
  lines.push('');
  lines.push(`- Всего полей: ${tableSchema.columns.length}`);
  lines.push(`- Текстовых полей: ${tableSchema.columns.filter(c => c.type === 'text').length}`);
  lines.push(`- Числовых полей: ${tableSchema.columns.filter(c => c.type === 'number').length}`);
  lines.push(`- Даты: ${tableSchema.columns.filter(c => c.type === 'datetime').length}`);
  lines.push(`- Связей (FK): ${fkFields.length}`);
  lines.push('');
  
  // Дата генерации
  lines.push(`---`);
  lines.push(`*Методика сгенерирована автоматически: ${new Date().toLocaleString('ru-RU')}*`);
  
  return lines.join('\n');
};

/**
 * Получение описания типа данных
 */
const getTypeDescription = (type) => {
  const descriptions = {
    text: 'Текстовое значение',
    number: 'Числовое значение',
    boolean: 'Логическое значение (Да/Нет)',
    datetime: 'Дата и время',
    json: 'JSON-данные'
  };
  return descriptions[type] || 'Значение';
};

module.exports = { generateMethodology };
