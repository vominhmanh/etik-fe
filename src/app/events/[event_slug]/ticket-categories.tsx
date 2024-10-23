"use client"

import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import { ArrowCounterClockwise as ArrowCounterClockwiseIcon } from '@phosphor-icons/react/dist/ssr/ArrowCounterClockwise';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { DotsThreeVertical as DotsThreeVerticalIcon } from '@phosphor-icons/react/dist/ssr/DotsThreeVertical';
import dayjs from 'dayjs';
import Radio from "@mui/material/Radio";
import { Avatar } from '@mui/material';
import { cyan, deepOrange, deepPurple, green, indigo, pink, yellow } from '@mui/material/colors';

export interface TicketCategory {
  id: string;
  avatar: string;
  name: string;
  updatedAt: Date;
  price: number;
  type: string;
  status: string;
}

interface TicketCategoriesProps {
  ticketCategories: TicketCategory[];
  onCategorySelect: (ticketCategoryId: string) => void; // Pass selected category to parent
}


const colorMap = {
  0: deepOrange[500],
  1: deepPurple[500],
  2: green[500],
  3: cyan[500],
  4: indigo[500],
  5: pink[500],
  6: yellow[500],
  7: deepPurple[300],
};

export function TicketCategories({ ticketCategories, onCategorySelect }: TicketCategoriesProps): React.JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // Track the selected category


  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  const typeMap: { [key: string]: string } = {
    private: 'Nội bộ',
    public: 'Công khai'
  };

  const handleSelect = (id: string) => {
    const ticketCategory = ticketCategories.find((t) => t.id === id)
    if (ticketCategory && ticketCategory?.status === 'on_sale') {
      setSelectedCategory(id);
      onCategorySelect(id);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Chọn loại vé"
        action={
          <IconButton>
            <ArrowCounterClockwiseIcon fontSize="var(--icon-fontSize-md)" />
          </IconButton>
        }
      />
      <Divider />
      <List>
        {ticketCategories.map((ticketCategory, index) => (
          <ListItem
            divider={index < ticketCategories.length - 1}
            key={ticketCategory.id}
            sx={{ cursor: 'pointer' }} // Change cursor to pointer to indicate it's clickable
          >
            <Box
              sx={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}
              onClick={() => handleSelect(ticketCategory.id)}
            >
              <Radio
                sx={{ display: 'block' }}
                checked={selectedCategory === ticketCategory.id} // Controlled radio button
                disabled={ticketCategory.status !== 'on_sale'}
              />
            </Box>
            <ListItemAvatar
              onClick={() => handleSelect(ticketCategory.id)} // Set selected when the whole item is clicked
            >
              {ticketCategory.avatar ? (
                <Box component="img" src={ticketCategory.avatar} sx={{ borderRadius: 1, height: '48px', width: '48px' }} />
              ) : (
                <Avatar
                  sx={{ height: '48px', width: '48px', fontSize: '2rem', borderRadius: '5px', bgcolor: colorMap[ticketCategory.id % 8] }}
                  variant="square"
                >
                  {ticketCategory.name[0]}
                </Avatar>
              )}
            </ListItemAvatar>
            <ListItemText
              onClick={() => handleSelect(ticketCategory.id)} // Set selected when the whole item is clicked
              primary={ticketCategory.name}
              primaryTypographyProps={{ variant: 'subtitle1' }}
              secondary={`${formatPrice(ticketCategory.price)}`}
              secondaryTypographyProps={{ variant: 'body2' }}
            />
            <IconButton edge="end" onClick={() => { return }}>
              <DotsThreeVerticalIcon weight="bold" />
            </IconButton>
          </ListItem>
        ))}
      </List>
    </Card>
  );
}
