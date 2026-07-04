import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';

/**
 * Отображение схемы таблицы
 */
const TableSchema = ({ schema }) => {
  if (!schema) {
    return <Typography>Загрузка схемы...</Typography>;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Схема таблицы: {schema.name}
        </Typography>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Поле</TableCell>
                <TableCell>Тип</TableCell>
                <TableCell>Nullable</TableCell>
                <TableCell>Default</TableCell>
                <TableCell>FK</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schema.columns.map((col) => (
                <TableRow key={col.name}>
                  <TableCell>{col.name}</TableCell>
                  <TableCell>{col.type}</TableCell>
                  <TableCell>
                    <Chip
                      label={col.nullable ? 'Да' : 'Нет'}
                      color={col.nullable ? 'default' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{col.default || '-'}</TableCell>
                  <TableCell>
                    {col.fk ? (
                      <Chip label={`${col.fk.table}.${col.fk.column}`} size="small" />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default TableSchema;
