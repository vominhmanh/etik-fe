import React from 'react';
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
import type {SxProps} from '@mui/material/styles';
import {ArrowCounterClockwise as ArrowCounterClockwiseIcon} from '@phosphor-icons/react/dist/ssr/ArrowCounterClockwise';
import {Plus as PlusIcon} from '@phosphor-icons/react/dist/ssr/Plus';
import {DotsThreeVertical as DotsThreeVerticalIcon} from '@phosphor-icons/react/dist/ssr/DotsThreeVertical';
import dayjs from 'dayjs';
import Radio from "@mui/material/Radio";

export interface Product {
  id: string;
  image: string;
  name: string;
  updatedAt: Date;
}

export interface LatestProductsProps {
  products?: Product[];
  sx?: SxProps;
}

export function Schedules({products = [], sx}: LatestProductsProps): React.JSX.Element {
  return (
    <Card sx={sx}>
      <CardHeader
        title="Chọn suất diễn"
        action={
          <IconButton href="">
            <ArrowCounterClockwiseIcon fontSize="var(--icon-fontSize-md)"/>
          </IconButton>
        }/>
      <Divider/>
      <List>
        {products.map((product, index) => (
          <ListItem
            divider={index < products.length - 1}
            key={product.id}
          >
            <Box sx={{display: 'flex', alignItems: 'center', marginRight: '10px'}}>
              <Radio
                checked
                sx={{
                  display: 'block',
                }}
              />
            </Box>
            <ListItemAvatar>
              {product.image ? (
                <Box component="img" src={product.image} sx={{borderRadius: 1, height: '48px', width: '48px'}}/>
              ) : (
                <Box
                  sx={{
                    borderRadius: 1,
                    backgroundColor: 'var(--mui-palette-neutral-200)',
                    height: '48px',
                    width: '48px',
                  }}
                />
              )}
            </ListItemAvatar>
            <ListItemText
              primary={product.name}
              primaryTypographyProps={{variant: 'subtitle1'}}
              secondary={`Updated ${dayjs(product.updatedAt).format('MMM D, YYYY')}`}
              secondaryTypographyProps={{variant: 'body2'}}
            />
            <IconButton edge="end">
              <DotsThreeVerticalIcon weight="bold"/>
            </IconButton>
          </ListItem>
        ))}
      </List>
      <Divider/>
      <CardActions sx={{justifyContent: 'flex-end'}}>
        <Button
          color="inherit"
          endIcon={<PlusIcon fontSize="var(--icon-fontSize-md)"/>}
          size="small"
          variant="text"
        >
          Suất diễn mới
        </Button>
      </CardActions>
    </Card>
  );
}
