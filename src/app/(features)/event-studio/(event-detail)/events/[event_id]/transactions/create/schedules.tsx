import { Box, Card, CardHeader, Checkbox, Divider, List, ListItem, ListItemAvatar, ListItemText, Stack } from '@mui/material';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { Show } from './page';
import { useTranslation } from '@/contexts/locale-context';

export interface LatestProductsProps {
  shows?: Show[];
  onSelectionChange: (selectedShows: Show[]) => void;  // New prop for selection handling
}

export function Schedules({ shows = [], onSelectionChange }: LatestProductsProps): React.JSX.Element {
  const { tt } = useTranslation();
  const [selectedShows, setSelectedShows] = useState<Show[]>([]);

  const handleItemClick = (show: Show) => {
    const updatedSelectedShows = selectedShows.includes(show)
      ? selectedShows.filter((s) => s.id !== show.id)
      : [...selectedShows, show];

    // Combine all conditions to check if the ticket is valid
    const isValidSelection = show.status === 'on_sale' && !show.disabled;

    // Only proceed if all conditions are met
    if (isValidSelection) {
      setSelectedShows(updatedSelectedShows);
      onSelectionChange(updatedSelectedShows);
    }
  };


  return (
    <Card>
      <CardHeader title={tt("Chọn lịch", "Select Schedule")} />
      <Divider />
      <List>
        {shows.map((show) => (
          <ListItem
            key={show.id}
            divider
            onClick={() => handleItemClick(show)} // Handle toggle on item click
            sx={{ cursor: 'pointer' }} // Add pointer cursor for UX
          >
            <Box sx={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}>
              <Checkbox
                checked={selectedShows.includes(show)}
                onClick={(e) => e.stopPropagation()} // Prevent checkbox click from bubbling up
                onChange={() => handleItemClick(show)}
                disabled={
                  show.status !== "on_sale" ||
                  show.disabled
                }
              />
            </Box>
            <ListItemAvatar>
              <Box component="img" src={show.avatar ?? '/assets/product-5.png'} sx={{ borderRadius: 1, height: '48px', width: '48px' }} />
            </ListItemAvatar>
            <ListItemText
              primary={show.name}
              primaryTypographyProps={{ variant: 'subtitle2' }}
              secondary={(show.startDateTime && show.endDateTime
                ? `${dayjs(show.startDateTime).format('HH:mm')} - ${dayjs(show.endDateTime).format('HH:mm | DD/MM/YYYY')}` : "")
                + (show.disabled
                  ? ` | ${tt("Đang khóa bởi hệ thống", "Locked by system")}`
                  : show.status !== "on_sale"
                    ? show.status === "not_opened_for_sale"
                      ? ` | ${tt("Chưa mở bán", "Not opened for sale")}`
                      : show.status === "temporarily_locked"
                        ? ` | ${tt("Đang tạm khóa", "Temporarily locked")}`
                        : ""
                    : "")
              }
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItem>
        ))}
      </List>
    </Card>
  );
}