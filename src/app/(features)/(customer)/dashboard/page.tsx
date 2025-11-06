'use client';
import NotificationContext from '@/contexts/notification-context';
import { useUser } from '@/hooks/use-user';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { useTranslation } from '@/contexts/locale-context';
import { Avatar, Chip } from '@mui/material';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { ArrowRight, SealCheck } from '@phosphor-icons/react/dist/ssr';
import { CodesandboxLogo } from '@phosphor-icons/react/dist/ssr';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';
import { LocalizedLink } from '@/components/localized-link';
import { AxiosResponse } from 'axios';
import * as React from 'react';
import { useContext, useEffect, useState } from 'react';

export interface EventAgencyInfoResponse {
  id: number;
  isEventAgencyAccount: boolean;
  eventAgencyBusinessType?: "individual" | "company";

  // Individual fields
  eventAgencyFullName?: string;
  eventAgencyPlaceOfResidence?: string;
  eventAgencyTaxCode?: string;

  // Company fields
  eventAgencyCompanyName?: string;
  eventAgencyBusinessAddress?: string;
  eventAgencyGcnIssueDate?: string;
  eventAgencyGcnIssuePlace?: string;

  // Contact Information
  eventAgencyContactFullName?: string;
  eventAgencyContactEmail?: string;
  eventAgencyContactPhoneNumber?: string;
  eventAgencyContactAddress?: string;
}

export default function Page(): React.JSX.Element {
  const { tt } = useTranslation();
  const [agencyInfo, setAgencyInfo] = useState<EventAgencyInfoResponse | null>(null);
  const notificationCtx = useContext(NotificationContext);
  const { user } = useUser();

  useEffect(() => {
    async function fetchAgencyInfo() {
      try {
        const response: AxiosResponse<EventAgencyInfoResponse> = await baseHttpServiceInstance.get("/account/event_agency/info", {}, true);
        setAgencyInfo(response.data);
      } catch (error: any) {
        if (error.status !== 403) {
          notificationCtx.error(tt("Không thể lấy thông tin đại lý sự kiện.", "Unable to fetch event agency information."));
        }
      }
    }

    fetchAgencyInfo();
  }, [tt, notificationCtx]);

  return (
    <Stack spacing={5}>
      <Stack spacing={1.5}>
        <Typography
          variant="h3"
          sx={{
            textAlign: 'center',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(90deg, var(--mui-palette-primary-main), var(--mui-palette-secondary-main))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {tt('Chào mừng bạn đến với ETIK !', 'Welcome to ETIK !')}
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            textAlign: 'center',
            color: 'text.secondary',
            maxWidth: 720,
            mx: 'auto',
          }}
        >
          {tt('Hệ thống Quản lý sự kiện Chuyên nghiệp, Hiện đại', 'Professional, modern event management system')}
        </Typography>
      </Stack>
      <Grid container spacing={3}>
        <Grid lg={4} md={6} xs={12}>
          <Card>
            <CardContent>
              <Stack spacing={2} sx={{ alignItems: 'center' }}>
                <div>
                  <Avatar sx={{ height: '80px', width: '80px', fontSize: '2rem' }}>{(user?.email[0] || "").toUpperCase()}</Avatar>
                </div>
                <Stack spacing={1} sx={{ textAlign: 'center' }}>
                  <Typography variant="h5">{user?.fullName}</Typography>
                  <Typography color="var(--mui-palette-success-400)" variant="body2">
                    {agencyInfo?.isEventAgencyAccount &&
                      <Chip
                        label={<Typography variant='body2'><SealCheck /> {tt('Tài khoản nhà tổ chức sự kiện', 'Event Organizer Account')}</Typography>}
                        color='success'
                      >
                      </Chip>
                    }
                  </Typography>

                </Stack>
              </Stack>
            </CardContent>
            <Divider />
            <CardActions>
              <Button fullWidth variant="text" component={LocalizedLink as any} href={'/account'}>
                <span>{tt('Cài đặt tài khoản', 'Account Settings')}</span>
                &nbsp;
                <ArrowRight />
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid lg={4} md={6} xs={12}>
          <Card component={LocalizedLink as any} href={'/account/my-tickets'} sx={{ textDecoration: 'none' }}>
            <CardContent>
              <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center' }}>
                <Avatar sx={{ height: '80px', width: '80px', bgcolor: 'var(--mui-palette-primary-main)' }}>
                  <TicketIcon fontSize="48px" />
                </Avatar>
                <Typography variant="h6">{tt('Vé của tôi', 'My Tickets')}</Typography>
                <Typography color="text.secondary" variant="body2">
                  {tt('Xem và quản lý vé đã mua', 'View and manage your tickets')}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid lg={4} md={6} xs={12}>
          <Card component={LocalizedLink as any} href={'/event-studio/events'} sx={{ textDecoration: 'none' }}>
            <CardContent>
              <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center' }}>
                <Avatar sx={{ height: '80px', width: '80px', bgcolor: 'var(--mui-palette-secondary-main)' }}>
                  <CodesandboxLogo fontSize="48px" />
                </Avatar>
                <Typography variant="h6">{tt('Trang quản trị sự kiện', 'Event Management')}</Typography>
                <Typography color="text.secondary" variant="body2">
                  {tt('Tạo và quản trị sự kiện của bạn', 'Create and manage your events')}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Stack>
  );
}
