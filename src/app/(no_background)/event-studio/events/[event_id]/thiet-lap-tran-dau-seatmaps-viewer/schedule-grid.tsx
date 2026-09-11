import {
  Box,
  Typography,
  Avatar,
  useTheme,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import React, { FC, useState, useEffect, useContext, useRef } from 'react';
import NotificationContext from '@/contexts/notification-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';

interface Player {
  id: string;
  name: string;
  fullName?: string;
  phone: string;
  isHighlighted?: boolean;
  extra_fields?: Record<string, string>;
  check_in_at?: string | null;
}

const initialGrid: Player[][] = [];

interface EditableGridProps {
  eventId: number;
  show: any;
  allShows: any[];
  cardFields?: string[];
  tooltipFields?: string[];
  availableFields?: { id: string, name: string }[];
  viewMode?: 'transaction' | 'ticket';
  onTableCountChange?: (count: number) => void;
}

export const EditableGrid: FC<EditableGridProps> = ({ 
  eventId, 
  show, 
  cardFields = [], 
  tooltipFields = [], 
  viewMode = 'transaction',
  onTableCountChange,
}) => {
  const theme = useTheme();
  const notificationCtx = useContext(NotificationContext);

  // State
  const [grid, setGrid] = useState<Player[][]>(initialGrid);
  const [tables, setTables] = useState<{ id: number, name: string }[]>([]);
  const [seatsPerTable, setSeatsPerTable] = useState(8);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    playerId: string;
  } | null>(null);

  // Đánh dấu nổi bật lưu ở localStorage của trình duyệt, riêng cho trang xem (viewer) này,
  // theo từng giao dịch (không phụ thuộc suffix "_ticketN" khi ở viewMode 'ticket')
  const highlightStorageKey = `table-arrangement-highlight-viewer-${eventId}-${show.id}`;
  const getTxnBaseId = (id: string) => id.split('_ticket')[0];
  const highlightedIdsRef = useRef<Set<string>>(new Set());

  const applyHighlights = (playerGrid: Player[][]) =>
    playerGrid.map(table => table.map(p => ({
      ...p,
      isHighlighted: highlightedIdsRef.current.has(getTxnBaseId(p.id))
    })));

  // Nạp trạng thái highlight đã lưu trước khi tải dữ liệu bàn đấu
  useEffect(() => {
    try {
      const raw = localStorage.getItem(highlightStorageKey);
      highlightedIdsRef.current = raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (err) {
      console.error(err);
      highlightedIdsRef.current = new Set();
    }
    setGrid(currentGrid => applyHighlights(currentGrid));
  }, [eventId, show.id]);

  const handleContextMenu = (event: React.MouseEvent, player: Player) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
          mouseX: event.clientX + 2,
          mouseY: event.clientY - 6,
          playerId: player.id,
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

  // Xây dựng lại grid từ dữ liệu API (dùng chung cho lần tải đầu và các lần auto-reload)
  const buildGridFromTablesData = (fetchedTables: { id: number, name: string }[], tData: Record<string, any>) => {
    const newGrid: Player[][] = Array.from({ length: fetchedTables.length }, () => []);
    fetchedTables.forEach((t, idx) => {
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
        newGrid[idx] = tablePlayers;
      }
    });
    return newGrid;
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

        if (filterRes.data?.seats_per_table) {
          setSeatsPerTable(filterRes.data.seats_per_table);
        }

        let fetchedTables = [];
        if (tablesRes.data) {
          fetchedTables = tablesRes.data;
          setTables(fetchedTables);
          onTableCountChange?.(fetchedTables.length);
        } else {
          setGrid(Array.from({ length: fetchedTables.length }, () => []));
          onTableCountChange?.(0);
        }

        if (tablesDataRes.data) {
          setGrid(applyHighlights(buildGridFromTablesData(fetchedTables, tablesDataRes.data)));
        } else {
          setGrid(Array.from({ length: fetchedTables.length }, () => []));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [eventId, show.id, viewMode, onTableCountChange]);

  // Auto-reload every 15s để cập nhật realtime: check-in, thêm/sửa/xóa/đổi bàn của người chơi
  useEffect(() => {
    const interval = setInterval(() => {
      Promise.all([
        baseHttpServiceInstance.get(`/event-studio/table-arrangements/${eventId}/shows/${show.id}/tables`),
        baseHttpServiceInstance.get(`/event-studio/table-arrangements/${eventId}/shows/${show.id}/tables-data`)
      ])
        .then(([tablesRes, tablesDataRes]) => {
          const fetchedTables = tablesRes.data || [];
          setTables(fetchedTables);
          onTableCountChange?.(fetchedTables.length);

          const newGrid = buildGridFromTablesData(fetchedTables, tablesDataRes.data || {});
          setGrid(applyHighlights(newGrid));
        })
        .catch(console.error);
    }, 15000);

    return () => clearInterval(interval);
  }, [eventId, show.id, viewMode, onTableCountChange]);

  return (
    <>
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
                borderColor: '#654e85'
              }
            }}
          >
            <Box sx={{
              background: 'linear-gradient(135deg, #654e85 0%, #43335b 100%)',
              color: 'white',
              px: 1.5,
              py: 0.75,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="caption" fontWeight="bold">{tables[r]?.name || `BÀN ${r + 1}`}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.9, bgcolor: 'rgba(255,255,255,0.2)', px: 1, py: 0.2, borderRadius: 4, fontWeight: 'bold' }}>
                {tablePlayers.length}/{seatsPerTable}
              </Typography>
            </Box>

            <Box
              sx={{
                p: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.75,
                minHeight: 120,
              }}
            >
              {tablePlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onContextMenu={handleContextMenu}
                  cardFields={cardFields}
                  tooltipFields={tooltipFields}
                />
              ))}

              {Array.from({ length: Math.max(0, seatsPerTable - tablePlayers.length) }).map((_, i) => (
                <Box key={`empty-${i}`} sx={{
                  border: '1px dashed',
                  borderColor: 'rgba(0,0,0,0.1)',
                  borderRadius: 1,
                  height: 30,
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
            </Box>
          </Box>
        ))}
      </Box>

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
      </Menu>
    </>
  );
};

const PlayerCard: FC<{
  player: Player;
  onContextMenu: (e: React.MouseEvent, player: Player) => void;
  cardFields: string[];
  tooltipFields: string[];
}> = ({ player, onContextMenu, cardFields, tooltipFields }) => {

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

  const backgroundColor = player.isHighlighted
    ? '#fff9c4'
    : player.check_in_at
      ? '#c8e6c9'
      : 'white';

  return (
    <Box
      onContextMenu={(e) => onContextMenu(e, player)}
      sx={{
        width: '100%',
        background: backgroundColor,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 1,
        transition: 'background 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          borderColor: 'rgba(0,0,0,0.15)',
        }
      }}
    >
      <Box sx={{ p: 0.5, display: 'flex', alignItems: 'flex-start', gap: 0.75, width: '100%' }}>
        <Tooltip title={tooltipContent} placement="top" arrow disableInteractive>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, flexGrow: 1, minWidth: 0 }}>
            <Avatar sx={{ mt: 0.2, width: 18, height: 18, fontSize: '0.6rem', bgcolor: '#52426d', flexShrink: 0 }}>
              {player.name.charAt(0)}
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

        {player.check_in_at && (
          <Tooltip title={`Đã Check-in lúc: ${new Date(player.check_in_at).toLocaleString('vi-VN')}`} placement="top" arrow disableInteractive>
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto', flexShrink: 0, pt: 0.2 }}>
              <CheckCircleIcon size={18} weight="fill" color="#4caf50" />
            </Box>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export default EditableGrid;
