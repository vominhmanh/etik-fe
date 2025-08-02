import React, { useState } from 'react';
import { Checkbox, Card, CardHeader, Divider, List, ListItem, Box, ListItemAvatar, ListItemText, IconButton, Typography, Stack, CardContent, Radio } from '@mui/material';
import dayjs from 'dayjs';
import { Show } from './page';

export interface LatestProductsProps {
  shows?: Show[];
  onSelectionChange: (selectedShow: Show) => void;  // New prop for selection handling
}

export function Schedules({ shows = [], onSelectionChange }: LatestProductsProps): React.JSX.Element {
  const [selectedShow, setSelectedShow] = useState<Show | null>();

  const handleItemClick = (show: Show) => {
    setSelectedShow(show);
    onSelectionChange(show);
  };


  return (
    <Card>
      <CardHeader title="Chọn game đấu" />
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
              <Radio
                checked={show.id === selectedShow?.id}
                onClick={(e) => e.stopPropagation()} // Prevent checkbox click from bubbling up
                onChange={() => handleItemClick(show)}
              />
            </Box>
            <ListItemAvatar>
              <Box component="img" src={'/assets/product-5.png'} sx={{ borderRadius: 1, height: '48px', width: '48px' }} />
            </ListItemAvatar>
            <ListItemText
              primary={show.name}
              secondary=
                    {show.startDateTime && show.endDateTime
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