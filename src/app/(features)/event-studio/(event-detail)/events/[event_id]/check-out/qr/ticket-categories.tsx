"use client"

import { Avatar, Checkbox } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import { cyan, deepOrange, deepPurple, green, indigo, pink, yellow } from '@mui/material/colors';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import { DotsThreeVertical as DotsThreeVerticalIcon } from '@phosphor-icons/react/dist/ssr/DotsThreeVertical';
import React, { useEffect, useState } from 'react';
import { Show } from './page';
import { useTranslation } from '@/contexts/locale-context';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr'; // Example icons


interface TicketCategoriesProps {
  show: Show;
  onCategoriesSelect: (selectedIds: number[]) => void;
}

export function TicketCategories({ show, onCategoriesSelect }: TicketCategoriesProps): React.JSX.Element {
  const { tt } = useTranslation();
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
        subheader={tt(`Chọn hạng vé để check-out cho ${show.name}`, `Select ticket categories to check-out for ${show.name}`)}
        title={tt(`Chọn hạng vé`, `Select ticket categories`)}
        action={
          <Button
            size="small"
            onClick={() => {
              if (selectedCategories.length === ticketCategories.length) {
                setSelectedCategories([]);
              } else {
                setSelectedCategories(ticketCategories.map(tc => tc.id));
              }
            }}
          >
            {selectedCategories.length === ticketCategories.length ? tt("Bỏ chọn tất cả", "Deselect All") : tt("Chọn tất cả", "Select All")}
          </Button>
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
                  sx={{ height: '48px', width: '48px', fontSize: '2rem', borderRadius: '5px', bgcolor: ticketCategory.color }}
                  variant="square"
                >
                  <TicketIcon />
                </Avatar>
              )}
            </ListItemAvatar>
            <ListItemText
              onClick={() => handleSelect(ticketCategory.id)} // Select when the whole item is clicked
              primary={ticketCategory.name}
              primaryTypographyProps={{ variant: 'subtitle1' }}
              secondary={`${formatPrice(ticketCategory.price)} | ${tt('Đã bán', 'Sold')} ${ticketCategory.sold}/${ticketCategory.quantity} ${tt('vé', 'tickets')}`}
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