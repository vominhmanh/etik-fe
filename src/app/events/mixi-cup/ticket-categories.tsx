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
import { Avatar, CardContent, Container, Modal, Stack, Typography } from '@mui/material';
import { cyan, deepOrange, deepPurple, green, indigo, pink, yellow } from '@mui/material/colors';
import { Show } from './page';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';


interface TicketCategoriesProps {
  show: Show;
  onCategorySelect: (ticketCategoryId: number) => void; // Pass selected category to parent
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

export function TicketCategories({ show, onCategorySelect }: TicketCategoriesProps): React.JSX.Element {
  const ticketCategories = show.ticketCategories
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null); // Track the selected category
  const [selectedPendingCategory, setSelectedPendingCategory] = useState<number | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  const typeMap: { [key: string]: string } = {
    private: 'Nội bộ',
    public: 'Công khai'
  };
  const handleSelect = (id: number) => {
    const ticketCategory = ticketCategories.find((ticketCategory) => ticketCategory.id === id);
    if (ticketCategory?.status !== 'on_sale' || ticketCategory.quantity <= ticketCategory.sold || ticketCategory.disabled) {
      return;
    }

    setSelectedPendingCategory(id);
    setModalOpen(true);
  };

  const confirmSelection = () => {
    if (selectedPendingCategory !== null) {
      setSelectedCategory(selectedPendingCategory);
      onCategorySelect(selectedPendingCategory);
      setModalOpen(false);
    }
  };

  const cancelSelection = () => {
    setSelectedPendingCategory(null);
    setModalOpen(false);
  };

  return (
    <>
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
                  disabled={ticketCategory.status !== 'on_sale' || ticketCategory.quantity <= ticketCategory.sold || ticketCategory.disabled}
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
                    {ticketCategory.name[ticketCategory.name.length - 1]}
                  </Avatar>
                )}
              </ListItemAvatar>
              <ListItemText
                onClick={() => handleSelect(ticketCategory.id)} // Set selected when the whole item is clicked
                primary={ticketCategory.name}
                primaryTypographyProps={{ variant: 'subtitle1' }}
                secondary={ticketCategory.status !== 'on_sale' ? 'Đã hết' : ticketCategory.quantity <= ticketCategory.sold ? 'Đã hết' : ticketCategory.disabled ? 'Không khả dụng' : `${formatPrice(ticketCategory.price)}`}
                secondaryTypographyProps={{ variant: 'body2' }}
              />
              <IconButton edge="end" onClick={() => { return }}>
                <DotsThreeVerticalIcon weight="bold" />
              </IconButton>
            </ListItem>
          ))}
        </List>
      </Card>
      <Modal
        open={isModalOpen}
        onClose={cancelSelection}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Container maxWidth="xl">
          <Card sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { sm: '500px', xs: '90%' },
            bgcolor: 'background.paper',
            boxShadow: 24,
          }}>
            <CardContent>
              <Stack spacing={3} direction={{ sm: 'row', xs: 'column' }} sx={{ display: 'flex', alignItems: 'center' }} >
                <Stack spacing={3} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Stack spacing={1}>
                    <Typography variant='body1' sx={{fontWeight: 'bold'}}>
                      Vui lòng đảm bảo rằng bạn chắc chắn có thể tham gia sự kiện!
                    </Typography>
                    <Typography variant='body2'>
                      Hãy dành cơ hội cho những người hâm mộ thực sự sẵn sàng đến và ủng hộ các đội tuyển.
                    </Typography>
                    <Typography variant='body2' color={'danger'}>

                    </Typography>
                  </Stack>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <Button variant='outlined' onClick={cancelSelection} size="small">
                      Suy nghĩ lại
                    </Button>
                    <Button variant='contained' onClick={confirmSelection} size="small" endIcon={<ArrowRight />}>
                      Chắc chắn
                    </Button>
                  </div>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Modal>
    </>
  );
}
