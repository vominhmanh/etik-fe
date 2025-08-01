import React, { useState, useEffect, FC } from 'react';
import Spreadsheet from 'react-spreadsheet';
import {
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Checkbox,
  Box,
  Typography
} from '@mui/material';

// Types
interface TicketCategory {
  id: number;
  name: string;
}

interface Show {
  id: number;
  name: string;
  ticketCategories: TicketCategory[];
}

interface Cell { value: string; }

interface EditableGridProps {
  shows?: Show[];
}

const EditableGrid: FC<EditableGridProps> = ({ shows = [] }) => {
  const makeEmpty = (cols: number): Cell[][] =>
    Array.from({ length: 8 }, () => Array.from({ length: cols }, () => ({ value: '' })));
  const makeSelEmpty = (cols: number): boolean[][] =>
    Array.from({ length: 8 }, () => Array.from({ length: cols }, () => false));

  const [sheets, setSheets] = useState<{
    name: string;
    headers: string[];
    data: Cell[][];
    saved: boolean;
  }[]>([]);

  const [selected, setSelected] = useState<boolean[][][]>([]);
  const [current, setCurrent] = useState<number>(0);

  useEffect(() => {
    if (shows.length) {
      const initSheets = shows.map(show => ({
        name: show.name,
        headers: show.ticketCategories.map(tc => tc.name),
        data: makeEmpty(show.ticketCategories.length),
        saved: false
      }));
      const initSel = shows.map(show => makeSelEmpty(show.ticketCategories.length));
      setSheets(initSheets);
      setSelected(initSel);
    }
  }, [shows]);

  const handleChange = (newData: Cell[][]) => {
    setSheets(prev => {
      const copy = [...prev];
      copy[current].data = newData;
      return copy;
    });
  };

  const handleSave = async () => {
    const sheet = sheets[current];
    // mark saved
    setSheets(prev => {
      const copy = [...prev];
      copy[current].saved = true;
      return copy;
    });
    // prepare payload
    const payload = {
      sheetName: sheet.name,
      data: sheet.data,
      // selected: selected[current]
    };
    try {
      const response = await fetch('/api/saveSheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Network response was not ok');
      // handle success if needed
      console.log('Sheet saved successfully');
    } catch (error) {
      console.error('Error saving sheet:', error);
    }
  };

  const toggleCell = (r: number, c: number) => {
    setSelected(prev => {
      const copy = prev.map(mat => mat.map(row => row.slice()));
      copy[current][r][c] = !copy[current][r][c];
      return copy;
    });
  };

  if (!sheets.length) return null;
  const active = sheets[current];

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {/* Tabs */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        {sheets.map((s, i) => (
          <Button
            key={s.name}
            variant={i === current ? 'contained' : 'outlined'}
            onClick={() => setCurrent(i)}
          >
            {s.name}
          </Button>
        ))}
      </Box>

      {/* Editor or Table */}
      {active.saved ? (
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {active.headers.map(h => (
                  <TableCell
                    key={h}
                    align="center"
                    sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap', p: 0.5 }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {active.data.map((rowArr, ri) => (
                <TableRow key={ri} hover>
                  {rowArr.map((cell, ci) => (
                    <TableCell
                      key={ci}
                      align="center"
                      sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap', p: 0.5 }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <Checkbox
                          checked={selected[current][ri][ci]}
                          onChange={() => toggleCell(ri, ci)}
                          size="small"
                        />
                        <Box>
                          <div>
                            {cell.value}
                          </div>
                          <div>
                            <small>Chưa check-in</small>
                          </div>

                        </Box>

                      </Box>

                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <Box sx={{ minWidth: `${active.headers.length * 120}px` }}>
            <Spreadsheet
              data={active.data}
              onChange={handleChange}
              showColumnLabels
              showRowLabels={false}
              columnLabels={active.headers}
            />
          </Box>
        </Box>
      )}

      {/* Save button below */}
      {!active.saved && (
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" fullWidth onClick={handleSave}>
            Lưu danh sách và gửi thông báo
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default EditableGrid;
