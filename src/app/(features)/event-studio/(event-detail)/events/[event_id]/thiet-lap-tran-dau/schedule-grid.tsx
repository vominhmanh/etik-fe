import NotificationContext from '@/contexts/notification-context';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  useTheme,
  Button,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  OutlinedInput,
  SelectChangeEvent,
  CircularProgress
} from '@mui/material';
import { ListPlus as ListPlusIcon } from '@phosphor-icons/react/dist/ssr/ListPlus';
import { MagicWand as MagicWandIcon } from '@phosphor-icons/react/dist/ssr/MagicWand';
import { Lock as LockIcon } from '@phosphor-icons/react/dist/ssr/Lock';
import { ArrowUUpLeft as ResetIcon } from '@phosphor-icons/react/dist/ssr/ArrowUUpLeft';
import { Gear as GearIcon } from '@phosphor-icons/react/dist/ssr/Gear';
import { FloppyDisk as SaveIcon } from '@phosphor-icons/react/dist/ssr/FloppyDisk';
import { Copy as CopyIcon } from '@phosphor-icons/react/dist/ssr/Copy';
import { PaperPlaneTilt as ResendIcon } from '@phosphor-icons/react/dist/ssr/PaperPlaneTilt';
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { CheckCircle as CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { WarningCircle as WarningCircleIcon } from '@phosphor-icons/react/dist/ssr/WarningCircle';
import React, { FC, useState, useEffect, useContext, useRef } from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';

interface Player {
  id: string;
  name: string;
  fullName?: string;
  phone: string;
  isLocked?: boolean;
  isHighlighted?: boolean;
  isSeated?: boolean;
  extra_fields?: Record<string, string>;
  check_in_at?: string | null;
}

type ManualAddResult = {
  value: string;
  status: 'success' | 'warning' | 'error';
  message?: string;
  player?: Player;
};

const TOTAL_PLAYERS = 264;

// Xoá dữ liệu mock, khởi tạo rỗng
const initialWaitingList: Player[] = [];
const initialGrid: Player[][] = [];

interface EditableGridProps {
  eventId: number;
  show: any;
  allShows: any[];
  cardFields?: string[];
  tooltipFields?: string[];
  availableFields?: { id: string, name: string }[];
  viewMode?: 'transaction' | 'ticket';
}

export const EditableGrid: FC<EditableGridProps> = ({ eventId, show, allShows, cardFields = [], tooltipFields = [], availableFields = [], viewMode = 'transaction' }) => {
  const theme = useTheme();
  const notificationCtx = useContext(NotificationContext);

  // State
  const [waitingList, setWaitingList] = useState<Player[]>(initialWaitingList);
  const [grid, setGrid] = useState<Player[][]>(initialGrid);
  const [tables, setTables] = useState<{ id: number, name: string }[]>([]);
  const [seatsPerTable, setSeatsPerTable] = useState(8);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    playerId: string;
    isLocked?: boolean;
    isInWaitingList?: boolean;
  } | null>(null);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [manualIdsInput, setManualIdsInput] = useState('');
  const [confirmingResults, setConfirmingResults] = useState<ManualAddResult[] | null>(null);
  const [savedTransactionIds, setSavedTransactionIds] = useState<number[]>([]);
  const [filterField, setFilterField] = useState<string>('id');
  const [selectedSourceCategoryIds, setSelectedSourceCategoryIds] = useState<number[]>([]);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [isSavingAllTables, setIsSavingAllTables] = useState(false);
  const [savingTableIndexes, setSavingTableIndexes] = useState<Set<number>>(new Set());
  const [resendingTableIndexes, setResendingTableIndexes] = useState<Set<number>>(new Set());

  // Đánh dấu nổi bật lưu ở localStorage của trình duyệt, riêng cho trang xếp bàn (editor) này,
  // theo từng giao dịch (không phụ thuộc suffix "_ticketN" khi ở viewMode 'ticket')
  const highlightStorageKey = `table-arrangement-highlight-editor-${eventId}-${show.id}`;
  const getTxnBaseId = (id: string) => id.split('_ticket')[0];
  const highlightedIdsRef = useRef<Set<string>>(new Set());

  const applyHighlights = <T extends Player>(players: T[]) =>
    players.map(p => ({ ...p, isHighlighted: highlightedIdsRef.current.has(getTxnBaseId(p.id)) }));

  // Nạp trạng thái highlight đã lưu trước khi tải dữ liệu bàn đấu
  useEffect(() => {
    try {
      const raw = localStorage.getItem(highlightStorageKey);
      highlightedIdsRef.current = raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (err) {
      console.error(err);
      highlightedIdsRef.current = new Set();
    }
    setGrid(currentGrid => currentGrid.map(table => applyHighlights(table)));
    setWaitingList(currentList => applyHighlights(currentList));
  }, [eventId, show.id]);

  const handleContextMenu = (event: React.MouseEvent, player: Player, isInWaitingList: boolean) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
          mouseX: event.clientX + 2,
          mouseY: event.clientY - 6,
          playerId: player.id,
          isLocked: player.isLocked,
          isInWaitingList
        }
        : null,
    );
  };

  const handleCloseMenu = () => {
    setContextMenu(null);
  };

  const handleToggleHighlight = () => {
    if (!contextMenu) return;
    const baseId = getTxnBaseId(contextMenu.playerId);

    const nextHighlighted = new Set(highlightedIdsRef.current);
    const isHighlighted = !nextHighlighted.has(baseId);
    if (isHighlighted) {
      nextHighlighted.add(baseId);
    } else {
      nextHighlighted.delete(baseId);
    }
    highlightedIdsRef.current = nextHighlighted;
    try {
      localStorage.setItem(highlightStorageKey, JSON.stringify(Array.from(nextHighlighted)));
    } catch (err) {
      console.error(err);
    }

    setWaitingList(currentList => currentList.map(p =>
      getTxnBaseId(p.id) === baseId ? { ...p, isHighlighted } : p
    ));
    setGrid(currentGrid => currentGrid.map(table => table.map(p =>
      getTxnBaseId(p.id) === baseId ? { ...p, isHighlighted } : p
    )));
    handleCloseMenu();
  };

  const handleViewTransaction = () => {
    if (!contextMenu) return;
    const { playerId } = contextMenu;
    const txnId = parseInt(playerId.replace('txn-', ''), 10);
    window.open(`/event-studio/events/${eventId}/transactions/${txnId}`, '_blank');
    handleCloseMenu();
  };

  const handleMoveToWaitingList = async () => {
    if (!contextMenu) return;
    const { playerId, isLocked, isInWaitingList } = contextMenu;

    if (isInWaitingList) {
      handleCloseMenu();
      return;
    }

    try {
      const txnId = parseInt(playerId.replace('txn-', ''), 10);
      await baseHttpServiceInstance.post(`/event-studio/table-arrangements/${eventId}/shows/${show.id}/tables/remove`, { transaction_id: txnId });

      let foundPlayer: Player | null = null;
      const newGrid = [...grid];
      for (let r = 0; r < newGrid.length; r++) {
        const pIndex = newGrid[r].findIndex(p => p.id === playerId);
        if (pIndex !== -1) {
          foundPlayer = newGrid[r][pIndex];
          const table = [...newGrid[r]];
          table.splice(pIndex, 1);
          newGrid[r] = table;
          setGrid(newGrid);
          break;
        }
      }

      if (foundPlayer) {
        foundPlayer.isLocked = false;
        setWaitingList([...waitingList, foundPlayer]);
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi khi gỡ người chơi khỏi bàn.");
    }

    handleCloseMenu();
  };

  // Lấy dữ liệu API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tablesRes, tablesDataRes, filterRes] = await Promise.all([
          baseHttpServiceInstance.get(`/event-studio/table-arrangements/${eventId}/shows/${show.id}/tables`),
          baseHttpServiceInstance.get(`/event-studio/table-arrangements/${eventId}/shows/${show.id}/tables-data`),
          baseHttpServiceInstance.get(`/event-studio/table-arrangements/${eventId}/shows/${show.id}/waiting-list/filter`)
        ]);

        let sourceCatQuery = '';
        if (filterRes.data) {
          setSavedTransactionIds(filterRes.data.transaction_ids || []);
          setFilterField(filterRes.data.filter_field || 'id');
          if (filterRes.data.source_category_ids) {
            const savedCats = filterRes.data.source_category_ids.split(',').map((id: string) => parseInt(id.trim())).filter((n: number) => !isNaN(n));
            setSelectedSourceCategoryIds(savedCats);
          }
          if (filterRes.data.seats_per_table) {
            setSeatsPerTable(filterRes.data.seats_per_table);
          }
        }

        const waitingRes = await baseHttpServiceInstance.get(`/event-studio/table-arrangements/${eventId}/shows/${show.id}/waiting-list`);

        let fetchedTables = [];
        if (tablesRes.data) {
          fetchedTables = tablesRes.data;
          setTables(fetchedTables);
        }

        if (tablesDataRes.data) {
          const tData = tablesDataRes.data;
          const initialGrid = Array.from({ length: fetchedTables.length }, () => []);
          fetchedTables.forEach((t: any, idx: number) => {
            if (tData[t.id]) {
              let tablePlayers = tData[t.id] as Player[];
              if (viewMode === 'transaction') {
                const seen = new Set();
                tablePlayers = tablePlayers.filter(p => {
                  if (seen.has(p.id)) return false;
                  seen.add(p.id);
                  return true;
                });
              } else {
                const seenCounts = new Map();
                tablePlayers = tablePlayers.map(p => {
                  const count = (seenCounts.get(p.id) || 0) + 1;
                  seenCounts.set(p.id, count);
                  return count > 1 ? { ...p, id: `${p.id}_ticket${count}` } : p;
                });
              }
              initialGrid[idx] = tablePlayers;
            }
          });
          setGrid((initialGrid as Player[][]).map(table => applyHighlights(table)));
        } else {
          setGrid(Array.from({ length: fetchedTables.length }, () => []));
        }

        if (waitingRes.data) {
          setWaitingList(applyHighlights(waitingRes.data));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [eventId, show.id, viewMode]);

  // Auto-reload waiting list and tables-data every 15s
  useEffect(() => {
    const interval = setInterval(() => {
      Promise.all([
        baseHttpServiceInstance.get(`/event-studio/table-arrangements/${eventId}/shows/${show.id}/waiting-list`),
        baseHttpServiceInstance.get(`/event-studio/table-arrangements/${eventId}/shows/${show.id}/tables-data`)
      ])
        .then(([waitingRes, tablesDataRes]) => {
          const newTablesData = tablesDataRes.data || {};
          const checkInMap = new Map<string, string | null>();

          Object.values(newTablesData).forEach((tablePlayers: any) => {
            const seenCounts = new Map();
            tablePlayers.forEach((p: any) => {
              const count = (seenCounts.get(p.id) || 0) + 1;
              seenCounts.set(p.id, count);
              const uniqueId = count > 1 ? `${p.id}_ticket${count}` : p.id;
              checkInMap.set(uniqueId, p.check_in_at || null);
            });
          });

          setGrid(currentGrid => {
            let hasGridChanges = false;
            const nextGrid = currentGrid.map(table =>
              table.map(p => {
                if (checkInMap.has(p.id)) {
                  const checkInTime = checkInMap.get(p.id);
                  if (p.check_in_at !== checkInTime) {
                    hasGridChanges = true;
                    return { ...p, check_in_at: checkInTime };
                  }
                }
                return p;
              })
            );

            if (waitingRes.data) {
              const currentGridPlayers = new Set(nextGrid.flat().map(p => p.id));
              setWaitingList(currentWaitingList => {
                const currentWaitingMap = new Map(currentWaitingList.map(p => [p.id, p]));

                const nextWaitingList = [];
                for (const p of waitingRes.data) {
                  if (!currentGridPlayers.has(p.id)) {
                    const existing = currentWaitingMap.get(p.id);
                    if (existing) {
                      nextWaitingList.push({ ...p, isHighlighted: existing.isHighlighted, check_in_at: p.check_in_at || null });
                    } else {
                      nextWaitingList.push(p);
                    }
                  }
                }
                return nextWaitingList;
              });
            }

            return hasGridChanges ? nextGrid : currentGrid;
          });
        })
        .catch(console.error);
    }, 15000);

    return () => clearInterval(interval);
  }, [eventId, show.id]);

  const handleSaveSourceCategory = async () => {
    try {
      const sourceCats = selectedSourceCategoryIds.length > 0 ? selectedSourceCategoryIds.join(',') : '';
      await baseHttpServiceInstance.post(`/event-studio/table-arrangements/${eventId}/shows/${show.id}/waiting-list/filter`, {
        transaction_ids: savedTransactionIds,
        source_category_ids: sourceCats,
        seats_per_table: seatsPerTable,
        filter_field: filterField
      });
      notificationCtx.success('Lưu cấu hình thành công!');
      setConfigModalOpen(false);

      // Fetch waiting list again
      const waitingRes = await baseHttpServiceInstance.get(`/event-studio/table-arrangements/${eventId}/shows/${show.id}/waiting-list`);
      setWaitingList(waitingRes.data || []);
    } catch (e: any) {
      notificationCtx.error('Lỗi khi lưu cấu hình', e);
    }
  };

  // Mở dialog "Lọc đội đi tiếp": nếu đang có bộ lọc lưu sẵn, đổ sẵn danh sách đó vào ô nhập
  // (thay vì bỏ trống) để user sửa trực tiếp cho tiện, thay vì phải gõ lại từ đầu.
  const handleOpenFilterModal = async () => {
    setAddModalOpen(true);
    setConfirmingResults(null);
    if (savedTransactionIds.length === 0) {
      setManualIdsInput('');
      return;
    }
    try {
      const sourceCats = selectedSourceCategoryIds.length > 0 ? selectedSourceCategoryIds.join(',') : '';
      const res = await baseHttpServiceInstance.get(`/event-studio/table-arrangements/${eventId}/shows/${show.id}/waiting-list?source_category_ids=${sourceCats}&ignore_filter=true`);
      const validPlayers: Player[] = res.data || [];
      const byTxnId = new Map(validPlayers.map(p => [parseInt(p.id.replace('txn-', ''), 10), p]));

      const values = savedTransactionIds.map(txnId => {
        const p = byTxnId.get(txnId);
        return p ? (p.extra_fields?.[filterField] || String(txnId)) : String(txnId);
      });
      setManualIdsInput(values.join('\n'));
    } catch (err) {
      console.error(err);
      setManualIdsInput('');
    }
  };

  const handleFilterSubmit = async () => {
    const values = manualIdsInput.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    if (values.length === 0) {
      alert("Vui lòng nhập ít nhất 1 giá trị hợp lệ");
      return;
    }
    try {
      // Validate by fetching the unfiltered waiting list, including those already seated
      // so we can tell "invalid" apart from "valid but already seated" (which should only warn, not block).
      const sourceCats = selectedSourceCategoryIds.length > 0 ? selectedSourceCategoryIds.join(',') : '';
      const res = await baseHttpServiceInstance.get(`/event-studio/table-arrangements/${eventId}/shows/${show.id}/waiting-list?source_category_ids=${sourceCats}&ignore_filter=true&include_seated=true`);
      const validPlayers: Player[] = res.data || [];
      const validMap = new Map(validPlayers.map(p => [(p.extra_fields?.[filterField] || '').trim(), p]));

      const results: ManualAddResult[] = values.map(value => {
        const p = validMap.get(value);
        if (!p) {
          return { value, status: 'error', message: 'Không hợp lệ' };
        } else if (p.isSeated) {
          return { value, status: 'warning', player: p, message: 'Đã được xếp bàn' };
        } else {
          return { value, status: 'success', player: p };
        }
      });
      setConfirmingResults(results);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi kiểm tra bộ lọc.");
    }
  };

  const handleConfirmFilter = async () => {
    if (!confirmingResults) return;
    if (confirmingResults.some(r => r.status === 'error')) {
      alert("Vui lòng loại bỏ các giá trị không hợp lệ trước khi lọc.");
      return;
    }

    const validIds = confirmingResults
      .map(r => r.player ? parseInt(r.player.id.replace('txn-', ''), 10) : NaN)
      .filter(n => !isNaN(n));
    try {
      const payload = {
        transaction_ids: validIds,
        source_category_ids: selectedSourceCategoryIds.length > 0 ? selectedSourceCategoryIds.join(',') : undefined,
        seats_per_table: seatsPerTable,
        filter_field: filterField
      };
      await baseHttpServiceInstance.post(`/event-studio/table-arrangements/${eventId}/shows/${show.id}/waiting-list/filter`, payload);

      const sourceCats = selectedSourceCategoryIds.length > 0 ? selectedSourceCategoryIds.join(',') : '';
      const waitingRes = await baseHttpServiceInstance.get(`/event-studio/table-arrangements/${eventId}/shows/${show.id}/waiting-list?source_category_ids=${sourceCats}`);
      if (waitingRes.data) setWaitingList(waitingRes.data);
      setSavedTransactionIds(validIds);
      setAddModalOpen(false);
      setManualIdsInput('');
      setConfirmingResults(null);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi lưu bộ lọc.");
    }
  };

  const handleClearFilter = async () => {
    try {
      const payload = {
        transaction_ids: [],
        source_category_ids: selectedSourceCategoryIds.length > 0 ? selectedSourceCategoryIds.join(',') : undefined,
        seats_per_table: seatsPerTable,
        filter_field: filterField
      };
      await baseHttpServiceInstance.post(`/event-studio/table-arrangements/${eventId}/shows/${show.id}/waiting-list/filter`, payload);

      const sourceCats = selectedSourceCategoryIds.length > 0 ? selectedSourceCategoryIds.join(',') : '';
      const waitingRes = await baseHttpServiceInstance.get(`/event-studio/table-arrangements/${eventId}/shows/${show.id}/waiting-list?source_category_ids=${sourceCats}`);
      if (waitingRes.data) setWaitingList(waitingRes.data);
      setSavedTransactionIds([]);
      setAddModalOpen(false);
      setConfirmingResults(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTable = async (tableIndex: number) => {
    const tableInfo = tables[tableIndex];
    if (!tableInfo) return;
    if (savingTableIndexes.has(tableIndex)) return; // tránh spam click
    const playersInTable = grid[tableIndex];
    const txnIds = playersInTable.map(p => parseInt(p.id.replace('txn-', ''), 10));
    setSavingTableIndexes(prev => new Set(prev).add(tableIndex));
    try {
      await baseHttpServiceInstance.post(`/event-studio/table-arrangements/${eventId}/shows/${show.id}/tables/${tableInfo.id}/save`, txnIds);
      // Cập nhật state isLocked cho những người này
      const newGrid = [...grid];
      newGrid[tableIndex] = playersInTable.map(p => ({ ...p, isLocked: true }));
      setGrid(newGrid);
      alert(`Đã chốt bàn ${tableInfo.name} thành công!`);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi chốt bàn.");
    } finally {
      setSavingTableIndexes(prev => {
        const next = new Set(prev);
        next.delete(tableIndex);
        return next;
      });
    }
  };

  const handleResendTable = async (tableIndex: number) => {
    const tableInfo = tables[tableIndex];
    if (!tableInfo) return;
    if (resendingTableIndexes.has(tableIndex)) return; // tránh spam click
    if (!window.confirm(`Gửi lại email + ZNS thông báo vị trí chỗ ngồi cho tất cả người đang ngồi ở ${tableInfo.name}?`)) return;

    setResendingTableIndexes(prev => new Set(prev).add(tableIndex));
    try {
      const res = await baseHttpServiceInstance.post(`/event-studio/table-arrangements/${eventId}/shows/${show.id}/tables/${tableInfo.id}/resend`);
      const count = res.data?.count ?? 0;
      if (count > 0) {
        notificationCtx.success(`Đã gửi lại thông báo cho ${count} người ở ${tableInfo.name}.`);
      } else {
        notificationCtx.warning(`${tableInfo.name} chưa có ai để gửi lại thông báo.`);
      }
    } catch (err) {
      console.error(err);
      notificationCtx.error(`Lỗi khi gửi lại thông báo cho ${tableInfo.name}.`, err);
    } finally {
      setResendingTableIndexes(prev => {
        const next = new Set(prev);
        next.delete(tableIndex);
        return next;
      });
    }
  };

  const handleSaveAllTables = async () => {
    if (isSavingAllTables) return; // tránh spam click
    setIsSavingAllTables(true);
    try {
      const savePromises = tables.map((tableInfo, tableIndex) => {
        const playersInTable = grid[tableIndex];
        const txnIds = playersInTable.map(p => parseInt(p.id.replace('txn-', ''), 10));
        return baseHttpServiceInstance.post(`/event-studio/table-arrangements/${eventId}/shows/${show.id}/tables/${tableInfo.id}/save`, txnIds);
      });

      await Promise.all(savePromises);

      const newGrid = grid.map(tablePlayers => tablePlayers.map(p => ({ ...p, isLocked: true })));
      setGrid(newGrid);
      notificationCtx.success('Đã lưu toàn bộ bảng đấu thành công!');
    } catch (err) {
      console.error(err);
      notificationCtx.error('Lỗi khi lưu bảng đấu.', err);
    } finally {
      setIsSavingAllTables(false);
    }
  };

  // Xây dựng nội dung 1 ô (card) khi copy, dựa theo các trường user đã chọn hiển thị
  const getPlayerCellText = (player: Player) => {
    const raw = cardFields && cardFields.length > 0
      ? cardFields.map(f => player.extra_fields?.[f] || 'N/A').join(' - ')
      : `#${player.id.replace('txn-', '')} - ${player.name}`;
    // Loại bỏ tab/xuống dòng để không phá vỡ định dạng khi dán vào Excel
    return raw.replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
  };

  // Tạo dữ liệu dạng TSV (tab-separated) để dán trực tiếp vào Excel:
  // mỗi bàn là 1 cột, hàng đầu là tên bàn, các hàng sau là từng card
  const buildTsvForTables = (tableIndexes: number[]) => {
    const selectedTables = tableIndexes.map(idx => ({
      name: tables[idx]?.name || `BÀN ${idx + 1}`,
      players: grid[idx] || []
    }));
    const maxRows = Math.max(0, ...selectedTables.map(t => t.players.length));
    const header = selectedTables.map(t => t.name.replace(/\t/g, ' ')).join('\t');
    const lines = [header];
    for (let r = 0; r < maxRows; r++) {
      lines.push(selectedTables.map(t => t.players[r] ? getPlayerCellText(t.players[r]) : '').join('\t'));
    }
    return lines.join('\n');
  };

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notificationCtx.success(successMessage);
    } catch (err) {
      console.error(err);
      notificationCtx.error('Lỗi khi sao chép dữ liệu.', err);
    }
  };

  const handleCopyAllTables = () => {
    if (tables.length === 0) return;
    const tsv = buildTsvForTables(tables.map((_, idx) => idx));
    copyToClipboard(tsv, 'Đã sao chép toàn bộ bảng đấu');
  };

  const handleOpenViewer = () => {
    window.open(`/event-studio/events/${eventId}/thiet-lap-tran-dau-seatmaps-viewer`, '_blank');
  };

  const handleCopyTable = (tableIndex: number) => {
    const tsv = buildTsvForTables([tableIndex]);
    const tableName = tables[tableIndex]?.name || `Bàn ${tableIndex + 1}`;
    copyToClipboard(tsv, `Đã sao chép ${tableName}`);
  };

  // Thuật toán điền vòng lặp (Round Robin)
  const handleAutoFill = () => {
    let currentWaiting = [...waitingList];
    const newGrid = grid.map(table => [...table]);

    let moved = true;
    while (moved && currentWaiting.length > 0) {
      moved = false;
      for (let r = 0; r < tables.length; r++) {
        if (currentWaiting.length === 0) break;
        if (newGrid[r].length < seatsPerTable) {
          const player = currentWaiting.shift();
          if (player) {
            newGrid[r].push(player);
            moved = true;
          }
        }
      }
    }
    setWaitingList(currentWaiting);
    setGrid(newGrid);
  };

  const handleResetAll = () => {
    if (!window.confirm("Bạn có chắc muốn đưa tất cả các đội chưa bị khoá về hàng chờ?")) return;

    const newWaitingList = [...waitingList];
    const newGrid = grid.map(table => {
      const remaining: Player[] = [];
      table.forEach(player => {
        if (player.isLocked) {
          remaining.push(player);
        } else {
          newWaitingList.push(player);
        }
      });
      return remaining;
    });

    setWaitingList(newWaitingList);
    setGrid(newGrid);
  };



  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    let nextWaitingList = [...waitingList];
    const nextGrid = grid.map(table => [...table]);

    const getList = (droppableId: string) => {
      if (droppableId === 'waiting-list') return nextWaitingList;
      if (droppableId.startsWith('table-')) {
        const [, rStr] = droppableId.split('-');
        return nextGrid[Number(rStr)];
      }
      return [];
    };

    const sourceList = getList(source.droppableId);
    const destList = getList(destination.droppableId);

    // Chặn thả nếu bàn đích đã đầy
    if (destination.droppableId.startsWith('table-') && source.droppableId !== destination.droppableId) {
      if (destList.length >= seatsPerTable) {
        return; // Bàn đã full, huỷ thao tác
      }
    }

    const [removed] = sourceList.splice(source.index, 1);

    // Nếu đội bị khoá, chặn kéo (Draggable cũng chặn rồi, đây là code phòng hờ)
    if (removed.isLocked) {
      sourceList.splice(source.index, 0, removed);
      return;
    }

    // Chèn vào vị trí đích
    destList.splice(destination.index, 0, removed);

    setWaitingList(nextWaitingList);
    setGrid(nextGrid);
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', gap: 2, height: '800px' }}>

          {/* Hàng chờ (Waiting List) */}
          <Paper
            sx={{
              width: '280px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid rgba(0,0,0,0.05)',
              borderRadius: 3,
              boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Hàng Chờ ({waitingList.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Cấu hình nguồn vé" placement="top" arrow>
                  <IconButton size="small" onClick={() => setConfigModalOpen(true)} sx={{ bgcolor: 'rgba(0,0,0,0.04)' }}>
                    <GearIcon size={16} weight="bold" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Nhập theo danh sách" placement="top" arrow>
                  <IconButton size="small" onClick={handleOpenFilterModal} sx={{ bgcolor: 'rgba(0,0,0,0.04)' }}>
                    <ListPlusIcon size={16} weight="bold" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Tự động xếp chỗ (chia đều)" placement="top" arrow>
                  <IconButton size="small" onClick={handleAutoFill} color="primary" sx={{ bgcolor: 'rgba(24, 119, 242, 0.1)' }}>
                    <MagicWandIcon size={16} weight="bold" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            {savedTransactionIds.length > 0 && (
              <Box sx={{
                px: 1.5, py: 0.75,
                bgcolor: 'rgba(255, 193, 7, 0.12)',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1
              }}>
                <Typography variant="caption" sx={{ color: 'warning.dark', fontWeight: 600, lineHeight: 1.3 }}>
                  Đang lọc theo &quot;{availableFields.find(f => f.id === filterField)?.name || 'ID Giao dịch'}&quot;: {savedTransactionIds.length} đội
                </Typography>
                <Button size="small" onClick={handleClearFilter} sx={{ fontSize: '0.65rem', minWidth: 'auto', py: 0.25, flexShrink: 0 }}>
                  Huỷ lọc
                </Button>
              </Box>
            )}
            <Droppable droppableId="waiting-list" mode="virtual">
              {(provided, snapshot) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    p: 1.5,
                    background: snapshot.isDraggingOver ? 'rgba(0,0,0,0.02)' : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                  }}
                >
                  {waitingList.map((player, index) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      index={index}
                      onContextMenu={(e, p) => handleContextMenu(e, p, true)}
                      cardFields={cardFields}
                      tooltipFields={tooltipFields}
                      availableFields={availableFields}
                    />
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </Paper>

          {/* Sơ đồ bàn đấu (Match Grid) */}
          <Paper
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid rgba(0,0,0,0.05)',
              borderRadius: 3,
              boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" fontWeight="bold">Sơ đồ các bàn thi đấu ({tables.length} Bàn)</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Mở trang View-only" placement="top" arrow>
                  <IconButton size="small" onClick={handleOpenViewer} color="primary" sx={{ bgcolor: 'rgba(24, 119, 242, 0.1)' }}>
                    <EyeIcon size={16} weight="bold" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sao chép bảng đấu" placement="top" arrow>
                  <IconButton size="small" onClick={handleCopyAllTables} color="primary" sx={{ bgcolor: 'rgba(24, 119, 242, 0.1)' }}>
                    <CopyIcon size={16} weight="bold" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Reset các đội chưa bị khoá về hàng chờ" placement="top" arrow>
                  <IconButton size="small" onClick={handleResetAll} color="error" sx={{ bgcolor: 'rgba(211, 47, 47, 0.1)' }}>
                    <ResetIcon size={16} weight="bold" />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="contained"
                  size="small"
                  color="primary"
                  onClick={handleSaveAllTables}
                  disabled={isSavingAllTables}
                  startIcon={isSavingAllTables ? <CircularProgress size={14} color="inherit" /> : undefined}
                >
                  {isSavingAllTables ? 'Đang lưu...' : 'Lưu Bảng Đấu'}
                </Button>
              </Box>
            </Box>

            <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
                {grid.map((tablePlayers, r) => (
                  <Box
                    key={r}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      overflow: 'hidden',
                      background: 'white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                        borderColor: theme.palette.primary.light
                      }
                    }}
                  >
                    <Box sx={{
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      color: 'white',
                      px: 1.5,
                      py: 0.75,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" fontWeight="bold">{tables[r]?.name || `BÀN ${r + 1}`}</Typography>
                        <Tooltip title={`Sao chép ${tables[r]?.name || `Bàn ${r + 1}`}`} placement="top" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleCopyTable(r)}
                            sx={{
                              color: 'white',
                              p: 0.3,
                              bgcolor: 'rgba(255,255,255,0.15)',
                              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                            }}
                          >
                            <CopyIcon size={14} weight="bold" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={`Chốt danh sách ${tables[r]?.name || `Bàn ${r + 1}`}`} placement="top" arrow>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleSaveTable(r)}
                              disabled={savingTableIndexes.has(r)}
                              sx={{
                                color: 'white',
                                p: 0.3,
                                bgcolor: 'rgba(255,255,255,0.15)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                                '&.Mui-disabled': { color: 'rgba(255,255,255,0.6)' }
                              }}
                            >
                              {savingTableIndexes.has(r) ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : (
                                <SaveIcon size={14} weight="bold" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={`Gửi lại email + ZNS thông báo vị trí chỗ ngồi cho ${tables[r]?.name || `Bàn ${r + 1}`}`} placement="top" arrow>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleResendTable(r)}
                              disabled={resendingTableIndexes.has(r) || tablePlayers.length === 0}
                              sx={{
                                color: 'white',
                                p: 0.3,
                                bgcolor: 'rgba(255,255,255,0.15)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                                '&.Mui-disabled': { color: 'rgba(255,255,255,0.6)' }
                              }}
                            >
                              {resendingTableIndexes.has(r) ? (
                                <CircularProgress size={14} color="inherit" />
                              ) : (
                                <ResendIcon size={14} weight="bold" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                      <Typography variant="caption" sx={{ opacity: 0.9, bgcolor: 'rgba(255,255,255,0.2)', px: 1, py: 0.2, borderRadius: 4, fontWeight: 'bold' }}>
                        {tablePlayers.length}/{seatsPerTable}
                      </Typography>
                    </Box>

                    {/* Table-level Droppable (Tối ưu hiệu năng) */}
                    <Droppable droppableId={`table-${r}`}>
                      {(provided, snapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          sx={{
                            p: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.75,
                            minHeight: 120,
                            background: snapshot.isDraggingOver ? 'rgba(24, 119, 242, 0.02)' : 'transparent',
                            transition: 'background 0.2s ease',
                          }}
                        >
                          {tablePlayers.map((player, index) => (
                            <PlayerCard
                              key={player.id}
                              player={player}
                              index={index}
                              onContextMenu={(e, p) => handleContextMenu(e, p, false)}
                              cardFields={cardFields}
                              tooltipFields={tooltipFields}
                              availableFields={availableFields}
                            />
                          ))}
                          {provided.placeholder}

                          {/* Empty Slots Illusion */}
                          {!snapshot.isDraggingOver && Array.from({ length: seatsPerTable - tablePlayers.length }).map((_, i) => (
                            <Box key={`empty-${i}`} sx={{
                              border: '1px dashed',
                              borderColor: 'rgba(0,0,0,0.1)',
                              borderRadius: 1,
                              height: 30, // Matches PlayerCard height
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 'rgba(0,0,0,0.02)'
                            }}>
                              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                                Vị trí {tablePlayers.length + i + 1}
                              </Typography>
                            </Box>
                          ))}

                          {/* Dragging over empty space indicator */}
                          {snapshot.isDraggingOver && tablePlayers.length < seatsPerTable && (
                            <Box sx={{
                              border: `1px dashed ${theme.palette.primary.main}`,
                              borderRadius: 1,
                              flexGrow: 1,
                              minHeight: 30,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 'rgba(24, 119, 242, 0.05)'
                            }}>
                              <Typography variant="caption" color="primary" sx={{ fontSize: '0.6rem', fontWeight: 'bold' }}>
                                Thả vào đây
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Droppable>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </Box>
      </DragDropContext>

      <Menu
        open={contextMenu !== null}
        onClose={handleCloseMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        PaperProps={{
          sx: { minWidth: 150, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
        }}
      >
        <MenuItem onClick={handleViewTransaction} sx={{ fontSize: '0.75rem', py: 0.5, px: 1.5, minHeight: 'auto' }}>
          Xem đơn hàng
        </MenuItem>

        <MenuItem onClick={handleToggleHighlight} sx={{ fontSize: '0.75rem', py: 0.5, px: 1.5, minHeight: 'auto' }}>
          Đánh dấu / Bỏ đánh dấu nổi bật
        </MenuItem>

        {contextMenu && !contextMenu.isLocked && !contextMenu.isInWaitingList && (
          <MenuItem onClick={handleMoveToWaitingList} sx={{ fontSize: '0.75rem', py: 0.5, px: 1.5, minHeight: 'auto', color: 'error.main' }}>
            Chuyển về hàng chờ
          </MenuItem>
        )}
      </Menu>

      <Dialog open={addModalOpen} onClose={() => setAddModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Lọc đội đi tiếp</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {confirmingResults ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Trạng thái kiểm tra <b>{confirmingResults.length}</b> mục, lọc theo trường &quot;{availableFields.find(f => f.id === filterField)?.name || 'ID Giao dịch'}&quot;:
              </Typography>
              <List dense sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 0 }}>
                {confirmingResults.map((r, idx) => (
                  <ListItem key={`${idx}-${r.value}`} sx={{ borderBottom: '1px solid rgba(0,0,0,0.05)', '&:last-child': { borderBottom: 'none' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                      {r.status === 'success' ? (
                        <CheckCircleIcon size={20} color={theme.palette.success.main} weight="fill" />
                      ) : r.status === 'warning' ? (
                        <WarningCircleIcon size={20} color={theme.palette.warning.main} weight="fill" />
                      ) : (
                        <WarningCircleIcon size={20} color={theme.palette.error.main} weight="fill" />
                      )}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {r.value}
                        </Typography>
                        {r.status !== 'error' && r.player ? (
                          <Typography variant="caption" color={r.status === 'warning' ? 'warning.main' : 'text.secondary'}>
                            {r.player.fullName || r.player.name} - {r.player.phone}
                            {r.status === 'warning' ? ` (${r.message})` : ''}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="error.main">
                            {r.message}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel id="filter-field-label">Lọc theo trường</InputLabel>
                <Select
                  labelId="filter-field-label"
                  label="Lọc theo trường"
                  value={filterField}
                  onChange={(e: SelectChangeEvent<string>) => {
                    setFilterField(e.target.value);
                    setManualIdsInput('');
                  }}
                >
                  {availableFields.map(field => (
                    <MenuItem key={field.id} value={field.id}>{field.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Nhập danh sách giá trị của trường &quot;{availableFields.find(f => f.id === filterField)?.name || 'ID Giao dịch'}&quot; cho các đội đi tiếp (mỗi dòng một giá trị). Bấm Huỷ Lọc để xem toàn bộ danh sách.
              </Typography>
              <TextField
                multiline
                rows={6}
                fullWidth
                variant="outlined"
                placeholder={"Ví dụ:\n1005\n1006"}
                value={manualIdsInput}
                onChange={(e) => setManualIdsInput(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          {!confirmingResults && (
            <Button onClick={handleClearFilter} color="error" variant="text">
              Huỷ bộ lọc (Xem tất cả)
            </Button>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button
            onClick={() => {
              if (confirmingResults) setConfirmingResults(null);
              else setAddModalOpen(false);
            }}
            variant="text"
            color="inherit"
          >
            {confirmingResults ? "Quay lại" : "Đóng"}
          </Button>
          {confirmingResults ? (
            <Button
              onClick={handleConfirmFilter}
              variant="contained"
              color="primary"
              disabled={confirmingResults.some(r => r.status === 'error')}
            >
              Xác nhận Lọc
            </Button>
          ) : (
            <Button onClick={handleFilterSubmit} variant="contained" color="primary">
              Kiểm tra
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={configModalOpen} onClose={() => setConfigModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cấu hình nguồn hàng chờ</DialogTitle>
        <DialogContent dividers sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Cấu hình hạng vé nguồn và số vị trí trên mỗi bàn cho sự kiện này.
          </Typography>

          <FormControl fullWidth>
            <TextField
              label="Số vị trí mỗi bàn"
              type="number"
              value={seatsPerTable}
              onChange={(e) => setSeatsPerTable(parseInt(e.target.value) || 1)}
              inputProps={{ min: 1 }}
              fullWidth
            />
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="config-source-category-label">Hạng vé (Tùy chọn)</InputLabel>
            <Select
              labelId="config-source-category-label"
              multiple
              value={selectedSourceCategoryIds}
              onChange={(e: SelectChangeEvent<number[]>) => {
                const value = e.target.value;
                setSelectedSourceCategoryIds(typeof value === 'string' ? value.split(',').map(Number) : value);
              }}
              input={<OutlinedInput label="Hạng vé (Tùy chọn)" />}
              renderValue={(selected) => {
                const allCats = allShows.flatMap(s => s.ticketCategories?.map((cat: any) => ({ ...cat, showName: s.name })) || []);
                return allCats
                  .filter((cat: any) => selected.includes(cat.id))
                  .map((cat: any) => `${cat.showName} - ${cat.name}`)
                  .join(', ');
              }}
            >
              {allShows.map(s => {
                const cats = s.ticketCategories || [];
                return cats.map((cat: any) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    <Checkbox checked={selectedSourceCategoryIds.indexOf(cat.id) > -1} />
                    <ListItemText primary={`${s.name} - ${cat.name}`} />
                  </MenuItem>
                ));
              })}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button onClick={() => setConfigModalOpen(false)} variant="text" color="inherit">
            Huỷ
          </Button>
          <Button onClick={handleSaveSourceCategory} variant="contained" color="primary">
            Lưu cấu hình
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const PlayerCard: FC<{
  player: Player;
  index: number;
  onContextMenu: (e: React.MouseEvent, player: Player) => void;
  cardFields: string[];
  tooltipFields: string[];
  availableFields: { id: string, name: string }[];
}> = ({ player, index, onContextMenu, cardFields, tooltipFields, availableFields }) => {

  const tooltipContent = (
    <Box sx={{ whiteSpace: 'pre-line' }}>
      {tooltipFields && tooltipFields.length > 0 ? (
        tooltipFields.map(f => {
          return <div key={f}>{player.extra_fields?.[f] || 'N/A'}</div>;
        })
      ) : (
        <>{player.phone}</>
      )}
    </Box>
  );

  return (
    <Draggable draggableId={player.id} index={index} isDragDisabled={player.isLocked}>
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onContextMenu={(e) => onContextMenu(e, player)}
          style={provided.draggableProps.style}
          sx={{
            width: '100%',
            background: player.isLocked
              ? (player.isHighlighted ? '#fff59d' : '#f5f5f5')
              : snapshot.isDragging
                ? '#e3f2fd'
                : (player.isHighlighted ? '#fff9c4' : 'white'),
            boxShadow: snapshot.isDragging
              ? '0 12px 24px rgba(0,0,0,0.15)'
              : '0 1px 2px rgba(0,0,0,0.05)',
            border: '1px solid',
            borderColor: player.isLocked ? 'rgba(0,0,0,0.05)' : snapshot.isDragging ? '#2196f3' : 'rgba(0,0,0,0.08)',
            borderRadius: 1,
            cursor: player.isLocked ? 'not-allowed' : 'grab',
            opacity: player.isLocked ? 0.8 : 1,
            '&:hover': player.isLocked ? {} : {
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              borderColor: 'rgba(0,0,0,0.15)',
            }
          }}
        >
          <Box sx={{ p: 0.5, display: 'flex', alignItems: 'flex-start', gap: 0.75, width: '100%' }}>
            <Tooltip title={tooltipContent} placement="top" arrow disableInteractive>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, flexGrow: 1, minWidth: 0 }}>
                <Avatar sx={{ mt: 0.2, width: 18, height: 18, fontSize: '0.6rem', bgcolor: player.isLocked ? 'grey.500' : 'primary.main', flexShrink: 0 }}>
                  {player.isLocked ? <LockIcon weight="fill" /> : player.name.charAt(0)}
                </Avatar>
                <Box sx={{ minWidth: 0, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  {(!cardFields || cardFields.length === 0) && (
                    <Typography
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        lineHeight: 1.1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500, mr: 0.5 }}>
                        #{player.id.replace('txn-', '')}
                      </Box>
                      {player.name}
                    </Typography>
                  )}

                  {cardFields && cardFields.length > 0 && (
                    <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      {cardFields.map(f => {
                        return (
                          <Typography key={f} sx={{ fontSize: '0.65rem', color: 'text.secondary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {player.extra_fields?.[f] || 'N/A'}
                          </Typography>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </Box>
            </Tooltip>

            {player.isLocked && player.check_in_at && (
              <Tooltip title={`Đã Check-in lúc: ${new Date(player.check_in_at).toLocaleString('vi-VN')}`} placement="top" arrow disableInteractive>
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto', flexShrink: 0, pt: 0.2 }}>
                  <CheckCircleIcon size={18} weight="fill" color="#4caf50" />
                </Box>
              </Tooltip>
            )}
          </Box>
        </Box>
      )}
    </Draggable>
  );
};

export default EditableGrid;
