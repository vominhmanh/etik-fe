import { Box, Card, CardHeader, Checkbox, Divider, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { Show } from './page';

export interface LatestProductsProps {
  shows?: Show[];
  onSelectionChange: (selectedShows: Show[]) => void;  // New prop for selection handling
}

export function Schedules({ shows = [], onSelectionChange }: LatestProductsProps): React.JSX.Element {
  const [selectedShows, setSelectedShows] = useState<Show[]>([]);

  const handleItemClick = (show: Show) => {
    const updatedSelectedShows = selectedShows.includes(show)
      ? selectedShows.filter((s) => s.id !== show.id)
      : [...selectedShows, show];

    setSelectedShows(updatedSelectedShows);
    onSelectionChange(updatedSelectedShows);
  };


  return (
    <Card>
      <CardHeader title="Chọn lịch" />
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
              />
            </Box>
            <ListItemAvatar>
              <Box component="img" src={show.avatar ?? '/assets/product-5.png'} sx={{ borderRadius: 1, height: '48px', width: '48px' }} />
            </ListItemAvatar>
            <ListItemText
              primary={show.name}
              secondary={show.startDateTime && show.endDateTime
                ? `${dayjs(show.startDateTime).format('HH:mm')} - ${dayjs(show.endDateTime).format('HH:mm ngày DD/MM/YYYY')}`
                : "Chưa xác định"}
              secondaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        ))}
      </List>
    </Card>
  );
}