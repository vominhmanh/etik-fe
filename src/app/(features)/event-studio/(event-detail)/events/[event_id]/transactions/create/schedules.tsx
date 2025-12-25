import { Box, Card, CardHeader, Divider, IconButton, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import { CaretRight as CaretRightIcon } from '@phosphor-icons/react/dist/ssr/CaretRight';
import dayjs from 'dayjs';
import React from 'react';
import { Show } from './page';
import { useTranslation } from '@/contexts/locale-context';

export interface LatestProductsProps {
  shows?: Show[];
  selectedShows?: Show[];
  activeShowId?: number | null;
  onSelectionChange: (selectedShows: Show[]) => void;  // New prop for selection handling
  onOpen?: (show: Show | null) => void;
}

export function Schedules({
  shows = [],
  selectedShows = [],
  activeShowId = null,
  onSelectionChange,
  onOpen,
}: LatestProductsProps): React.JSX.Element {
  const { tt } = useTranslation();

  const handleItemClick = (show: Show) => {
    const isValid = show.status === 'on_sale' && !show.disabled;
    if (!isValid) return;

    const isActive = activeShowId === show.id;
    const isSelected = selectedShows.some((s) => s.id === show.id);

    // UX rule:
    // - Click a non-active schedule => make it active (and auto-select if not selected yet)
    // - Click the active schedule => unselect it (active becomes null)
    if (!isActive) {
      onOpen?.(show);
      if (!isSelected) onSelectionChange([...selectedShows, show]);
      return;
    }

    // isActive === true
    if (isSelected) {
      onSelectionChange(selectedShows.filter((s) => s.id !== show.id));
    }
    onOpen?.(null);
  };

  const handleOpenClick = (show: Show) => {
    const isValidSelection = show.status === 'on_sale' && !show.disabled;
    if (!isValidSelection) return;

    onOpen?.(show);

    // If user clicks caret on an unselected show, auto-select it (so TicketCategories can render and cart logic stays consistent).
    const isAlreadySelected = selectedShows.some((s) => s.id === show.id);
    if (!isAlreadySelected) {
      const updatedSelectedShows = [...selectedShows, show];
      onSelectionChange(updatedSelectedShows);
    }
  };


  return (
    <Card>
      <CardHeader title={tt("Chọn lịch", "Select Schedule")} />
      <Divider />
      <List>
        {shows.map((show) => {
          const isDisabled = show.status !== 'on_sale' || show.disabled;
          const isActive = activeShowId === show.id;

          return (
            <ListItem
              key={show.id}
              divider
              onClick={() => handleItemClick(show)} // Handle toggle on item click
              sx={{
                cursor: isDisabled ? 'default' : 'pointer',
                opacity: isDisabled ? 0.6 : 1,
                backgroundColor: isActive ? 'action.selected' : 'transparent',
              }}
            >
              <ListItemAvatar>
                <Box component="img" src={show.avatar ?? '/assets/product-5.png'} sx={{ borderRadius: 1, height: '48px', width: '48px' }} />
              </ListItemAvatar>
              <ListItemText
                primary={show.name}
                primaryTypographyProps={{ variant: 'subtitle2' }}
                secondary={
                  (show.startDateTime && show.endDateTime
                    ? `${dayjs(show.startDateTime).format('HH:mm')} - ${dayjs(show.endDateTime).format('HH:mm | DD/MM/YYYY')}`
                    : '') +
                  (show.disabled
                    ? ` | ${tt('Đang khóa bởi hệ thống', 'Locked by system')}`
                    : show.status !== 'on_sale'
                      ? show.status === 'not_opened_for_sale'
                        ? ` | ${tt('Chưa mở bán', 'Not opened for sale')}`
                        : show.status === 'temporarily_locked'
                          ? ` | ${tt('Đang tạm khóa', 'Temporarily locked')}`
                          : ''
                      : '')
                }
                secondaryTypographyProps={{ variant: 'caption' }}
              />
              <Box
                sx={{
                  ml: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  color: isDisabled ? 'text.disabled' : 'text.secondary',
                }}
              >
                <IconButton
                  size="small"
                  disabled={isDisabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenClick(show);
                  }}
                  aria-label={tt('Mở lịch', 'Open schedule')}
                >
                  <CaretRightIcon size={18} />
                </IconButton>
              </Box>
            </ListItem>
          );
        })}
      </List>
    </Card>
  );
}