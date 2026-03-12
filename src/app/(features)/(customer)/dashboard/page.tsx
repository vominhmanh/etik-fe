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
import { LocalizedLink } from '@/components/homepage/localized-link';
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
    <Stack spacing={{ xs: 3, md: 5 }}>
      <Stack spacing={{ xs: 1, md: 1.5 }}>
        <Typography
          variant="h3"
          sx={{
            textAlign: 'center',
            fontWeight: 800,
            fontSize: { xs: '1.75rem', md: '2.5rem', lg: '3rem' },
            letterSpacing: '-0.02em',
            background: 'linear-gradient(90deg, var(--mui-palette-primary-main), var(--mui-palette-secondary-main))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            px: 2,
          }}
        >
          {tt('Chào mừng bạn đến với ETIK !', 'Welcome to ETIK !')}
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            textAlign: 'center',
            fontSize: { xs: '0.875rem', md: '1rem' },
            color: 'text.secondary',
            maxWidth: 720,
            mx: 'auto',
            px: 2,
          }}
        >
          {tt('Hệ thống Quản lý sự kiện Chuyên nghiệp, Hiện đại', 'Professional, modern event management system')}
        </Typography>
      </Stack>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid lg={4} md={6} xs={12}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, p: { xs: 2.5, sm: 3 } }}>
              <Stack direction={{ xs: 'row', md: 'column' }} spacing={2} sx={{ alignItems: 'center' }}>
                <Avatar sx={{ height: { xs: 56, md: 80 }, width: { xs: 56, md: 80 }, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                  {(user?.email[0] || "").toUpperCase()}
                </Avatar>
                <Stack spacing={0.5} sx={{ textAlign: { xs: 'left', md: 'center' }, flex: 1 }}>
                  <Typography variant="h5" sx={{ fontSize: { xs: '1.125rem', md: '1.5rem' }, fontWeight: 600 }}>{user?.fullName}</Typography>
                  {agencyInfo?.isEventAgencyAccount && (
                    <Stack direction="row" sx={{ justifyContent: { xs: 'flex-start', md: 'center' }, mt: 0.5 }}>
                      <Chip
                        size="small"
                        icon={<SealCheck weight="fill" />}
                        label={tt('Nhà tổ chức sự kiện', 'Event Organizer')}
                        color='success'
                        sx={{ fontWeight: 500, '& .MuiChip-label': { px: 1 } }}
                      />
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </CardContent>
            <Divider />
            <CardActions sx={{ p: 0 }}>
              <Button fullWidth variant="text" component={LocalizedLink as any} href={'/account'} sx={{ py: 1.5, borderRadius: 0, justifyContent: 'center' }}>
                <span>{tt('Cài đặt tài khoản', 'Account Settings')}</span>
                <ArrowRight size={18} style={{ marginLeft: 8 }} />
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid lg={4} md={6} xs={12}>
          <Card component={LocalizedLink as any} href={'/account/my-tickets'} sx={{ textDecoration: 'none', height: '100%', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 'var(--mui-shadows-4)' } }}>
            <CardContent sx={{ flexGrow: 1, p: { xs: 2.5, sm: 3 } }}>
              <Stack direction={{ xs: 'row', md: 'column' }} spacing={2} sx={{ alignItems: 'center', textAlign: { xs: 'left', md: 'center' } }}>
                <Avatar sx={{ height: { xs: 56, md: 80 }, width: { xs: 56, md: 80 }, bgcolor: 'var(--mui-palette-primary-main)' }}>
                  <TicketIcon size={32} />
                </Avatar>
                <Stack spacing={0.5} sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' }, fontWeight: 600 }}>{tt('Vé của tôi', 'My Tickets')}</Typography>
                  <Typography color="text.secondary" variant="body2" sx={{ fontSize: { xs: '0.8125rem', md: '0.875rem' }, lineHeight: 1.4 }}>
                    {tt('Xem và quản lý vé đã mua', 'View and manage your tickets')}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid lg={4} md={6} xs={12}>
          <Card component={LocalizedLink as any} href={'/event-studio/events'} sx={{ textDecoration: 'none', height: '100%', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 'var(--mui-shadows-4)' } }}>
            <CardContent sx={{ flexGrow: 1, p: { xs: 2.5, sm: 3 } }}>
              <Stack direction={{ xs: 'row', md: 'column' }} spacing={2} sx={{ alignItems: 'center', textAlign: { xs: 'left', md: 'center' } }}>
                <Avatar sx={{ height: { xs: 56, md: 80 }, width: { xs: 56, md: 80 }, bgcolor: 'var(--mui-palette-secondary-main)' }}>
                  <CodesandboxLogo size={32} />
                </Avatar>
                <Stack spacing={0.5} sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' }, fontWeight: 600 }}>{tt('Trang quản trị sự kiện', 'Event Management')}</Typography>
                  <Typography color="text.secondary" variant="body2" sx={{ fontSize: { xs: '0.8125rem', md: '0.875rem' }, lineHeight: 1.4 }}>
                    {tt('Tạo và quản trị sự kiện của bạn', 'Create and manage your events')}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
