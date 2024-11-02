'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { CardMedia, Chip, MenuItem, Select, Stack } from '@mui/material';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { Bank as BankIcon, Lightning as LightningIcon, Money as MoneyIcon } from '@phosphor-icons/react/dist/ssr'; // Example icons

import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { Coins as CoinsIcon } from '@phosphor-icons/react/dist/ssr/Coins';
import { EnvelopeSimple as EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple';
import { Hash as HashIcon } from '@phosphor-icons/react/dist/ssr/Hash';
import { HouseLine as HouseLineIcon } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { MapPin as MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin';
import { SealPercent as SealPercentIcon } from '@phosphor-icons/react/dist/ssr/SealPercent';
import { StackPlus as StackPlusIcon } from '@phosphor-icons/react/dist/ssr/StackPlus';
import { Tag as TagIcon } from '@phosphor-icons/react/dist/ssr/Tag';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';
import axios, { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import CircularProgress from '@mui/material/CircularProgress';
import { useSearchParams } from 'next/navigation';
import NotificationContext from '@/contexts/notification-context';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';



export default function Page(): React.JSX.Element {
 
  return (
    <Stack spacing={3}>
      <Card sx={{
        scrollBehavior: 'smooth',
        backgroundColor: '#d1f9db',
        backgroundImage: `linear-gradient(356deg, #d1f9db 0%, #fffed9 100%)`,
      }}>
        <CardContent>
          <Stack spacing={3} direction={{ sm: 'row', xs: 'column' }} sx={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '150px', height: '150px', borderRadius: '20px', }}>
                <DotLottieReact
                  src="/assets/animations/failure.lottie"
                  loop
                  width={'100%'}
                  height={'100%'}
                  style={{
                    borderRadius: '20px'
                  }}
                  autoplay
                />
              </div>
            </div>

            <Stack spacing={3} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '450px', maxWidth: '100%' }}>
              <Typography variant="h5">Giao dịch không thành công</Typography>
              <Typography variant="body1" sx={{ textAlign: 'justify' }}>Quý khách vui lòng thử lại sau hoặc liên hệ với chúng tôi để được hỗ trợ.</Typography>
              <Typography variant="body2" sx={{ textAlign: 'justify' }}>Nếu quý khách cần hỗ trợ thêm, vui lòng gửi yêu cầu hỗ trợ <a style={{ textDecoration: 'none' }} target='_blank' href="https://forms.gle/2mogBbdUxo9A2qRk8">tại đây.</a></Typography>
            </Stack>
          </Stack>

        </CardContent>
      </Card>
    </Stack>
  );
}
