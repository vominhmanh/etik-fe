'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import { AxiosResponse } from 'axios';
import * as React from 'react';
import { useEffect, useState } from 'react';

import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';
import { LocalizedLink } from '@/components/homepage/localized-link';
import dayjs from 'dayjs';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';

interface Voucher {
  id: number;
  code: string;
  isUsed: boolean;
  usedAt?: string | null;
  usedByUserId?: number | null;
  usedInTransactionId?: number | null;
  useCount: number;
}

interface ShowInfo {
  id: number;
  name: string;
}

interface TicketCategoryInfo {
  id: number;
  name: string;
  show?: ShowInfo;
}

interface VoucherCampaignTicketCategory {
  id: number;
  ticketCategoryId: number;
  ticketCategory?: TicketCategoryInfo;
}

interface VoucherCampaign {
  id: number;
  name: string;
  content?: string | null;
  imageUrl?: string | null;
  codeType: string;
  codePrefix?: string | null;
  singleCode?: string | null;
  quantity?: number | null;
  maxUses?: number | null;
  visibility: string;
  validFrom: string;
  validUntil: string;
  discountType: string;
  discountValue: number;
  applicationType: string;
  maxTicketsToDiscount?: number | null;
  requireLogin: boolean;
  maxUsesPerUser?: number | null;
  minTicketsRequired?: number | null;
  maxTicketsAllowed?: number | null;
  applyToAll: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  vouchers?: Voucher[];
  ticketCategories?: VoucherCampaignTicketCategory[];
}

export default function Page({
  params,
}: {
  params: { event_id: number; campaign_id: number };
}): React.JSX.Element {
  const { tt, locale } = useTranslation();
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [campaign, setCampaign] = useState<VoucherCampaign | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [eventSlug, setEventSlug] = useState<string>('');

  const [formData, setFormData] = useState<any>({
    name: '',
    content: '',
    imageUrl: '',
    validFrom: '',
    validUntil: '',
    minTicketsRequired: null,
    minTicketsRequiredUnlimited: true,
    maxTicketsAllowed: null,
    maxTicketsAllowedUnlimited: true,
    requireLogin: false,
    maxUsesPerUser: null,
    maxUsesPerUserUnlimited: true,
    applyToAll: true,
    selectedTicketCategories: [] as number[],
  });
  const [shows, setShows] = useState<any[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleSave = async () => {
    try {
      if (!formData.name) {
        notificationCtx.warning(tt('Vui lòng nhập tên chương trình', 'Please enter campaign name'));
        return;
      }
      if (!formData.validFrom || !formData.validUntil) {
        notificationCtx.warning(tt('Vui lòng chọn thời gian sử dụng', 'Please select usage time'));
        return;
      }
      if (!formData.applyToAll && formData.selectedTicketCategories.length === 0) {
        notificationCtx.warning(tt('Vui lòng chọn ít nhất một loại vé', 'Please select at least one ticket category'));
        return;
      }

      setIsLoading(true);
      const updateData = {
        name: formData.name,
        content: formData.content,
        imageUrl: formData.imageUrl,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil,
        requireLogin: formData.requireLogin,
        minTicketsRequired: formData.minTicketsRequiredUnlimited ? null : (formData.minTicketsRequired ? Number(formData.minTicketsRequired) : null),
        maxTicketsAllowed: formData.maxTicketsAllowedUnlimited ? null : (formData.maxTicketsAllowed ? Number(formData.maxTicketsAllowed) : null),
        maxUsesPerUser: formData.maxUsesPerUserUnlimited ? null : (formData.maxUsesPerUser ? Number(formData.maxUsesPerUser) : null),
        applyToAll: formData.applyToAll,
        ticketCategories: formData.applyToAll ? [] : formData.selectedTicketCategories.map((id: number) => ({ ticketCategoryId: id })),
      };

      await baseHttpServiceInstance.put(
        `/event-studio/events/${params.event_id}/voucher-campaigns/${params.campaign_id}`,
        updateData
      );
      
      setCampaign(prev => prev ? { ...prev, ...updateData } as any : null);
      notificationCtx.success(tt('Cập nhật chiến dịch thành công', 'Campaign updated successfully'));
    } catch (error: any) {
      notificationCtx.error(tt('Lỗi khi cập nhật:', 'Error updating:') + ` ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    document.title = tt(
      'Chi tiết chiến dịch voucher | ETIK - Vé điện tử & Quản lý sự kiện',
      'Voucher Campaign Detail | ETIK - E-tickets & Event Management'
    );
  }, [tt]);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<VoucherCampaign> = await baseHttpServiceInstance.get(
          `/event-studio/events/${params.event_id}/voucher-campaigns/${params.campaign_id}`
        );
        setCampaign(response.data);
        setFormData({
          name: response.data.name || '',
          content: response.data.content || '',
          imageUrl: response.data.imageUrl || '',
          validFrom: response.data.validFrom || '',
          validUntil: response.data.validUntil || '',
          minTicketsRequired: response.data.minTicketsRequired,
          minTicketsRequiredUnlimited: response.data.minTicketsRequired === null,
          maxTicketsAllowed: response.data.maxTicketsAllowed,
          maxTicketsAllowedUnlimited: response.data.maxTicketsAllowed === null,
          requireLogin: response.data.requireLogin || false,
          maxUsesPerUser: response.data.maxUsesPerUser,
          maxUsesPerUserUnlimited: response.data.maxUsesPerUser === null,
          applyToAll: response.data.applyToAll,
          selectedTicketCategories: response.data.ticketCategories?.map((tc: any) => tc.ticketCategoryId) || [],
        });
      } catch (error: any) {
        notificationCtx.error(
          tt('Không thể tải thông tin chiến dịch.', 'Unable to load campaign.') + ` ${error?.message || error}`
        );
      } finally {
        setIsLoading(false);
      }
    };

    const fetchVouchers = async () => {
      try {
        const response: AxiosResponse<Voucher[]> = await baseHttpServiceInstance.get(
          `/event-studio/events/${params.event_id}/voucher-campaigns/${params.campaign_id}/vouchers`
        );
        setVouchers(response.data || []);
      } catch (error: any) {
        console.error('Error fetching vouchers:', error);
      }
    };

    const fetchEventSlug = async () => {
      try {
        const response: AxiosResponse<any> = await baseHttpServiceInstance.get(
          `/event-studio/events/${params.event_id}`
        );
        setEventSlug(response.data?.slug || '');
      } catch (error) {
        console.error('Error fetching event slug:', error);
      }
    };

        const fetchTicketCategories = async () => {
      try {
        const response = await baseHttpServiceInstance.get(
          `/event-studio/events/${params.event_id}/shows-ticket-categories/get-shows-with-ticket-categories`
        );
        setShows(response.data || []);
      } catch (error) {
        console.error('Error fetching ticket categories', error);
      }
    };
    fetchTicketCategories();
fetchCampaign();
    fetchVouchers();
    fetchEventSlug();
  }, [params.event_id, params.campaign_id, notificationCtx, tt]);

  const handleCopyToClipboard = (data: string) => {
    navigator.clipboard
      .writeText(data)
      .then(() => {
        notificationCtx.success(tt('Đã sao chép vào bộ nhớ tạm', 'Copied to clipboard'));
      })
      .catch(() => {
        notificationCtx.error(tt('Không thể sao chép, vui lòng thử lại', 'Failed to copy, please try again'));
      });
  };

  const handleToggleActive = async () => {
    if (!campaign) return;
    try {
      setIsLoading(true);
      await baseHttpServiceInstance.post(
        `/event-studio/events/${params.event_id}/voucher-campaigns/${params.campaign_id}/toggle-active`,
        { isActive: !campaign.isActive }
      );
      setCampaign((prev) => (prev ? { ...prev, isActive: !prev.isActive } : null));
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

  // Tính số lượng voucher đã sử dụng
  const getVoucherUsageStats = () => {
    if (!vouchers || vouchers.length === 0) {
      return { used: 0, total: 0 };
    }
    
    if (campaign?.codeType === 'single') {
      // Với single code, dùng useCount của voucher đầu tiên
      const used = vouchers[0]?.useCount || 0;
      const total = campaign.maxUses || 0;
      return { used, total };
    } else {
      // Với multiple codes, đếm số voucher đã dùng
      const used = vouchers.filter((v) => v.isUsed).length;
      const total = vouchers.length;
      return { used, total };
    }
  };

  const allTicketCategories = shows.flatMap((show) =>
    (show.ticketCategories || []).map((tc: any) => ({ ...tc, showName: show.name }))
  );

  const voucherStats = getVoucherUsageStats();

  if (!campaign) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Backdrop
        open={isLoading}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          marginLeft: '0px !important',
        }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Stack direction="row" spacing={3} justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: '1 1 auto' }}>
          <IconButton
            component={LocalizedLink}
            href={`/event-studio/events/${params.event_id}/vouchers`}
            aria-label={tt('Quay lại', 'Back')}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">{campaign.name}</Typography>
        </Stack>
        <FormControlLabel
          control={<Switch checked={campaign.isActive} onChange={handleToggleActive} />}
          label={campaign.isActive ? tt('Đang hoạt động', 'Active') : tt('Đã tắt', 'Inactive')}
        />
      </Stack>

      <Grid container spacing={3}>
        <Grid item lg={12} md={12} xs={12}>
          <Stack spacing={3}>
            {/* Thông tin chiến dịch */}
            <Card>
              <CardHeader
                title={tt('Thông tin chiến dịch', 'Campaign Information')}
                subheader={tt('Vui lòng điền các trường thông tin phía dưới.', 'Please fill in the information fields below.')}
              />
              <Divider />
              <CardContent>
                <Stack spacing={3}>
                  <FormControl fullWidth>
                    <InputLabel>{tt('Tên chương trình khuyến mãi', 'Campaign Name')}</InputLabel>
                    <OutlinedInput label={tt('Tên chương trình khuyến mãi', 'Campaign Name')} name="name" value={formData.name} onChange={handleChange} />
                  </FormControl>
                  <FormControl fullWidth>
                    <TextField
                      label={tt('Nội dung', 'Content')}
                      name="content"
                      value={formData.content || ''}
                      onChange={handleChange}
                      multiline
                      rows={4}
                      fullWidth
                    />
                    <FormHelperText>
                      {tt('Điều khoản và quy định của chương trình khuyến mãi', 'Terms and conditions of the campaign')}
                    </FormHelperText>
                  </FormControl>
                  {campaign.imageUrl && (
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        {tt('Ảnh chương trình', 'Campaign Image')}
                      </Typography>
                      <Box
                        component="img"
                        src={campaign.imageUrl}
                        alt={campaign.name}
                        sx={{
                          width: '100%',
                          maxHeight: 300,
                          objectFit: 'contain',
                          borderRadius: 1,
                        }}
                      />
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Số lượng mã */}
            <Card>
              <CardHeader
                title={tt('Số lượng mã', 'Code Quantity')}
                subheader={tt('Chọn loại mã voucher: một mã dùng nhiều lần hoặc nhiều mã mỗi mã dùng một lần', 'Choose voucher code type: single reusable code or multiple one-time codes')}
              />
              <Divider />
              <CardContent>
                <Stack spacing={3}>
                  <FormControl fullWidth>
                    <InputLabel>{tt('Loại mã', 'Code Type')}</InputLabel>
                    <OutlinedInput
                      label={tt('Loại mã', 'Code Type')}
                      value={campaign.codeType === 'single' ? tt('Một mã', 'Single Code') : tt('Nhiều mã', 'Multiple Codes')}
                      disabled
                    />
                    <FormHelperText>
                      {campaign.codeType === 'single'
                        ? tt('Một mã voucher có thể được sử dụng nhiều lần đến khi đủ số lần cho phép', 'A single voucher code can be used multiple times until reaching the allowed usage limit')
                        : tt('Hệ thống sẽ tạo nhiều mã voucher, mỗi mã chỉ có thể sử dụng một lần', 'System will generate multiple voucher codes, each can only be used once')}
                    </FormHelperText>
                  </FormControl>
                  <Grid container spacing={3}>
                    {campaign.codeType === 'single' ? (
                      <>
                        <Grid item md={6} xs={12}>
                          <FormControl fullWidth>
                            <InputLabel>{tt('Mã voucher', 'Voucher Code')}</InputLabel>
                            <OutlinedInput label={tt('Mã voucher', 'Voucher Code')} value={campaign.singleCode || ''} disabled />
                            <FormHelperText>
                              {tt('Mã voucher phải có từ 6 đến 20 ký tự. Mã này sẽ được hiển thị cho khách hàng.', 'Voucher code must be between 6 and 20 characters. This code will be displayed to customers.')}
                            </FormHelperText>
                          </FormControl>
                        </Grid>
                        <Grid item md={6} xs={12}>
                          <FormControl fullWidth>
                            <InputLabel>{tt('Số lần có thể dùng lại', 'Max Uses')}</InputLabel>
                            <OutlinedInput
                              label={tt('Số lần có thể dùng lại', 'Max Uses')}
                              value={campaign.maxUses || ''}
                              disabled
                            />
                            <FormHelperText>
                              {tt('Số lần tối đa mã voucher này có thể được sử dụng (tối đa 5000 lần)', 'Maximum number of times this voucher code can be used (max 5000 times)')}
                            </FormHelperText>
                          </FormControl>
                        </Grid>
                      </>
                    ) : (
                      <>
                        <Grid item md={6} xs={12}>
                          <FormControl fullWidth>
                            <InputLabel>{tt('Prefix mã', 'Code Prefix')}</InputLabel>
                            <OutlinedInput label={tt('Prefix mã', 'Code Prefix')} value={campaign.codePrefix || ''} disabled />
                            <FormHelperText>
                              {tt('Prefix mã phải có từ 6 đến 20 ký tự. Hệ thống sẽ tự động thêm 7 ký tự ngẫu nhiên sau prefix để tạo mã hoàn chỉnh.', 'Code prefix must be between 6 and 20 characters. System will automatically add 7 random characters after prefix to create complete codes.')}
                            </FormHelperText>
                          </FormControl>
                        </Grid>
                        <Grid item md={6} xs={12}>
                          <FormControl fullWidth>
                            <InputLabel>{tt('Số lượng', 'Quantity')}</InputLabel>
                            <OutlinedInput label={tt('Số lượng', 'Quantity')} value={campaign.quantity || ''} disabled />
                            <FormHelperText>
                              {tt('Số lượng mã voucher cần tạo (tối đa 5000 mã)', 'Number of voucher codes to generate (max 5000 codes)')}
                            </FormHelperText>
                          </FormControl>
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Stack>
              </CardContent>
            </Card>

            {/* Thiết lập hiển thị */}
            <Card>
              <CardHeader
                title={tt('Thiết lập hiển thị', 'Display Settings')}
                subheader={tt('Chọn cách hiển thị mã voucher cho khách hàng', 'Choose how voucher code is displayed to customers')}
              />
              <Divider />
              <CardContent>
                <FormControl fullWidth>
                  <InputLabel>{tt('Chế độ hiển thị', 'Display Mode')}</InputLabel>
                  <OutlinedInput
                    label={tt('Chế độ hiển thị', 'Display Mode')}
                    value={campaign.visibility === 'public' ? tt('Công khai', 'Public') : tt('Riêng tư', 'Private')}
                    disabled
                  />
                  <FormHelperText>
                    {campaign.visibility === 'public'
                      ? tt('Khách hàng sẽ nhìn thấy mã voucher ở màn hình mua vé và có thể chọn để sử dụng', 'Customers will see the voucher code on the ticket purchase screen and can select it to use')
                      : tt('Khách hàng phải tự nhập mã thì mới có thể áp dụng', 'Customers must manually enter the code to apply it')}
                  </FormHelperText>
                </FormControl>
              </CardContent>
            </Card>

            {/* Thời gian sử dụng */}
            <Card>
              <CardHeader
                title={tt('Thời gian sử dụng mã voucher', 'Voucher Usage Period')}
                subheader={tt('Thiết lập khoảng thời gian mà voucher có hiệu lực', 'Set the time period during which the voucher is valid')}
              />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item md={6} xs={12}>
                    <TextField
                      label={tt('Từ ngày', 'From Date')}
                      name="validFrom"
                      value={formData.validFrom ? dayjs(formData.validFrom).format('YYYY-MM-DDTHH:mm') : ''}
                      onChange={handleChange}
                      type="datetime-local"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                    <FormHelperText>
                      {tt('Thời điểm bắt đầu voucher có hiệu lực', 'Start time when voucher becomes valid')}
                    </FormHelperText>
                  </Grid>
                  <Grid item md={6} xs={12}>
                    <TextField
                      label={tt('Đến ngày', 'To Date')}
                      name="validUntil"
                      value={formData.validUntil ? dayjs(formData.validUntil).format('YYYY-MM-DDTHH:mm') : ''}
                      onChange={handleChange}
                      type="datetime-local"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                    <FormHelperText>
                      {tt('Thời điểm kết thúc hiệu lực của voucher', 'End time when voucher expires')}
                    </FormHelperText>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Cấu hình khuyến mãi */}
            <Card>
              <CardHeader
                title={tt('Cấu hình khuyến mãi', 'Discount Configuration')}
                subheader={tt('Thiết lập loại giảm giá và cách áp dụng cho đơn hàng', 'Configure discount type and application method for orders')}
              />
              <Divider />
              <CardContent>
                <Stack spacing={4}>
                  {/* Loại giảm giá */}
                  <Stack spacing={2}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {tt('Loại giảm giá', 'Discount Type')}
                    </Typography>
                    <FormControl fullWidth>
                      <InputLabel>{tt('Loại giảm giá', 'Discount Type')}</InputLabel>
                      <OutlinedInput
                        label={tt('Loại giảm giá', 'Discount Type')}
                        value={
                          campaign.discountType === 'amount'
                            ? tt('Theo số tiền', 'By Amount')
                            : tt('Theo phần trăm', 'By Percentage')
                        }
                        disabled
                      />
                      <FormHelperText>
                        {campaign.discountType === 'amount'
                          ? tt('Giảm giá theo số tiền cố định (VNĐ)', 'Fixed amount discount in VND')
                          : tt('Giảm giá theo phần trăm (%)', 'Percentage discount (%)')}
                      </FormHelperText>
                    </FormControl>
                  </Stack>

                  {/* Giá trị giảm giá */}
                  <Stack spacing={2}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {campaign.discountType === 'amount'
                        ? tt('Mức giảm (VNĐ)', 'Discount Amount (VND)')
                        : tt('Phần trăm giảm', 'Discount Percentage')}
                    </Typography>
                    <FormControl fullWidth>
                      <InputLabel>
                        {campaign.discountType === 'amount'
                          ? tt('Mức giảm (VNĐ)', 'Discount Amount (VND)')
                          : tt('Phần trăm giảm', 'Discount Percentage')}
                      </InputLabel>
                      <OutlinedInput
                        label={
                          campaign.discountType === 'amount'
                            ? tt('Mức giảm (VNĐ)', 'Discount Amount (VND)')
                            : tt('Phần trăm giảm', 'Discount Percentage')
                        }
                        value={formatDiscount(campaign.discountType, campaign.discountValue)}
                        disabled
                      />
                      <FormHelperText>
                        {campaign.discountType === 'amount'
                          ? tt('Nhập số tiền giảm giá (ví dụ: 50000)', 'Enter discount amount (e.g., 50000)')
                          : tt('Nhập phần trăm giảm giá (tối đa 100%)', 'Enter discount percentage (max 100%)')}
                      </FormHelperText>
                    </FormControl>
                  </Stack>

                  {/* Loại áp dụng */}
                  <Stack spacing={2}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {tt('Loại áp dụng', 'Application Type')}
                    </Typography>
                    <FormControl fullWidth>
                      <InputLabel>{tt('Loại áp dụng', 'Application Type')}</InputLabel>
                      <OutlinedInput
                        label={tt('Loại áp dụng', 'Application Type')}
                        value={
                          campaign.applicationType === 'total_order'
                            ? tt('Giảm chung trên tổng đơn hàng', 'Discount on Total Order')
                            : tt('Giảm theo vé', 'Discount per Ticket')
                        }
                        disabled
                      />
                      <FormHelperText>
                        {campaign.applicationType === 'total_order'
                          ? tt('Áp dụng giảm giá cho toàn bộ tổng tiền đơn hàng', 'Apply discount to the entire order total')
                          : tt('Áp dụng giảm giá cho từng vé trong đơn hàng', 'Apply discount to each ticket in the order')}
                      </FormHelperText>
                    </FormControl>
                  </Stack>

                  {/* Số lượng vé tối đa được giảm (chỉ khi per_ticket) */}
                  {campaign.applicationType === 'per_ticket' && (
                    <Stack spacing={2}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {tt('Số lượng vé tối đa được giảm', 'Max Tickets to Discount')}
                      </Typography>
                      <FormControl fullWidth>
                        <InputLabel>{tt('Số lượng vé tối đa được giảm', 'Max Tickets to Discount')}</InputLabel>
                        <OutlinedInput
                          label={tt('Số lượng vé tối đa được giảm', 'Max Tickets to Discount')}
                          value={campaign.maxTicketsToDiscount ? campaign.maxTicketsToDiscount : tt('Không giới hạn', 'Unlimited')}
                          disabled
                        />
                        <FormHelperText>
                          {campaign.maxTicketsToDiscount
                            ? tt('Ví dụ: Nếu đặt 5, chỉ 5 vé đầu tiên được giảm giá', 'Example: If set to 5, only the first 5 tickets will receive discount')
                            : tt('Giới hạn số lượng vé được áp dụng giảm giá trong đơn hàng', 'Limit the number of tickets that can receive discount in an order')}
                        </FormHelperText>
                      </FormControl>
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Điều kiện áp dụng voucher */}
            <Card>
              <CardHeader
                title={tt('Điều kiện áp dụng voucher', 'Voucher Application Conditions')}
                subheader={tt('Thiết lập các điều kiện về số lượng vé và số lần sử dụng', 'Set conditions for ticket quantity and usage limits')}
              />
              <Divider />
              <CardContent>
                <Stack spacing={4}>
                  <Grid container spacing={3}>
                    <Grid item md={6} xs={12}>
                      <Stack spacing={2}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {tt('Số lượng vé tối thiểu để áp dụng voucher', 'Min Tickets Required')}
                        </Typography>
                        <FormControl component="fieldset">
                          <RadioGroup
                            name="minTicketsRequiredUnlimited"
                            value={formData.minTicketsRequiredUnlimited ? 'true' : 'false'}
                            onChange={(e) =>
                              setFormData((prev: any) => ({
                                ...prev,
                                minTicketsRequiredUnlimited: e.target.value === 'true',
                              }))
                            }
                            row
                          >
                            <FormControlLabel value="true" control={<Radio />} label={tt('Không giới hạn', 'Unlimited')} />
                            <FormControlLabel value="false" control={<Radio />} label={tt('Giới hạn', 'Limited')} />
                          </RadioGroup>
                          <FormHelperText>
                            {tt('Số lượng vé tối thiểu trong đơn hàng để có thể áp dụng voucher', 'Minimum number of tickets in order to apply voucher')}
                          </FormHelperText>
                        </FormControl>
                        {!formData.minTicketsRequiredUnlimited && (
                          <FormControl fullWidth sx={{ mt: 2 }}>
                            <OutlinedInput
                              name="minTicketsRequired"
                              type="number"
                              value={formData.minTicketsRequired || ''}
                              onChange={handleChange}
                              placeholder={tt('Nhập số lượng', 'Enter quantity')}
                            />
                          </FormControl>
                        )}
                      </Stack>
                    </Grid>
                    <Grid item md={6} xs={12}>
                      <Stack spacing={2}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {tt('Số lượng vé tối đa để áp dụng voucher', 'Max Tickets Allowed')}
                        </Typography>
                        <FormControl component="fieldset">
                          <RadioGroup
                            name="maxTicketsAllowedUnlimited"
                            value={formData.maxTicketsAllowedUnlimited ? 'true' : 'false'}
                            onChange={(e) =>
                              setFormData((prev: any) => ({
                                ...prev,
                                maxTicketsAllowedUnlimited: e.target.value === 'true',
                              }))
                            }
                            row
                          >
                            <FormControlLabel value="true" control={<Radio />} label={tt('Không giới hạn', 'Unlimited')} />
                            <FormControlLabel value="false" control={<Radio />} label={tt('Giới hạn', 'Limited')} />
                          </RadioGroup>
                          <FormHelperText>
                            {tt('Số lượng vé tối đa trong đơn hàng để có thể áp dụng voucher', 'Maximum number of tickets in order to apply voucher')}
                          </FormHelperText>
                        </FormControl>
                        {!formData.maxTicketsAllowedUnlimited && (
                          <FormControl fullWidth sx={{ mt: 2 }}>
                            <OutlinedInput
                              name="maxTicketsAllowed"
                              type="number"
                              value={formData.maxTicketsAllowed || ''}
                              onChange={handleChange}
                              placeholder={tt('Nhập số lượng', 'Enter quantity')}
                            />
                          </FormControl>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                </Stack>
              </CardContent>
            </Card>

            {/* Điều kiện sử dụng */}
            <Card>
              <CardHeader
                title={tt('Điều kiện sử dụng', 'Usage Conditions')}
                subheader={tt('Thiết lập các điều kiện về đăng nhập và số lần sử dụng', 'Set conditions for login requirement and usage limits')}
              />
              <Divider />
              <CardContent>
                <Stack spacing={4}>
                  <FormControl fullWidth>
                    <InputLabel>{tt('Bắt buộc đăng nhập', 'Require Login')}</InputLabel>
                    <Select
                      name="requireLogin"
                      value={formData.requireLogin}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          requireLogin: e.target.value === true || e.target.value === 'true',
                        }))
                      }
                      label={tt('Bắt buộc đăng nhập', 'Require Login')}
                    >
                      <MenuItem value={"true"}>{tt('Có', 'Yes')}</MenuItem>
                      <MenuItem value={"false"}>{tt('Không', 'No')}</MenuItem>
                    </Select>
                    <FormHelperText>
                      {campaign.requireLogin
                        ? tt('Chỉ khách hàng đã đăng nhập mới có thể sử dụng voucher này', 'Only logged-in customers can use this voucher')
                        : tt('Khách hàng không cần đăng nhập để sử dụng voucher này', 'Customers do not need to log in to use this voucher')}
                    </FormHelperText>
                  </FormControl>
                  <Stack spacing={2}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {tt('Số lần tối đa được áp dụng mã trên một tài khoản khách hàng / email', 'Max Uses per User / Email')}
                    </Typography>
                    <FormControl component="fieldset">
                      <RadioGroup
                        name="maxUsesPerUserUnlimited"
                        value={formData.maxUsesPerUserUnlimited ? 'true' : 'false'}
                        onChange={(e) =>
                          setFormData((prev: any) => ({
                            ...prev,
                            maxUsesPerUserUnlimited: e.target.value === 'true',
                          }))
                        }
                        row
                      >
                        <FormControlLabel value="true" control={<Radio />} label={tt('Không giới hạn', 'Unlimited')} />
                        <FormControlLabel value="false" control={<Radio />} label={tt('Giới hạn', 'Limited')} />
                      </RadioGroup>
                      <FormHelperText>
                        {tt('Số lần tối đa một khách hàng (theo email/tài khoản) có thể sử dụng voucher này', 'Maximum number of times a customer (by email/account) can use this voucher')}
                      </FormHelperText>
                    </FormControl>
                    {!formData.maxUsesPerUserUnlimited && (
                      <FormControl fullWidth sx={{ mt: 2 }}>
                        <OutlinedInput
                          name="maxUsesPerUser"
                          type="number"
                          value={formData.maxUsesPerUser || ''}
                          onChange={handleChange}
                          placeholder={tt('Nhập số lần', 'Enter number of uses')}
                        />
                      </FormControl>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* Phạm vi áp dụng */}
            <Card>
              <CardHeader
                title={tt('Phạm vi áp dụng', 'Application Scope')}
                subheader={tt('Chọn phạm vi áp dụng voucher: toàn bộ hoặc chỉ các loại vé cụ thể', 'Choose voucher application scope: all or specific ticket categories')}
              />
              <Divider />
              <CardContent>
                <Stack spacing={3}>
                  <FormControl component="fieldset">
                    <RadioGroup
                      name="applyToAll"
                      value={formData.applyToAll}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          applyToAll: e.target.value === 'true',
                        }))
                      }
                      row
                    >
                      <FormControlLabel
                        value="true"
                        control={<Radio />}
                        label={tt('Toàn bộ suất diễn và toàn bộ hạng vé', 'All Shows and All Ticket Categories')}
                      />
                      <FormControlLabel
                        value="false"
                        control={<Radio />}
                        label={tt('Chọn danh sách ticket category', 'Select Ticket Categories')}
                      />
                    </RadioGroup>
                    <FormHelperText>
                      {formData.applyToAll
                        ? tt('Voucher có thể áp dụng cho tất cả các loại vé trong sự kiện', 'Voucher can be applied to all ticket types in the event')
                        : tt('Voucher chỉ áp dụng cho các loại vé được chọn bên dưới', 'Voucher only applies to selected ticket categories below')}
                    </FormHelperText>
                  </FormControl>
                  {!formData.applyToAll && (
                    <FormControl fullWidth>
                      <InputLabel>{tt('Chọn loại vé', 'Select Ticket Categories')}</InputLabel>
                      <Select
                        multiple
                        value={formData.selectedTicketCategories}
                        onChange={(e) =>
                          setFormData((prev: any) => ({
                            ...prev,
                            selectedTicketCategories: e.target.value as number[],
                          }))
                        }
                        renderValue={(selected) =>
                          (selected as number[])
                            .map(
                              (id) =>
                                allTicketCategories.find((tc) => tc.id === id)?.name || `ID: ${id}`
                            )
                            .join(', ')
                        }
                      >
                        {allTicketCategories.map((tc) => (
                          <MenuItem key={tc.id} value={tc.id}>
                            {tc.showName} - {tc.name}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        {tt('Chọn ít nhất một loại vé. Voucher chỉ áp dụng cho các loại vé đã chọn.', 'Select at least one ticket category. Voucher only applies to selected categories.')}
                      </FormHelperText>
                    </FormControl>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader title={tt('Thông tin khác', 'Other Information')} />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item md={6} xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      {tt('Ngày tạo:', 'Created at:')} {dayjs(campaign.createdAt).format('DD/MM/YYYY HH:mm')}
                    </Typography>
                  </Grid>
                  <Grid item md={6} xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      {tt('Cập nhật lần cuối:', 'Last updated:')} {dayjs(campaign.updatedAt).format('DD/MM/YYYY HH:mm')}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Bảng vouchers */}
            <Card>
              <CardHeader
                title={tt('Danh sách vouchers', 'Vouchers List')}
                subheader={
                  campaign.codeType === 'single'
                    ? tt(
                        `Đã sử dụng: ${voucherStats.used} / ${voucherStats.total} lần`,
                        `Used: ${voucherStats.used} / ${voucherStats.total} times`
                      )
                    : tt(
                        `Đã sử dụng: ${voucherStats.used} / ${voucherStats.total} mã`,
                        `Used: ${voucherStats.used} / ${voucherStats.total} codes`
                      )
                }
              />
              <Divider />
              <CardContent sx={{ p: 0, maxHeight: '500px', overflowY: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{tt('STT', 'No.')}</TableCell>
                      <TableCell>{tt('Mã voucher', 'Voucher Code')}</TableCell>
                      <TableCell>{tt('Tình trạng sử dụng', 'Usage Status')}</TableCell>
                      <TableCell>{tt('Action', 'Action')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vouchers.map((voucher, index) => (
                      <TableRow key={voucher.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography variant="body2">{voucher.code}</Typography>
                            <Tooltip title={tt('Sao chép mã khuyến mãi', 'Copy discount code')}>
                              <IconButton
                                size="small"
                                onClick={() => handleCopyToClipboard(voucher.code)}
                                sx={{ color: 'text.secondary' }}
                              >
                                <ContentCopyIcon sx={{ fontSize: '0.9rem' }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {campaign.codeType === 'single' ? (
                            <Typography>
                              {voucher.useCount} / {campaign.maxUses || 0}
                            </Typography>
                          ) : (
                            <Chip
                              label={voucher.isUsed ? tt('Đã dùng', 'Used') : tt('Chưa dùng', 'Not Used')}
                              color={voucher.isUsed ? 'default' : 'success'}
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {eventSlug ? (
                            <Tooltip title={tt('Sao chép link sử dụng', 'Copy usage link')}>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const link = `https://etik.vn/${eventSlug}?promoCode=${voucher.code}`;
                                  handleCopyToClipboard(link);
                                }}
                                color="primary"
                              >
                                <LinkIcon sx={{ fontSize: '1.1rem' }} />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="contained" onClick={handleSave} disabled={isLoading}>
                {tt('Lưu thay đổi', 'Save Changes')}
              </Button>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}

