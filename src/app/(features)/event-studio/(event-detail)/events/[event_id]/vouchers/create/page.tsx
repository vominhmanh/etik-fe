'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
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
  TextField,
  Typography,
} from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useState } from 'react';

import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';
import { LocalizedLink } from '@/components/homepage/localized-link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface Show {
  id: number;
  name: string;
  ticketCategories: TicketCategory[];
}

interface TicketCategory {
  id: number;
  name: string;
}

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  const { tt, locale } = useTranslation();
  React.useEffect(() => {
    document.title = tt(
      'Tạo chiến dịch voucher | ETIK - Vé điện tử & Quản lý sự kiện',
      'Create Voucher Campaign | ETIK - E-tickets & Event Management'
    );
  }, [tt]);
  const router = useRouter();
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shows, setShows] = useState<Show[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    content: '',
    imageUrl: '',
    codeType: 'single' as 'single' | 'multiple',
    codePrefix: '',
    singleCode: '',
    quantity: 0,
    maxUses: 0,
    visibility: 'private' as 'public' | 'private',
    validFrom: '',
    validUntil: '',
    discountType: 'amount' as 'amount' | 'percentage',
    discountValue: 0,
    applicationType: 'total_order' as 'total_order' | 'per_ticket',
    maxTicketsToDiscount: null as number | null,
    maxTicketsToDiscountLimited: false,
    requireLogin: true,
    maxUsesPerUser: null as number | null,
    maxUsesPerUserUnlimited: true,
    minTicketsRequired: null as number | null,
    minTicketsRequiredUnlimited: true,
    maxTicketsAllowed: null as number | null,
    maxTicketsAllowedUnlimited: true,
    applyToAll: true,
    selectedTicketCategories: [] as number[],
  });

  React.useEffect(() => {
    const fetchShows = async () => {
      try {
        const response: AxiosResponse<Show[]> = await baseHttpServiceInstance.get(
          `/event-studio/events/${params.event_id}/shows-ticket-categories/get-shows-with-ticket-categories`
        );
        setShows(response.data || []);
      } catch (error) {
        console.error('Error fetching shows:', error);
      }
    };
    fetchShows();
  }, [params.event_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      // Step 1: Request presigned URL from backend
      const presignedResponse = await baseHttpServiceInstance.post('/common/s3/generate_presigned_url', {
        filename: file.name,
        content_type: file.type,
      });

      const { presignedUrl, fileUrl } = presignedResponse.data;

      // Step 2: Upload file directly to S3 using presigned URL
      await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      // Step 3: Return the public file URL
      return fileUrl; // Return the image URL
    } catch (error) {
      notificationCtx.error(tt("Lỗi tải ảnh:", "Image upload error:"), error);
      return null;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      setFormData((prev) => ({
        ...prev,
        imageUrl: imageUrl,
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.name) {
        notificationCtx.warning(tt('Tên chiến dịch không được để trống.', 'Campaign name cannot be empty.'));
        return;
      }
      if (formData.codeType === 'single' && !formData.singleCode) {
        notificationCtx.warning(tt('Mã voucher không được để trống.', 'Voucher code cannot be empty.'));
        return;
      }
      if (formData.codeType === 'single' && formData.singleCode) {
        if (formData.singleCode.length < 6 || formData.singleCode.length > 20) {
          notificationCtx.warning(tt('Mã voucher phải có từ 6 đến 20 ký tự.', 'Voucher code must be between 6 and 20 characters.'));
          return;
        }
      }
      if (formData.codeType === 'single' && !formData.maxUses) {
        notificationCtx.warning(tt('Số lần sử dụng không được để trống.', 'Max uses cannot be empty.'));
        return;
      }
      if (formData.codeType === 'multiple' && (!formData.codePrefix || !formData.quantity)) {
        notificationCtx.warning(tt('Prefix và số lượng không được để trống.', 'Prefix and quantity cannot be empty.'));
        return;
      }
      if (formData.codeType === 'multiple' && formData.codePrefix) {
        if (formData.codePrefix.length < 6 || formData.codePrefix.length > 20) {
          notificationCtx.warning(tt('Prefix mã phải có từ 6 đến 20 ký tự.', 'Code prefix must be between 6 and 20 characters.'));
          return;
        }
      }
      if (formData.codeType === 'multiple' && formData.visibility === 'public') {
        notificationCtx.warning(tt('Không thể chọn công khai nếu chế độ nhiều mã.', 'Cannot select public for multiple codes.'));
        return;
      }
      if (!formData.validFrom || !formData.validUntil) {
        notificationCtx.warning(tt('Thời gian không được để trống.', 'Time period cannot be empty.'));
        return;
      }
      if (new Date(formData.validFrom) >= new Date(formData.validUntil)) {
        notificationCtx.warning(tt('Thời gian kết thúc phải lớn hơn thời gian bắt đầu.', 'End time must be greater than start time.'));
        return;
      }
      if (!formData.discountValue || formData.discountValue <= 0) {
        notificationCtx.warning(tt('Giá trị giảm giá phải lớn hơn 0.', 'Discount value must be greater than 0.'));
        return;
      }
      if (formData.discountType === 'percentage' && formData.discountValue > 100) {
        notificationCtx.warning(tt('Phần trăm giảm giá không được vượt quá 100.', 'Percentage discount cannot exceed 100.'));
        return;
      }
      if (!formData.applyToAll && formData.selectedTicketCategories.length === 0) {
        notificationCtx.warning(tt('Phải chọn ít nhất 1 loại vé khi không áp dụng toàn bộ.', 'Must select at least 1 ticket category.'));
        return;
      }

      setIsLoading(true);
      const payload: any = {
        name: formData.name,
        content: formData.content || null,
        imageUrl: formData.imageUrl || null,
        codeType: formData.codeType,
        visibility: formData.visibility,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil,
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        applicationType: formData.applicationType,
        requireLogin: formData.requireLogin,
        applyToAll: formData.applyToAll,
      };

      if (formData.codeType === 'single') {
        payload.singleCode = formData.singleCode;
        payload.maxUses = formData.maxUses;
      } else {
        payload.codePrefix = formData.codePrefix;
        payload.quantity = formData.quantity;
      }

      if (formData.applicationType === 'per_ticket' && formData.maxTicketsToDiscountLimited) {
        payload.maxTicketsToDiscount = formData.maxTicketsToDiscount;
      }

      if (!formData.maxUsesPerUserUnlimited && formData.maxUsesPerUser) {
        payload.maxUsesPerUser = formData.maxUsesPerUser;
      }

      if (!formData.minTicketsRequiredUnlimited) {
        payload.minTicketsRequired = formData.minTicketsRequired;
      }

      if (!formData.maxTicketsAllowedUnlimited) {
        payload.maxTicketsAllowed = formData.maxTicketsAllowed;
      }

      if (!formData.applyToAll) {
        payload.ticketCategories = formData.selectedTicketCategories.map((id) => ({
          ticketCategoryId: id,
        }));
      }

      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${params.event_id}/voucher-campaigns`,
        payload
      );

      notificationCtx.success(tt('Tạo chiến dịch thành công', 'Campaign created successfully'));
      const path = `/event-studio/events/${params.event_id}/vouchers/${response.data.id}`;
      router.push(locale === 'en' ? `/en${path}` : path);
    } catch (error: any) {
      notificationCtx.error(tt('Lỗi', 'Error'), error);
    } finally {
      setIsLoading(false);
    }
  };

  const allTicketCategories = shows.flatMap((show) =>
    show.ticketCategories.map((tc) => ({ ...tc, showName: show.name }))
  );

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
          <Typography variant="h4">{tt('Tạo chiến dịch voucher', 'Create Voucher Campaign')}</Typography>
        </Stack>
      </Stack>
      <Grid container spacing={3}>
        <Grid item lg={12} md={12} xs={12}>
          <Stack spacing={3}>
            {/* Thông tin chiến dịch */}
            <Card>
              <CardHeader
                subheader={tt('Vui lòng điền các trường thông tin phía dưới.', 'Please fill in the information fields below.')}
                title={tt('Thông tin chiến dịch', 'Campaign Information')}
              />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item md={12} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>{tt('Tên chương trình khuyến mãi', 'Campaign Name')}</InputLabel>
                      <OutlinedInput
                        label={tt('Tên chương trình khuyến mãi', 'Campaign Name')}
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </FormControl>
                  </Grid>
                  <Grid item md={12} xs={12}>
                    <FormControl fullWidth>
                      <TextField
                        label={tt('Nội dung', 'Content')}
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        multiline
                        rows={4}
                      />
                      <FormHelperText>{tt('Điều khoản và quy định của chương trình khuyến mãi', 'Terms and conditions of the campaign')}</FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item md={12} xs={12}>
                    <FormControl fullWidth>
                      <Stack spacing={2}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {tt('Ảnh chương trình', 'Campaign Image')}
                        </Typography>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="image-upload"
                          type="file"
                          onChange={handleImageUpload}
                        />
                        <label htmlFor="image-upload">
                          <Button variant="outlined" component="span">
                            {tt('Chọn ảnh', 'Choose Image')}
                          </Button>
                        </label>
                        {formData.imageUrl && (
                          <Box>
                            <img
                              src={formData.imageUrl}
                              alt={tt('Ảnh chương trình', 'Campaign Image')}
                              style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                            />
                            <Button
                              variant="text"
                              color="error"
                              size="small"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  imageUrl: '',
                                }))
                              }
                              sx={{ mt: 1 }}
                            >
                              {tt('Xóa ảnh', 'Remove Image')}
                            </Button>
                          </Box>
                        )}
                      </Stack>
                    </FormControl>
                  </Grid>
                </Grid>
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
                  <FormControl component="fieldset">
                    <RadioGroup
                      name="codeType"
                      value={formData.codeType}
                      onChange={handleChange}
                      row
                    >
                      <FormControlLabel value="single" control={<Radio />} label={tt('Một mã', 'Single Code')} />
                      <FormControlLabel value="multiple" control={<Radio />} label={tt('Nhiều mã', 'Multiple Codes')} />
                    </RadioGroup>
                    <FormHelperText>
                      {formData.codeType === 'single'
                        ? tt('Một mã voucher có thể được sử dụng nhiều lần đến khi đủ số lần cho phép', 'A single voucher code can be used multiple times until reaching the allowed usage limit')
                        : tt('Hệ thống sẽ tạo nhiều mã voucher, mỗi mã chỉ có thể sử dụng một lần', 'System will generate multiple voucher codes, each can only be used once')}
                    </FormHelperText>
                  </FormControl>
                  <Grid container spacing={3}>
                    {formData.codeType === 'single' ? (
                      <>
                        <Grid item md={6} xs={12}>
                          <FormControl fullWidth required>
                            <InputLabel>{tt('Mã voucher', 'Voucher Code')}</InputLabel>
                            <OutlinedInput
                              label={tt('Mã voucher', 'Voucher Code')}
                              name="singleCode"
                              value={formData.singleCode}
                              onChange={handleChange}
                            />
                            <FormHelperText>
                              {tt('Mã voucher phải có từ 6 đến 20 ký tự. Mã này sẽ được hiển thị cho khách hàng.', 'Voucher code must be between 6 and 20 characters. This code will be displayed to customers.')}
                            </FormHelperText>
                          </FormControl>
                        </Grid>
                        <Grid item md={6} xs={12}>
                          <FormControl fullWidth required>
                            <InputLabel>{tt('Số lần có thể dùng lại', 'Max Uses')}</InputLabel>
                            <OutlinedInput
                              label={tt('Số lần có thể dùng lại', 'Max Uses')}
                              name="maxUses"
                              type="number"
                              value={formData.maxUses}
                              onChange={handleChange}
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
                          <FormControl fullWidth required>
                            <InputLabel>{tt('Prefix mã', 'Code Prefix')}</InputLabel>
                            <OutlinedInput
                              label={tt('Prefix mã', 'Code Prefix')}
                              name="codePrefix"
                              value={formData.codePrefix}
                              onChange={handleChange}
                            />
                            <FormHelperText>
                              {tt('Prefix mã phải có từ 6 đến 20 ký tự. Hệ thống sẽ tự động thêm 7 ký tự ngẫu nhiên sau prefix để tạo mã hoàn chỉnh.', 'Code prefix must be between 6 and 20 characters. System will automatically add 7 random characters after prefix to create complete codes.')}
                            </FormHelperText>
                          </FormControl>
                        </Grid>
                        <Grid item md={6} xs={12}>
                          <FormControl fullWidth required>
                            <InputLabel>{tt('Số lượng', 'Quantity')}</InputLabel>
                            <OutlinedInput
                              label={tt('Số lượng', 'Quantity')}
                              name="quantity"
                              type="number"
                              value={formData.quantity}
                              onChange={handleChange}
                            />
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
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    name="visibility"
                    value={formData.visibility}
                    onChange={handleChange}
                  >
                    <FormControlLabel
                      value="public"
                      control={<Radio />}
                      disabled={formData.codeType === 'multiple'}
                      label={
                        <Stack spacing={0.5}>
                          <Typography variant="body2">
                            {tt('Công khai', 'Public')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {tt('Khách hàng sẽ nhìn thấy mã voucher ở màn hình mua vé và có thể chọn để sử dụng', 'Customers will see the voucher code on the ticket purchase screen and can select it to use')}
                          </Typography>
                        </Stack>
                      }
                    />
                    <FormControlLabel
                      value="private"
                      control={<Radio />}
                      label={
                        <Stack spacing={0.5}>
                          <Typography variant="body2">
                            {tt('Riêng tư', 'Private')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {tt('Khách hàng phải tự nhập mã thì mới có thể áp dụng', 'Customers must manually enter the code to apply it')}
                          </Typography>
                        </Stack>
                      }
                    />
                  </RadioGroup>
                  {formData.codeType === 'multiple' && (
                    <FormHelperText>
                      {tt('Không thể chọn công khai nếu chế độ nhiều mã.', 'Cannot select public for multiple codes.')}
                    </FormHelperText>
                  )}
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
                    <FormControl fullWidth required>
                      <TextField
                        label={tt('Từ ngày', 'From Date')}
                        type="datetime-local"
                        name="validFrom"
                        value={formData.validFrom || ''}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                      />
                      <FormHelperText>
                        {tt('Thời điểm bắt đầu voucher có hiệu lực', 'Start time when voucher becomes valid')}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item md={6} xs={12}>
                    <FormControl fullWidth required>
                      <TextField
                        label={tt('Đến ngày', 'To Date')}
                        type="datetime-local"
                        name="validUntil"
                        value={formData.validUntil || ''}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                      />
                      <FormHelperText>
                        {tt('Thời điểm kết thúc hiệu lực của voucher', 'End time when voucher expires')}
                      </FormHelperText>
                    </FormControl>
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
                    <FormControl component="fieldset">
                      <RadioGroup
                        name="discountType"
                        value={formData.discountType}
                        onChange={handleChange}
                        row
                      >
                        <FormControlLabel value="amount" control={<Radio />} label={tt('Theo số tiền', 'By Amount')} />
                        <FormControlLabel value="percentage" control={<Radio />} label={tt('Theo phần trăm', 'By Percentage')} />
                      </RadioGroup>
                      <FormHelperText>
                        {formData.discountType === 'amount'
                          ? tt('Giảm giá theo số tiền cố định (VNĐ)', 'Fixed amount discount in VND')
                          : tt('Giảm giá theo phần trăm (%)', 'Percentage discount (%)')}
                      </FormHelperText>
                    </FormControl>
                  </Stack>

                  {/* Giá trị giảm giá */}
                  <Stack spacing={2}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formData.discountType === 'amount'
                        ? tt('Mức giảm (VNĐ)', 'Discount Amount (VND)')
                        : tt('Phần trăm giảm', 'Discount Percentage')}
                    </Typography>
                    <FormControl fullWidth required>
                      <InputLabel>
                        {formData.discountType === 'amount'
                          ? tt('Mức giảm (VNĐ)', 'Discount Amount (VND)')
                          : tt('Phần trăm giảm', 'Discount Percentage')}
                      </InputLabel>
                      <OutlinedInput
                        label={
                          formData.discountType === 'amount'
                            ? tt('Mức giảm (VNĐ)', 'Discount Amount (VND)')
                            : tt('Phần trăm giảm', 'Discount Percentage')
                        }
                        name="discountValue"
                        type="number"
                        value={formData.discountValue}
                        onChange={handleChange}
                      />
                      <FormHelperText>
                        {formData.discountType === 'amount'
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
                    <FormControl component="fieldset">
                      <RadioGroup
                        name="applicationType"
                        value={formData.applicationType}
                        onChange={handleChange}
                        row
                      >
                        <FormControlLabel
                          value="total_order"
                          control={<Radio />}
                          label={tt('Giảm chung trên tổng đơn hàng', 'Discount on Total Order')}
                        />
                        <FormControlLabel
                          value="per_ticket"
                          control={<Radio />}
                          label={tt('Giảm theo vé', 'Discount per Ticket')}
                        />
                      </RadioGroup>
                      <FormHelperText>
                        {formData.applicationType === 'total_order'
                          ? tt('Áp dụng giảm giá cho toàn bộ tổng tiền đơn hàng', 'Apply discount to the entire order total')
                          : tt('Áp dụng giảm giá cho từng vé trong đơn hàng', 'Apply discount to each ticket in the order')}
                      </FormHelperText>
                    </FormControl>
                  </Stack>

                  {/* Số lượng vé tối đa được giảm (chỉ khi per_ticket) */}
                  {formData.applicationType === 'per_ticket' && (
                    <Stack spacing={2}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {tt('Số lượng vé tối đa được giảm', 'Max Tickets to Discount')}
                      </Typography>
                      <FormControl component="fieldset">
                        <RadioGroup
                          name="maxTicketsToDiscountLimited"
                          value={formData.maxTicketsToDiscountLimited}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              maxTicketsToDiscountLimited: e.target.value === 'true',
                            }))
                          }
                          row
                        >
                          <FormControlLabel value="false" control={<Radio />} label={tt('Không giới hạn', 'Unlimited')} />
                          <FormControlLabel value="true" control={<Radio />} label={tt('Giới hạn', 'Limited')} />
                        </RadioGroup>
                        <FormHelperText>
                          {tt('Giới hạn số lượng vé được áp dụng giảm giá trong đơn hàng', 'Limit the number of tickets that can receive discount in an order')}
                        </FormHelperText>
                      </FormControl>
                      {formData.maxTicketsToDiscountLimited && (
                        <FormControl fullWidth>
                          <InputLabel>{tt('Số lượng vé tối đa được giảm', 'Max Tickets to Discount')}</InputLabel>
                          <OutlinedInput
                            label={tt('Số lượng vé tối đa được giảm', 'Max Tickets to Discount')}
                            name="maxTicketsToDiscount"
                            type="number"
                            value={formData.maxTicketsToDiscount || ''}
                            onChange={handleChange}
                          />
                          <FormHelperText>
                            {tt('Ví dụ: Nếu đặt 5, chỉ 5 vé đầu tiên được giảm giá', 'Example: If set to 5, only the first 5 tickets will receive discount')}
                          </FormHelperText>
                        </FormControl>
                      )}
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
                            value={formData.minTicketsRequiredUnlimited ? 'false' : 'true'}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                minTicketsRequiredUnlimited: e.target.value === 'false',
                              }))
                            }
                            row
                          >
                            <FormControlLabel value="false" control={<Radio />} label={tt('Không giới hạn', 'Unlimited')} />
                            <FormControlLabel value="true" control={<Radio />} label={tt('Giới hạn', 'Limited')} />
                          </RadioGroup>
                          <FormHelperText>
                            {tt('Số lượng vé tối thiểu trong đơn hàng để có thể áp dụng voucher', 'Minimum number of tickets in order to apply voucher')}
                          </FormHelperText>
                        </FormControl>
                        {!formData.minTicketsRequiredUnlimited && (
                          <FormControl fullWidth>
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
                            value={formData.maxTicketsAllowedUnlimited ? 'false' : 'true'}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                maxTicketsAllowedUnlimited: e.target.value === 'false',
                              }))
                            }
                            row
                          >
                            <FormControlLabel value="false" control={<Radio />} label={tt('Không giới hạn', 'Unlimited')} />
                            <FormControlLabel value="true" control={<Radio />} label={tt('Giới hạn', 'Limited')} />
                          </RadioGroup>
                          <FormHelperText>
                            {tt('Số lượng vé tối đa trong đơn hàng để có thể áp dụng voucher', 'Maximum number of tickets in order to apply voucher')}
                          </FormHelperText>
                        </FormControl>
                        {!formData.maxTicketsAllowedUnlimited && (
                          <FormControl fullWidth>
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
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.requireLogin}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            requireLogin: e.target.checked,
                          }))
                        }
                      />
                    }
                    label={
                      <Stack spacing={0.5}>
                        <Typography variant="body2">
                          {tt('Bắt buộc đăng nhập để sử dụng', 'Require login to use')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {tt('Chỉ khách hàng đã đăng nhập mới có thể sử dụng voucher này', 'Only logged-in customers can use this voucher')}
                        </Typography>
                      </Stack>
                    }
                  />
                  <Stack spacing={2}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {tt('Số lần tối đa được áp dụng mã trên một tài khoản khách hàng / email', 'Max Uses per User / Email')}
                    </Typography>
                    <FormControl component="fieldset">
                      <RadioGroup
                        name="maxUsesPerUserUnlimited"
                        value={formData.maxUsesPerUserUnlimited ? 'false' : 'true'}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            maxUsesPerUserUnlimited: e.target.value === 'false',
                          }))
                        }
                        row
                      >
                        <FormControlLabel value="false" control={<Radio />} label={tt('Không giới hạn', 'Unlimited')} />
                        <FormControlLabel value="true" control={<Radio />} label={tt('Giới hạn', 'Limited')} />
                      </RadioGroup>
                      <FormHelperText>
                        {tt('Số lần tối đa một khách hàng (theo email/tài khoản) có thể sử dụng voucher này', 'Maximum number of times a customer (by email/account) can use this voucher')}
                      </FormHelperText>
                    </FormControl>
                    {!formData.maxUsesPerUserUnlimited && (
                      <FormControl fullWidth>
                        <OutlinedInput
                          name="maxUsesPerUser"
                          type="number"
                          value={formData.maxUsesPerUser || ''}
                          onChange={handleChange}
                          placeholder={tt('Nhập số lần', 'Enter number of uses')}
                        />
                        <FormHelperText>
                          {tt('Ví dụ: Nếu đặt 2, mỗi khách hàng chỉ có thể sử dụng voucher này tối đa 2 lần', 'Example: If set to 2, each customer can use this voucher maximum 2 times')}
                        </FormHelperText>
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
                        setFormData((prev) => ({
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
                          setFormData((prev) => ({
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

            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    component={LocalizedLink}
                    href={`/event-studio/events/${params.event_id}/vouchers`}
                    disabled={isLoading}
                  >
                    {tt('Hủy', 'Cancel')}
                  </Button>
                  <Button variant="contained" onClick={handleSubmit} disabled={isLoading}>
                    {tt('Tạo chiến dịch', 'Create Campaign')}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}

