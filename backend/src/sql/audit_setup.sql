-- Таблица для аудита изменений
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(255) NOT NULL,
  action VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  user_name VARCHAR(255) DEFAULT current_user,
  changed_at TIMESTAMP DEFAULT NOW()
);

-- Индекс для быстрого поиска по таблице и дате
CREATE INDEX idx_audit_log_table_changed ON audit_log(table_name, changed_at);

-- Функция триггера аудита
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log(table_name, action, new_data, user_name, changed_at)
    VALUES (TG_TABLE_NAME, 'INSERT', row_to_json(NEW)::jsonb, current_user, now());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log(table_name, action, old_data, new_data, user_name, changed_at)
    VALUES (TG_TABLE_NAME, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, current_user, now());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log(table_name, action, old_data, user_name, changed_at)
    VALUES (TG_TABLE_NAME, 'DELETE', row_to_json(OLD)::jsonb, current_user, now());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Пример применения триггера к таблице (раскомментировать после создания таблицы)
-- CREATE TRIGGER audit_employees_trigger
-- AFTER INSERT OR UPDATE OR DELETE ON employees
-- FOR EACH ROW EXECUTE FUNCTION audit_trigger();
