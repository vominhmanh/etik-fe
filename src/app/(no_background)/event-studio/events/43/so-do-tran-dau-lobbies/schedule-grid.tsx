import React, { useState, useEffect, FC, useRef } from 'react';
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
  Typography,
  Backdrop,
  CircularProgress
} from '@mui/material';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import NotificationContext from '@/contexts/notification-context';
import { AxiosResponse } from 'axios';
import { green, red } from '@mui/material/colors';

// Types
interface TicketCategoryOfShow {
  id: number;
  name: string;
}

interface ShowFromEvent {
  id: number;
  name: string;
  ticketCategories: TicketCategoryOfShow[];
}

interface SheetDTO {
  id: number;
  showId: number;
  name: string | null;
  userList: Cell[][];
  saved: boolean;
  // ...other fields if needed
}

interface DraftSheetDTO {
  name: string;
  showId: number;
  headers: string[];
  headerIds: number[];
  userList: Cell[][];
  saved: boolean;
}
interface Cell { value: string; ticketHolder: string; ticketCheckIn: boolean }

interface Show {
  id: number;
  eventId: number;
  name: string;
}

interface TicketCategory {
  id: number;
  name: string;
  show: Show;
}

interface Transaction {
  id: number;
  email: string;
  name: string;
  address: string;
  phoneNumber: string;
  status: string;
  paymentStatus: string;
  exportedTicketAt?: string | null; // ISO date string or null
  cancelRequestStatus: string | null;
}

interface TransactionTicketCategory {
  netPricePerOne: number;
  ticketCategory: TicketCategory;
  transaction: Transaction;
}

export interface Ticket {
  id: number;
  transactionId: number;
  createdAt: string; // ISO date string
  ticketCategoryId: number;
  holder: string;
  checkInAt?: string | null; // ISO date string or null
  transactionTicketCategory: TransactionTicketCategory;
}


interface EditableGridProps {
  shows?: ShowFromEvent[];
}

const EditableGrid: FC<EditableGridProps> = ({ shows = [] }) => {
  const eventId = 43
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [sheets, setSheets] = useState<DraftSheetDTO[]>([]);

  const [selected, setSelected] = useState<boolean[][][]>([]);
  const [current, setCurrent] = useState<number>(0);
  const ticketPollRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (newuserList: Cell[][]) => {
    setSheets(prev => {
      const copy = [...prev];
      copy[current].userList = newuserList;
      return copy;
    });
  };

  // helpers
  const makeEmpty = (cols: number): Cell[][] =>
    Array.from({ length: 4 }, () =>
      Array.from({ length: cols }, () => ({ value: '', ticketHolder: '', ticketCheckIn: false }))
    );

  const makeSelEmpty = (cols: number): boolean[][] =>
    Array.from({ length: 4 }, () => Array.from({ length: cols }, () => false));

  function enrichSheetsWithTickets(
    baseSheets: DraftSheetDTO[],
    tickets: Ticket[]
  ) {
    return baseSheets.map((sheet) => {
      if (!sheet.saved) return sheet;
      const relevant = tickets.filter(
        (t) => t.transactionTicketCategory.ticketCategory.show.id === sheet.showId
      );
      const newList = sheet.userList.map((row) =>
        row.map((cell) => {
          const addr = cell.value.replace(/^0+/, '');
          const match = relevant.find(
            (t) => t.transactionTicketCategory.transaction.address.replace(/^0+/, '') === addr
          );
          return match
            ? {
              ...cell,
              ticketHolder: match.holder,
              ticketCheckIn: Boolean(match.checkInAt),
            }
            : cell;
        })
      );
      return { ...sheet, userList: newList };
    });
  }

  // combined load sheets + tickets
  const loadAll = async () => {
    if (!shows.length) return;
    // setIsLoading(true);
    try {
      const showIds = shows.map((s) => s.id);
      const [sheetRes, ticketRes]: [AxiosResponse<SheetDTO[]>, AxiosResponse<Ticket[]>] =
        await Promise.all([
          baseHttpServiceInstance.get(
            `/special_events/tft-2025/sheets`,
            { params: { showIds } }
          ) as Promise<AxiosResponse<SheetDTO[]>>,
          baseHttpServiceInstance.get(
            `/special_events/tft-2025/tickets`,
            { params: { eventId } }
          ) as Promise<AxiosResponse<Ticket[]>>,
        ]);

      // init
      const initSheets: DraftSheetDTO[] = shows.map((show) => ({
        name: show.name,
        showId: show.id,
        headers: show.ticketCategories.map((tc) => tc.name),
        headerIds: show.ticketCategories.map((tc) => tc.id),
        userList: makeEmpty(show.ticketCategories.length),
        saved: false,
      }));
      const initSelected: boolean[][][] = shows.map((show) => makeSelEmpty(show.ticketCategories.length));
      setSheets(initSheets);
      setSelected(initSelected);

      // merge saved
      const merged = initSheets.map((draft) => {
        const found = sheetRes.data.find((sh) => sh.showId === draft.showId);
        if (!found) return draft;
        const title = found.name?.trim() ? found.name : draft.name;
        return {
          ...draft,
          name: title,
          userList: found.userList,
          saved: found.saved,
        };
      });

      // enrich with tickets
      const enriched = enrichSheetsWithTickets(merged, ticketRes.data);
      setSheets(enriched);
    } catch (err) {
      console.error(err);
      notificationCtx.error('Lấy dữ liệu thất bại');
    } finally {
      // setIsLoading(false);
    }
  };

  // fetch tickets only
  const fetchTickets = async () => {
    try {
      loadAll()
    } catch (err) {
      console.error('Ticket fetch failed', err);
    }
  };


  // Save handler: immediate ticket refresh only
  const handleSave = async () => {
    const confirmText =
      'Sau khi lưu, bạn sẽ không thể chỉnh sửa nữa, bạn có chắc chắn?';
    if (!window.confirm(confirmText)) return;

    const sheet = sheets[current];

    // pad non-empty values to 3 digits for both state update and payload
    const paddedList: Cell[][] = sheet.userList.map(row =>
      row.map(cell => ({
        ...cell,
        value: cell.value.trim().length > 0 ? cell.value.toString().padStart(3, '0') : cell.value,
      }))
    );

    const payload = {
      sheetName: sheet.name,
      headerIds: sheet.headerIds,
      headers: sheet.headers,
      showId: sheet.showId,
      userList: paddedList,
      checkList: selected[current],
    };

    try {
      await baseHttpServiceInstance.post(
        '/special_events/tft-2025/save-sheet',
        payload
      );
      notificationCtx.success('Đã lưu thành công');

      // update local state: mark saved & replace userList with padded values
      setSheets(prev => {
        const copy = [...prev];
        copy[current] = { ...copy[current], userList: paddedList, saved: true };
        return copy;
      });

      // immediately refresh tickets
      fetchTickets();
    } catch (error) {
      notificationCtx.error(error as any);
    }
  };

  // cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (ticketPollRef.current) clearInterval(ticketPollRef.current);
    };
  }, []);


  useEffect(() => {
    if (shows.length === 0) return;

    // 1) Build your “empty” drafts for each show
    const initSheets: DraftSheetDTO[] = shows.map((show) => ({
      name: show.name,
      showId: show.id,
      headers: show.ticketCategories.map((tc) => tc.name),
      headerIds: show.ticketCategories.map((tc) => tc.id),
      userList: makeEmpty(show.ticketCategories.length),
      saved: false,
    }));

    // 2) Build the matching “empty” selected-cells matrix for each sheet
    //    so that selected[i][r][c] exists for every show i, row r, col c.
    const initSelected: boolean[][][] = shows.map((show) =>
      makeSelEmpty(show.ticketCategories.length)
    );

    // 3) Push them into state immediately so your grid can render safely
    setSheets(initSheets);
    setSelected(initSelected);

    // 4) Then go fetch saved data + tickets and re-merge your sheets in one go
    loadAll();

    // 5) set Interval fetching ticket data
    // start 10s polling if not already
    if (!ticketPollRef.current) {
      ticketPollRef.current = setInterval(fetchTickets, 15000);
    }
  }, [shows]);

  const toggleCell = (r: number, c: number) => {
    setSelected(prev => {
      const copy = prev.map(mat => mat.map(row => row.slice()));
      copy[current][r][c] = !copy[current][r][c];
      return copy;
    });
  };

  if (!sheets.length) return null;
  const active = sheets[current];

  // Split headers & data into chunks of 10 columns
  const chunkSize = 10;
  const headerChunks: string[][] = [];
  const dataChunks: Cell[][][] = [];

  for (let i = 0; i < active.headers.length; i += chunkSize) {
    headerChunks.push(active.headers.slice(i, i + chunkSize));
    dataChunks.push(
      active.userList.map(row => row.slice(i, i + chunkSize))
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        scrollBehavior: 'smooth',
        backgroundColor: '#611ccf',
        backgroundImage: `linear-gradient(135deg, #611ccf, #7f5fff, #aab6ff);`,
        height: '100vh',
        width: '177.7778vh'
      }}
    >
      <Backdrop
        open={isLoading}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          marginLeft: '0px !important',
        }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Tabs */}
      <Box
        sx={{
          position: 'absolute',
          top: '2vh',               // cách top 2% chiều cao viewport
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '1vh',               // khoảng cách giữa các button
          p: '0.5vh 1vh',           // padding trên dưới 0.5vh, trái phải 1vh
          border: '0.2vh solid white',
          borderRadius: '1vh',
          backgroundColor: 'rgba(255,255,255,0.1)', // nền mờ nhẹ (tuỳ chọn)
          zIndex: 10,
        }}
      >
        {sheets.map((s, i) => (
          <Button
            key={s.name}
            variant="outlined"
            onClick={() => setCurrent(i)}
            sx={{
              color: 'white',
              borderColor: 'white',
              fontStyle: 'italic',
              fontSize: '1.6vh',
              lineHeight: 1,
              padding: '0.5vh 1.5vh',
              '&.MuiButton-contained, &.MuiButton-contained:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)', // hiệu ứng khi active
                color: '#fcfc8e',
                borderColor: '#fcfc8e',
              },
            }}
            // chuyển sang contained khi active
            variant={i === current ? 'contained' : 'outlined'}
          >
            {s.name}
          </Button>
        ))}
      </Box>

      {/* Editor or Table */}
      {active.saved ? (
        <Box sx={{
          position: 'absolute',
          top: '15vh',
          bottom: '2vh',
          left: '50%',
          width: '98%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2vh',
          justifyContent: 'center',
          alignItems: 'flex-start',
          overflowY: 'auto',
          fontStyle: 'italic',

        }} >


          {headerChunks.map((headers, idx) => (
            <TableContainer
              component={Paper}
              sx={{
                width: `${headers.length * 17 + 1}vh`,
                maxHeight: '70vh',
                overflow: 'auto',
                backgroundColor: 'transparent',
              }}
            >
              {/* 2) Bật table-layout fixed */}
              <Table
                stickyHeader
                sx={{
                  tableLayout: 'fixed',
                  width: '100%',        // full width của Container
                  borderCollapse: 'collapse',
                  backgroundColor: 'transparent'
                }}
              >
                <TableHead>
                  <TableRow>
                    {headers.map(h => (
                      <TableCell
                        key={h}
                        align="center"
                        sx={{
                          fontSize: '2vh',
                          p: 0,
                          boxSizing: 'border-box',    // include border vào width
                          width: '17vh',               // chiều rộng cố định
                          height: '4vh',
                          backgroundColor: 'transparent !important',
                          color: 'white !important',
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dataChunks[idx].map((rowArr, ri) => (
                    <TableRow key={ri} hover>
                      {rowArr.map((cell, ci) => (
                        <TableCell
                          key={ci}
                          align="left"
                          sx={{
                            fontSize: '1.6vh',
                            p: 0,
                            boxSizing: 'border-box',
                            width: '17vh',
                            height: '7vh',
                            padding: '1vh',
                            border: '0.3vh solid black',
                            color: 'white',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>

                            <Box>
                              <Typography
                                noWrap
                                sx={{
                                  maxWidth: '15vh',        // hoặc bất kỳ giới hạn width nào bạn muốn
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  fontSize: '1.6vh',
                                  fontWeight: 'bold',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {cell.value} {cell.ticketHolder}
                              </Typography>
                              {cell.value && cell.ticketHolder ? (
                                <Typography
                                  variant="caption"
                                  sx={{ fontSize: '1.4vh', color: cell.ticketCheckIn ? green[500] : red[500] }}
                                >
                                  {cell.ticketCheckIn ? 'Đã check-in' : 'Chưa check-in'}
                                </Typography>
                              ) : (<Typography
                                variant="caption"
                                sx={{ fontSize: '1.4vh', color: 'transparent' }}
                              >.
                              </Typography>)}
                            </Box>
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ))}
        </Box>
      ) : (
        <></>
        // <Box sx={{ width: '100%', overflowX: 'auto' }}>
        //   <Box sx={{ minWidth: `${active.headers.length * 120}px` }}>
        //     <Spreadsheet
        //       data={active.userList}
        //       onChange={handleChange}
        //       showColumnLabels
        //       showRowLabels={false}
        //       columnLabels={active.headers}
        //     />
        //   </Box>
        // </Box>
      )}

      {/* Save button below */}
      {/* {!active.saved && (
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" fullWidth onClick={handleSave}>
            Lưu danh sách
          </Button>
        </Box>
      )} */}

    </div>

  );
};

export default EditableGrid;
