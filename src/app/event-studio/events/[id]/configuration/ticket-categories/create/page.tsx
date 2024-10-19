import type {Metadata} from 'next';
import Grid from '@mui/material/Unstable_Grid2';
import {config} from '@/config';
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import * as React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardHeader from '@mui/material/CardHeader';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import {LatestProducts} from "@/components/dashboard/overview/latest-products";
import dayjs from "dayjs";
import {TicketCategories} from "@/app/event-studio/events/[id]/transactions/create/ticket-categories";
import {NumberInput} from "@/app/event-studio/events/[id]/transactions/create/number-input-with-button";


export const metadata = {title: `Overview | Dashboard | ${config.site.name}`} satisfies Metadata;

const states = [
  {value: 'alabama', label: 'Alabama'},
  {value: 'new-york', label: 'New York'},
  {value: 'san-francisco', label: 'San Francisco'},
  {value: 'los-angeles', label: 'Los Angeles'},
] as const;

export default function Page(): React.JSX.Element {
  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{flex: '1 1 auto'}}>
          <Typography variant="h4">Loại vé mới</Typography>
        </Stack>
      </Stack>
      <Grid container spacing={3}>
        <Grid lg={12} md={12} xs={12}>
          <Stack spacing={3}>
            <Card>
              <CardHeader subheader="Vui lòng điền các trường thông tin phía dưới." title="Thông tin vé"/>
              <Divider/>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Tên loại vé</InputLabel>
                      <OutlinedInput label="Name" name="name"/>
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Phân loại</InputLabel>
                      <OutlinedInput label="Type" name="type"/>
                    </FormControl>
                  </Grid>
                  <Grid md={12} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Mô tả</InputLabel>
                      <OutlinedInput label="Description" name="description" type="text"/>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <Card>
              <CardHeader
                title="Số lượng vé"
                action={<NumberInput min={1} max={9999}/>}
              />
            </Card>
            <Grid sx={{display: 'flex', justifyContent: 'flex-end', mt: '3'}}>
              <Button variant="contained">Tạo</Button>
            </Grid>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
