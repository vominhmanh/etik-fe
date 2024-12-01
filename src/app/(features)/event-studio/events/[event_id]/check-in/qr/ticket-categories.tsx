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
import { Avatar, Checkbox } from '@mui/material';
import { cyan, deepOrange, deepPurple, green, indigo, pink, yellow } from '@mui/material/colors';
import { Show } from './page';


interface TicketCategoriesProps {
  show: Show;
  onCategoriesSelect: (selectedIds: number[]) => void;
}

type ColorMap = {
  [key: number]: string
}

const colorMap: ColorMap = {
  0: deepOrange[500],
  1: deepPurple[500],
  2: green[500],
  3: cyan[500],
  4: indigo[500],
  5: pink[500],
  6: yellow[500],
  7: deepPurple[300],
};

export function TicketCategories({ show, onCategoriesSelect }: TicketCategoriesProps): React.JSX.Element {
  const ticketCategories = show.ticketCategories;
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]); // Track selected categories

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  const handleSelect = (id: number) => {
    setSelectedCategories(prevSelected => {
      const isSelected = prevSelected.includes(id);
      const newSelected = isSelected
        ? prevSelected.filter(categoryId => categoryId !== id) // Remove if already selected
        : [...prevSelected, id]; // Add if not selected
      return newSelected;
    });
  };

  useEffect(() => {
    onCategoriesSelect(selectedCategories)
  }, [selectedCategories])

  return (
    <Card>
      <CardHeader
        title={`Chọn loại vé để check-in cho ${show.name}`}
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
            sx={{ cursor: 'pointer' }}
          >
            <Box
              sx={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}
              onClick={() => handleSelect(ticketCategory.id)}
            >
              <Checkbox
                sx={{ display: 'block' }}
                checked={selectedCategories.includes(ticketCategory.id)} // Check if the category is selected
              />
            </Box>
            <ListItemAvatar
              onClick={() => handleSelect(ticketCategory.id)} // Select when the whole item is clicked
            >
              {ticketCategory.avatar ? (
                <Box component="img" src={ticketCategory.avatar} sx={{ borderRadius: 1, height: '48px', width: '48px' }} />
              ) : (
                <Avatar
                  sx={{ height: '48px', width: '48px', fontSize: '2rem', borderRadius: '5px', bgcolor: colorMap[ticketCategory.id % 8] }}
                  variant="square"
                >
                  {ticketCategory.name[ticketCategory.name.length - 1]}
                </Avatar>
              )}
            </ListItemAvatar>
            <ListItemText
              onClick={() => handleSelect(ticketCategory.id)} // Select when the whole item is clicked
              primary={ticketCategory.name}
              primaryTypographyProps={{ variant: 'subtitle1' }}
              secondary={`${formatPrice(ticketCategory.price)} | Đã bán ${ticketCategory.sold}/${ticketCategory.quantity} vé`}
              secondaryTypographyProps={{ variant: 'body2' }}
            />
            <IconButton edge="end" onClick={() => { return }}>
              <DotsThreeVerticalIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>
    </Card>
  );
}