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
import { Show } from './page';


interface TicketCategoriesProps {
  show: Show;
  onCategorySelect: (ticketCategoryId: number) => void; // Pass selected category to parent
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

export function TicketCategories({ show, onCategorySelect }: TicketCategoriesProps): React.JSX.Element {
  const showTicketCategories = show.showTicketCategories
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null); // Track the selected category


  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  const typeMap: { [key: string]: string } = {
    private: 'Nội bộ',
    public: 'Công khai'
  };

  const handleSelect = (id: number) => {
    const showTicketCategory = showTicketCategories.find((t) => t.ticketCategory.id === id)
    if (showTicketCategory?.ticketCategory.status !== 'on_sale' || showTicketCategory.quantity <= showTicketCategory.sold || showTicketCategory.disabled) {
      return
    }
    setSelectedCategory(id);
    onCategorySelect(id);
    
  };

  return (
    <Card>
      <CardHeader
        title={`Chọn loại vé cho ${show.name}`}
        action={
          <IconButton>
            <ArrowCounterClockwiseIcon fontSize="var(--icon-fontSize-md)" />
          </IconButton>
        }
      />
      <Divider />
      <List>
        {showTicketCategories.map((showTicketCategory, index) => (
          <ListItem
            divider={index < showTicketCategories.length - 1}
            key={showTicketCategory.ticketCategory.id}
            sx={{ cursor: 'pointer' }} // Change cursor to pointer to indicate it's clickable
          >
            <Box
              sx={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}
              onClick={() => handleSelect(showTicketCategory.ticketCategory.id)}
            >
              <Radio
                sx={{ display: 'block' }}
                checked={selectedCategory === showTicketCategory.ticketCategory.id} // Controlled radio button
                disabled={showTicketCategory.ticketCategory.status !== 'on_sale' || showTicketCategory.quantity <= showTicketCategory.sold || showTicketCategory.disabled}
              />
            </Box>
            <ListItemAvatar
              onClick={() => handleSelect(showTicketCategory.ticketCategory.id)} // Set selected when the whole item is clicked
            >
              {showTicketCategory.ticketCategory.avatar ? (
                <Box component="img" src={showTicketCategory.ticketCategory.avatar} sx={{ borderRadius: 1, height: '48px', width: '48px' }} />
              ) : (
                <Avatar
                  sx={{ height: '48px', width: '48px', fontSize: '2rem', borderRadius: '5px', bgcolor: colorMap[showTicketCategory.ticketCategory.id % 8] }}
                  variant="square"
                >
                  {showTicketCategory.ticketCategory.name[showTicketCategory.ticketCategory.name.length - 1]}
                </Avatar>
              )}
            </ListItemAvatar>
            <ListItemText
              onClick={() => handleSelect(showTicketCategory.ticketCategory.id)} // Set selected when the whole item is clicked
              primary={showTicketCategory.ticketCategory.name}
              primaryTypographyProps={{ variant: 'subtitle1' }}
              secondary={ showTicketCategory.ticketCategory.status !== 'on_sale' ? 'Chưa mở bán' : showTicketCategory.quantity <= showTicketCategory.sold ? 'Đã hết' : showTicketCategory.disabled ? 'Không khả dụng' : `${formatPrice(showTicketCategory.ticketCategory.price)}`}
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
