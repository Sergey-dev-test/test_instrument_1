import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Modal,
  Box,
  CircularProgress,
  IconButton,
} from '@mui/material';

/**
 * Компонент отображения методики ведения таблицы
 */
const MethodologyViewer = ({ resource }) => {
  const [open, setOpen] = useState(false);
  const [methodology, setMethodology] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    
    try {
      const response = await fetch(`/api/table/${resource}/methodology`);
      if (response.ok) {
        const text = await response.text();
        setMethodology(text);
      }
    } catch (error) {
      console.error('Error loading methodology:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setMethodology('');
  };

  const handleDownload = () => {
    const blob = new Blob([methodology], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resource}_methodology.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button
        variant="outlined"
        onClick={handleOpen}
        sx={{ mb: 2 }}
      >
        📋 Методика
      </Button>

      <Modal open={open} onClose={handleClose}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          maxHeight: '80vh',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          overflow: 'auto',
        }}>
          <Typography variant="h6" gutterBottom>
            Методика ведения таблицы: {resource}
          </Typography>
          
          <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={handleDownload}>
              ⬇ Скачать Markdown
            </Button>
          </Box>

          {loading ? (
            <CircularProgress />
          ) : (
            <Box sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
              {methodology}
            </Box>
          )}
        </Box>
      </Modal>
    </>
  );
};

export default MethodologyViewer;
