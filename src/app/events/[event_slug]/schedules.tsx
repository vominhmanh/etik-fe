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
import { Clock as ClockIcon } from "@phosphor-icons/react/dist/ssr/Clock";
import { Stack, Typography } from '@mui/material';
export type Show = {
  id: number;
  eventId: number;
  name: string;
  startDateTime: Date | null;
  endDateTime: Date | null;
  place: string | null;
}

export interface LatestProductsProps {
  shows?: Show[];
  sx?: SxProps;
}

export function Schedules({shows = [], sx}: LatestProductsProps): React.JSX.Element {
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
        {shows.map((show, index) => (
          <ListItem
            divider={index < shows.length - 1}
            key={show.id}
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
              {true ? (
                <Box component="img" src={'/assets/product-5.png'} sx={{ borderRadius: 1, height: '48px', width: '48px' }} />
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
              primary={show.name}
              primaryTypographyProps={{ variant: 'subtitle1' }}
              secondary={
                <Stack direction="row" spacing={1}>
                  <ClockIcon fontSize="var(--icon-fontSize-sm)" />
                  <Typography color="text.secondary" display="inline" variant="body2">
                    {show.startDateTime && show.endDateTime
                      ? `${show.startDateTime} - ${show.endDateTime}`
                      : "Chưa xác định"}
                  </Typography>
                </Stack>
              }
              secondaryTypographyProps={{ variant: 'body2' }}
            />
            <IconButton edge="end">
              <DotsThreeVerticalIcon weight="bold"/>
            </IconButton>
          </ListItem>
        ))}
      </List>
    </Card>
  );
}
