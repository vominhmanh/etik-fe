import * as React from 'react';
import type {Metadata} from 'next';
import Grid from '@mui/material/Unstable_Grid2';

import {config} from '@/config';
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {Upload as UploadIcon} from "@phosphor-icons/react/dist/ssr/Upload";
import {Download as DownloadIcon} from "@phosphor-icons/react/dist/ssr/Download";
import {Eye as EyeIcon} from "@phosphor-icons/react/dist/ssr/Eye";
import {Clock as ClockIcon} from "@phosphor-icons/react/dist/ssr/Clock";
import {MapPin as MapPinIcon} from "@phosphor-icons/react/dist/ssr/MapPin";
import {Plus as PlusIcon} from "@phosphor-icons/react/dist/ssr/Plus";
import Card from "@mui/material/Card";
import {CardMedia} from "@mui/material";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import { EventsFilters } from '@/components/events/event/events-filters';

export const metadata = {title: `Overview | Dashboard | ${config.site.name}`} satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{flex: '1 1 auto'}}>
          <Typography variant="h4">Sự kiện</Typography>
          <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}>
            <Button color="inherit" startIcon={<UploadIcon fontSize="var(--icon-fontSize-md)"/>}>
              Import
            </Button>
            <Button color="inherit" startIcon={<DownloadIcon fontSize="var(--icon-fontSize-md)"/>}>
              Export
            </Button>
          </Stack>
        </Stack>
        <div>
          <Button startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)"/>} variant="contained">
            Thêm
          </Button>
        </div>
      </Stack>
      <EventsFilters />
      <Grid container spacing={3}>
        <Grid lg={4} sm={6} xs={12}>
          <Card>
            <CardMedia
              sx={{height: 140}}
              image="https://mui.com/static/images/cards/contemplative-reptile.jpg"
              title="green iguana"
            />
            <CardContent>
              <Typography gutterBottom variant="h5" component="div">
                REFUND MEETING ĐÀ NẴNG
              </Typography>
              <Typography variant="body2" sx={{color: 'text.secondary'}}>
                Lizards are a widespread group of squamate reptiles, with over 6,000
                species, ranging across all continents except Antarctica
              </Typography>
              <Stack direction="column" spacing={2} sx={{alignItems: 'left', mt: 2}}>
                <Stack sx={{alignItems: 'left'}} direction="row" spacing={1}>
                  <ClockIcon fontSize="var(--icon-fontSize-sm)"/>
                  <Typography color="text.secondary" display="inline" variant="body2">
                    17:30 20/10/2024
                  </Typography>
                </Stack>
                <Stack sx={{alignItems: 'left'}} direction="row" spacing={1}>
                  <MapPinIcon fontSize="var(--icon-fontSize-sm)"/>
                  <Typography color="text.secondary" display="inline" variant="body2">
                    Số 3, đường Châu Văn Liêm, quận Nam Từ Liêm, Hà Nội
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
            <Divider/>
            <Stack direction="row" spacing={2} sx={{alignItems: 'center', justifyContent: 'space-between', p: 1}}>
              <Stack sx={{alignItems: 'center'}} direction="row" spacing={1}>
                <Button href="/event-studio/events/1" size="small" startIcon={<EyeIcon/>}>Xem chi tiết</Button>
              </Stack>
              <Stack sx={{alignItems: 'center'}} direction="row" spacing={1}>
                {/*<DownloadIcon fontSize="var(--icon-fontSize-sm)"/>*/}
                {/*<Typography color="text.secondary" display="inline" variant="body2">*/}
                {/*  {integration.installs} installs*/}
                {/*</Typography>*/}
              </Stack>
            </Stack>
          </Card>
        </Grid>
        <Grid lg={4} sm={6} xs={12}>
          {/* <TotalCustomers diff={16} trend="down" sx={{height: '100%'}} value="1.6k"/> */}
        </Grid>
        <Grid lg={4} sm={6} xs={12}>
          {/* <TasksProgress sx={{height: '100%'}} value={75.5}/> */}
        </Grid>
        {/* <Grid lg={8} xs={12}>
          <Sales
            chartSeries={[
              {name: 'This year', data: [18, 16, 5, 8, 3, 14, 14, 16, 17, 19, 18, 20]},
              {name: 'Last year', data: [12, 11, 4, 6, 2, 9, 9, 10, 11, 12, 13, 13]},
            ]}
            sx={{height: '100%'}}
          />
        </Grid>
        <Grid lg={4} md={6} xs={12}>
          <Traffic chartSeries={[63, 15, 22]} labels={['Desktop', 'Tablet', 'Phone']} sx={{height: '100%'}}/>
        </Grid>
        <Grid lg={4} md={6} xs={12}>
          <LatestProducts
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
            sx={{height: '100%'}}
          />
        </Grid>
        <Grid lg={8} md={12} xs={12}>
          <LatestOrders
            orders={[
              {
                id: 'ORD-007',
                customer: {name: 'Ekaterina Tankova'},
                amount: 30.5,
                status: 'pending',
                createdAt: dayjs().subtract(10, 'minutes').toDate(),
              },
              {
                id: 'ORD-006',
                customer: {name: 'Cao Yu'},
                amount: 25.1,
                status: 'delivered',
                createdAt: dayjs().subtract(10, 'minutes').toDate(),
              },
              {
                id: 'ORD-004',
                customer: {name: 'Alexa Richardson'},
                amount: 10.99,
                status: 'refunded',
                createdAt: dayjs().subtract(10, 'minutes').toDate(),
              },
              {
                id: 'ORD-003',
                customer: {name: 'Anje Keizer'},
                amount: 96.43,
                status: 'pending',
                createdAt: dayjs().subtract(10, 'minutes').toDate(),
              },
              {
                id: 'ORD-002',
                customer: {name: 'Clarke Gillebert'},
                amount: 32.54,
                status: 'delivered',
                createdAt: dayjs().subtract(10, 'minutes').toDate(),
              },
              {
                id: 'ORD-001',
                customer: {name: 'Adam Denisov'},
                amount: 16.76,
                status: 'delivered',
                createdAt: dayjs().subtract(10, 'minutes').toDate(),
              },
            ]}
            sx={{height: '100%'}}
          />
        </Grid> */}
      </Grid>
    </Stack>
  );
}
