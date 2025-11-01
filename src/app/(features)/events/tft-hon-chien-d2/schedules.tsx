import {
  Box,
  Card,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Radio,
} from '@mui/material';
import React, { useState } from 'react';
import { Show } from './page';

export interface LatestProductsProps {
  shows?: Show[];
  onSelectionChange: (selectedShows: Show[]) => void;  // keeps array signature
}

export function Schedules({ shows = [], onSelectionChange }: LatestProductsProps): React.JSX.Element {
  // maintain single selection but keep array API
  const [selectedShows, setSelectedShows] = useState<Show[]>([]);

  const handleItemClick = (show: Show) => {
    let updated: Show[];
    if (selectedShows.length && selectedShows[0].id === show.id) {
      // deselect
      updated = [];
    } else {
      // select single
      updated = [show];
    }
    // Combine all conditions to check if the ticket is valid
    const isValidSelection = show.status === 'on_sale' && !show.disabled;

    // Only proceed if all conditions are met
    if (isValidSelection) {
      setSelectedShows(updated);
      onSelectionChange(updated);
    }

  };

  return (
    <Card>
      <CardHeader title="Chọn trận đấu" />
      <Divider />
      <List>
        {shows.map((show) => (
          <ListItem
            key={show.id}
            divider
            onClick={() => handleItemClick(show)}
            sx={{ cursor: 'pointer' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}>
              <Radio
                checked={selectedShows.length > 0 && selectedShows[0].id === show.id}
                onClick={(e) => e.stopPropagation()}
                onChange={() => handleItemClick(show)}
                disabled={
                  show.status !== "on_sale" ||
                  show.disabled
                }
              />
            </Box>
            <ListItemAvatar>
              <Box
                component="img"
                src={show.avatar ?? '/assets/product-5.png'}
                sx={{ borderRadius: 1, height: '48px', width: '48px' }}
              />
            </ListItemAvatar>
            <ListItemText
              primary={show.name}
              secondary={(show.disabled
                  ? "Đang khóa bởi hệ thống"
                  : show.status !== "on_sale"
                    ? show.status === "not_opened_for_sale"
                      ? "Chưa mở"
                      : show.status === "temporarily_locked"
                        ? "Đang tạm khóa"
                        : ""
                    : "")
              }
              secondaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        ))}
      </List>
    </Card>
  );
}
