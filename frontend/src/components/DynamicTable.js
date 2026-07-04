import React, { useState, useEffect, useRef } from 'react';
import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  BooleanField,
  TextInput,
  Create,
  SimpleForm,
  TextInput as RATextInput,
  SelectInput,
  useGetList,
  Toolbar,
  SaveButton,
  LinearProgress,
  Button,
  Box,
  Typography,
  Alert,
} from 'react-admin';
import MethodologyViewer from './MethodologyViewer';

/**
 * Кастомный тулбар с кнопками экспорта и загрузки
 */
const CustomToolbar = ({ resource }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleExport = () => {
    window.open(`/api/table/${resource}/export`, '_blank');
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/table/${resource}/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setUploadResult(result);
    } catch (error) {
      setUploadResult({ error: 'Ошибка загрузки файла' });
    } finally {
      setUploading(false);
      event.target.value = ''; // Сброс input
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
      <Button variant="outlined" onClick={handleExport}>
        📥 Экспорт CSV
      </Button>
      
      <Button
        variant="outlined"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? '⏳ Загрузка...' : '📤 Загрузить Excel'}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleUpload}
      />

      <MethodologyViewer resource={resource} />

      {uploadResult && (
        <Alert severity={uploadResult.error ? 'error' : 'success'} sx={{ ml: 2 }}>
          {uploadResult.error || `✓ ${uploadResult.message}`}
        </Alert>
      )}
    </Box>
  );
};

/**
 * Динамическая таблица на основе схемы
 */
const DynamicTable = ({ resource, schema }) => {
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    if (schema && schema.columns) {
      const generatedColumns = schema.columns.map(col => {
        const fieldProps = {
          source: col.name,
          label: col.name.replace(/_/g, ' ').toUpperCase(),
        };

        switch (col.type) {
          case 'number':
            return <NumberField {...fieldProps} key={col.name} />;
          case 'boolean':
            return <BooleanField {...fieldProps} key={col.name} />;
          case 'datetime':
            return <DateField {...fieldProps} key={col.name} showTime />;
          case 'text':
          default:
            return <TextField {...fieldProps} key={col.name} />;
        }
      });

      setColumns(generatedColumns);
    }
  }, [schema]);

  if (!schema) {
    return <LinearProgress />;
  }

  return (
    <List
      title={resource.toUpperCase()}
      filters={<TextInput source="q" label="Поиск" />}
      perPageOptions={[10, 20, 50, 100]}
      toolbar={<CustomToolbar resource={resource} />}
    >
      <Datagrid rowClick="edit">
        {columns}
      </Datagrid>
    </List>
  );
};

/**
 * Форма создания записи
 */
const DynamicCreate = ({ resource, schema }) => {
  if (!schema) {
    return <LinearProgress />;
  }

  const formFields = schema.columns
    .filter(col => !col.default || !col.default.includes('nextval')) // Исключаем автоинкремент
    .map(col => {
      const fieldProps = {
        source: col.name,
        label: col.name.replace(/_/g, ' ').toUpperCase(),
        fullWidth: true,
      };

      if (col.fk) {
        return (
          <SelectInput
            {...fieldProps}
            key={col.name}
            source={col.fk.table} // Используем связанную таблицу как источник
            choiceOrder={[]} // Загрузить из связанной таблицы
            optionText="name"
            optionValue="id"
          />
        );
      }

      switch (col.type) {
        case 'number':
          return <RATextInput {...fieldProps} type="number" key={col.name} />;
        case 'boolean':
          return <SelectInput {...fieldProps} choices={[
            { id: true, name: 'Да' },
            { id: false, name: 'Нет' }
          ]} key={col.name} />;
        case 'datetime':
          return <RATextInput {...fieldProps} type="datetime-local" key={col.name} />;
        case 'text':
        default:
          return <RATextInput {...fieldProps} key={col.name} />;
      }
    });

  return (
    <Create title={`Добавить в ${resource.toUpperCase()}`}>
      <SimpleForm>
        {formFields}
      </SimpleForm>
    </Create>
  );
};

export { DynamicTable, DynamicCreate };
