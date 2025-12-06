'use client';

import React, { useContext, useEffect, useState } from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { AxiosResponse } from 'axios';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { LocalizedLink } from '@/components/localized-link';
import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';
import dayjs from 'dayjs';

interface VoucherCampaign {
  id: number;
  name: string;
  imageUrl?: string | null;
  validFrom: string;
  validUntil: string;
  discountType: string;
  discountValue: number;
  isActive: boolean;
  codeType: string;
  totalVouchers: number;
  usedVouchers: number;
}

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  const { tt } = useTranslation();
  const notificationCtx = useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<VoucherCampaign[]>([]);

  useEffect(() => {
    document.title = tt(
      'Danh sách chiến dịch voucher | ETIK - Vé điện tử & Quản lý sự kiện',
      'Voucher Campaigns List | ETIK - E-tickets & Event Management'
    );
  }, [tt]);

  // Fetch campaigns
  useEffect(() => {
    let isCancelled = false;
    const fetchCampaigns = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<VoucherCampaign[]> = await baseHttpServiceInstance.get(
          `/event-studio/events/${params.event_id}/voucher-campaigns`
        );
        if (response.status === 200 && !isCancelled) {
          setCampaigns(response.data || []);
        }
      } catch (error: any) {
        if (!isCancelled) {
          notificationCtx.error(
            tt('Không thể tải danh sách chiến dịch.', 'Unable to load campaigns.') +
              ` ${error?.message || error}`
          );
          setCampaigns([]);
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };
    fetchCampaigns();
    return () => {
      isCancelled = true;
    };
  }, [params.event_id, notificationCtx, tt]);

  const handleToggleActive = async (campaignId: number, currentActive: boolean) => {
    try {
      setIsLoading(true);
      await baseHttpServiceInstance.post(
        `/event-studio/events/${params.event_id}/voucher-campaigns/${campaignId}/toggle-active`,
        { isActive: !currentActive }
      );
      setCampaigns((prev) =>
        prev.map((campaign) =>
          campaign.id === campaignId ? { ...campaign, isActive: !currentActive } : campaign
        )
      );
      notificationCtx.success(
        tt('Đã cập nhật trạng thái chiến dịch!', 'Campaign status updated successfully!')
      );
    } catch (error: any) {
      notificationCtx.error(
        tt('Lỗi khi cập nhật trạng thái:', 'Error updating status:') + ` ${error.message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDiscount = (type: string, value: number) => {
    if (type === 'percentage') {
      return `${value}%`;
    }
    return `${value.toLocaleString('vi-VN')} đ`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5">
          {tt('Danh sách chiến dịch voucher', 'Voucher Campaigns List')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<PlusIcon />}
          disabled={isLoading}
          component={LocalizedLink}
          href={`/event-studio/events/${params.event_id}/vouchers/create`}
        >
          {tt('Tạo chiến dịch mới', 'Create New Campaign')}
        </Button>
      </Stack>

      {isLoading && campaigns.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              {tt('Chưa có chiến dịch nào. Hãy tạo chiến dịch mới!', 'No campaigns yet. Create a new campaign!')}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {campaigns.map((campaign) => (
            <Grid item xs={12} sm={6} md={4} key={campaign.id}>
              <Card>
                <CardActionArea
                  component={LocalizedLink}
                  href={`/event-studio/events/${params.event_id}/vouchers/${campaign.id}`}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      {campaign.imageUrl && (
                        <Box
                          component="img"
                          src={campaign.imageUrl}
                          alt={campaign.name}
                          sx={{
                            width: '100%',
                            height: 150,
                            objectFit: 'cover',
                            borderRadius: 1,
                          }}
                        />
                      )}
                      <Typography variant="h6" component="div">
                        {campaign.name}
                      </Typography>
                      <Stack spacing={1}>
                        <Typography variant="body2" color="text.secondary">
                          {tt('Thời gian:', 'Period:')}{' '}
                          {dayjs(campaign.validFrom).format('DD/MM/YYYY HH:mm')} -{' '}
                          {dayjs(campaign.validUntil).format('DD/MM/YYYY HH:mm')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {tt('Giảm giá:', 'Discount:')} {formatDiscount(campaign.discountType, campaign.discountValue)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {tt('Loại mã:', 'Code Type:')}{' '}
                          {campaign.codeType === 'single'
                            ? tt('Một mã', 'Single Code')
                            : tt('Nhiều mã', 'Multiple Codes')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {tt('Sử dụng:', 'Usage:')} {campaign.usedVouchers}/{campaign.totalVouchers}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={campaign.isActive ? tt('Đang hoạt động', 'Active') : tt('Đã tắt', 'Inactive')}
                          color={campaign.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </Stack>
                    </Stack>
                  </CardContent>
                </CardActionArea>
                <CardActions sx={{ px: 2, py: 1.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={campaign.isActive}
                          onChange={() => handleToggleActive(campaign.id, campaign.isActive)}
                          size="small"
                        />
                      }
                      label={tt('Bật/Tắt chiến dịch', 'Toggle Campaign')}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Tooltip
                      title={
                        <Box>
                          <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
                            {tt('Bật:', 'On:')}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {tt(
                              'Voucher sẽ có thể được sử dụng trong thời gian diễn ra chiến dịch',
                              'Voucher can be used during the campaign period'
                            )}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
                            {tt('Tắt:', 'Off:')}
                          </Typography>
                          <Typography variant="body2">
                            {tt(
                              'Voucher sẽ không được sử dụng trong bất kì trường hợp nào',
                              'Voucher cannot be used under any circumstances'
                            )}
                          </Typography>
                        </Box>
                      }
                      arrow
                      placement="top"
                    >
                      <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

