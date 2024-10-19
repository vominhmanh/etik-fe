import type { Metadata } from 'next';
import Grid from '@mui/material/Unstable_Grid2';
import { config } from '@/config';
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
import { LatestProducts } from "@/components/dashboard/overview/latest-products";
import dayjs from "dayjs";
import { TicketCategories } from "@/app/event-studio/events/[id]/transactions/create/ticket-categories";
import { NumberInput } from "@/app/event-studio/events/[id]/transactions/create/number-input-with-button";
import { Schedules } from './schedules';


export const metadata = { title: `Overview | Dashboard | ${config.site.name}` } satisfies Metadata;

const states = [
  { value: 'alabama', label: 'Alabama' },
  { value: 'new-york', label: 'New York' },
  { value: 'san-francisco', label: 'San Francisco' },
  { value: 'los-angeles', label: 'Los Angeles' },
] as const;

export default function Page(): React.JSX.Element {
  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Tạo vé mới</Typography>
        </Stack>
      </Stack>
      <Grid container spacing={3}>
        <Grid lg={4} md={6} xs={12}>
          <Stack spacing={3}>
            <TicketCategories
              products={[
                {
                  id: 'PRD-005',
                  name: 'Soja & Co. Eucalyptus',
                  image: '/assets/product-5.png',
                  updatedAt: dayjs().subtract(18, 'minutes').subtract(5, 'hour').toDate(),
                },
                {
                  id: 'PRD-004',
                  name: 'Necessaire Body Lotion',
                  image: '/assets/product-4.png',
                  updatedAt: dayjs().subtract(41, 'minutes').subtract(3, 'hour').toDate(),
                },
                {
                  id: 'PRD-003',
                  name: 'Ritual of Sakura',
                  image: '/assets/product-3.png',
                  updatedAt: dayjs().subtract(5, 'minutes').subtract(3, 'hour').toDate(),
                },
                {
                  id: 'PRD-002',
                  name: 'Lancome Rouge',
                  image: '/assets/product-2.png',
                  updatedAt: dayjs().subtract(23, 'minutes').subtract(2, 'hour').toDate(),
                },
                {
                  id: 'PRD-001',
                  name: 'Erbology Aloe Vera',
                  image: '/assets/product-1.png',
                  updatedAt: dayjs().subtract(10, 'minutes').toDate(),
                },
              ]}
            />
            <Schedules
              products={[
                {
                  id: 'PRD-009',
                  name: 'Suất diễn mặc định',
                  image: '/assets/product-5.png',
                  updatedAt: dayjs().subtract(18, 'minutes').subtract(5, 'hour').toDate(),
                }
              ]}
            />
          </Stack>
        </Grid>
        <Grid lg={8} md={6} xs={12}>
          <Stack spacing={3}>
            <Card>
              <CardHeader subheader="Vui lòng điền các trường thông tin phía dưới." title="Thông tin người mua" />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Họ và tên</InputLabel>
                      <OutlinedInput label="First name" name="name" />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Email</InputLabel>
                      <OutlinedInput label="Last name" name="organizer" />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Số điện thoại</InputLabel>
                      <OutlinedInput label="Email address" name="email" />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Địa chỉ</InputLabel>
                      <OutlinedInput label="Phone number" name="phone_number" type="tel" />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <Card>
              <CardHeader
                title="Số lượng vé"
                subheader="Vui lòng điền các trường thông tin phía dưới."
                action={<NumberInput min={1} max={99} />}
              />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Họ và tên</InputLabel>
                      <OutlinedInput label="First name" name="name" />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Email</InputLabel>
                      <OutlinedInput label="Last name" name="organizer" />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Số điện thoại</InputLabel>
                      <OutlinedInput label="Email address" name="email" />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Địa chỉ</InputLabel>
                      <OutlinedInput label="Phone number" name="phone_number" type="tel" />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: '3' }}>
              <Button variant="contained">Tạo</Button>
            </Grid>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
