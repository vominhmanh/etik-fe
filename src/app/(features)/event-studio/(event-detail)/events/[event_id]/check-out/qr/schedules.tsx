'use client';

import { Box, Card, CardHeader, Divider, List, ListItem, ListItemAvatar, ListItemText, Radio } from '@mui/material';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { Show } from './page';
import { useTranslation } from '@/contexts/locale-context';

export interface LatestProductsProps {
  shows?: Show[];
  onSelectionChange: (selectedShow: Show) => void;  // New prop for selection handling
}

export function Schedules({ shows = [], onSelectionChange }: LatestProductsProps): React.JSX.Element {
  const { tt } = useTranslation();
  const [selectedShow, setSelectedShow] = useState<Show | null>();

  const handleItemClick = (show: Show) => {
    setSelectedShow(show);
    onSelectionChange(show);
  };


  return (
    <Card>
      <CardHeader title={tt('Chọn lịch chiếu', 'Select Schedule')} />
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
              <Box component="img" src={show.avatar ?? '/assets/product-5.png'} sx={{ borderRadius: 1, height: '48px', width: '48px' }} />
            </ListItemAvatar>
            <ListItemText
              primary={show.name}
              secondary=
                    {show.startDateTime && show.endDateTime
                      ? `${dayjs(show.startDateTime).format('HH:mm')} - ${dayjs(show.endDateTime).format('HH:mm ngày DD/MM/YYYY')}`
                      : tt("Chưa xác định", "To be determined")}
              secondaryTypographyProps={{ variant: 'body2' }}
              
            />
          </ListItem>
        ))}
      </List>
    </Card>
  );
}