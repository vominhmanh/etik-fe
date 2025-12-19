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
import { ArrowCounterClockwise as ArrowCounterClockwiseIcon } from '@phosphor-icons/react/dist/ssr/ArrowCounterClockwise';
import { DotsThreeVertical as DotsThreeVerticalIcon } from '@phosphor-icons/react/dist/ssr/DotsThreeVertical';
import React, { useEffect, useState } from 'react';
import { Show } from './page';
import { Ticket } from '@phosphor-icons/react/dist/ssr';
import { useTranslation } from '@/contexts/locale-context';


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
        title={`${show.name}`}
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
            {/* <Box
              sx={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}
              onClick={() => handleSelect(ticketCategory.id)}
            >
              <Checkbox
                sx={{ display: 'block' }}
                checked={selectedCategories.includes(ticketCategory.id)} // Check if the category is selected
              />
            </Box> */}
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
                  <Ticket size={32} weight="fill" />
                </Avatar>
              )}
            </ListItemAvatar>
            <ListItemText
              onClick={() => handleSelect(ticketCategory.id)} // Select when the whole item is clicked
              primary={ticketCategory.name}
              primaryTypographyProps={{ variant: 'subtitle1' }}
              secondary={
                <>
                  <div>{formatPrice(ticketCategory.price)}</div>
                  <div>{tt("Đã bán", "Sold")} {ticketCategory.sold}/{ticketCategory.quantity} {tt("vé", "tickets")} | {tt("Đã checkin", "Checked in")} {ticketCategory.checkedIn}/{ticketCategory.sold} {tt("vé", "tickets")}</div>
                </>
              }
              secondaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        ))}
      </List>
    </Card>
  );
}