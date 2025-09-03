"use client";

import NotificationContext from '@/contexts/notification-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { Button, Card, CardContent, CardHeader, Divider, FormControl, Grid, IconButton, InputAdornment, InputLabel, MenuItem, OutlinedInput, Select } from "@mui/material";
import { Clipboard } from "@phosphor-icons/react/dist/ssr";
import { AxiosResponse } from 'axios';
import React, { useEffect } from "react";

type PrivacySettingsProps = {
  eventSlug: string;
  eventId: number;
};

export interface EditPrivacyConfigRequest {
  privacyMode: string;
}

export interface RatingAppConfig {
  privacyMode: string;
}

export interface GetPrivacyConfigResponse {
  exists: boolean;
  config: RatingAppConfig | null;
}

export default function PrivacySettings({ eventSlug, eventId }: PrivacySettingsProps) {
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [formValues, setFormValues] = React.useState<RatingAppConfig>({ privacyMode: '' });
  const handleCopyToClipboard = (data: string) => {
    navigator.clipboard.writeText(data).then(() => {
      notificationCtx.success("Đã sao chép vào bộ nhớ tạm"); // Show success message
    }).catch(() => {
      notificationCtx.warning("Không thể sao chép, vui lòng thử lại"); // Handle errors
    });
  };

  const fetchPrivacyConfig = async () => {
    if (!eventId) return;

    try {
      setIsLoading(true);
      const response: AxiosResponse<GetPrivacyConfigResponse> = await baseHttpServiceInstance.get(
        `/event-studio/events/${eventId}/mini-app-rating-online/configs/get-privacy-config`
      );

      if (response.data.exists && response.data.config) {
        setFormValues(response.data.config);
      } else {
        notificationCtx.warning("Không tìm thấy cấu hình quyền riêng tư.");
      }
    } catch (error) {
      notificationCtx.error("Lỗi khi tải cấu hình quyền riêng tư.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrivacyConfig();
  }, [eventId]);

  // Handle form value changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      privacyMode: e.target.value as string,
    }));
  };

  async function editPrivacyConfig(event_id: number, privacyMode: string) {
    if (!event_id || !privacyMode) return;
  
    try {
      setIsLoading(true);
      const response = await baseHttpServiceInstance.post(
        `/event-studio/events/${event_id}/mini-app-rating-online/configs/edit-privacy-config`,
        { privacy_mode: privacyMode }
      );
      notificationCtx.success("Cập nhật quyền riêng tư thành công!");
      return response.data;
    } catch (error) {
      notificationCtx.error("Không thể cập nhật quyền riêng tư. Vui lòng thử lại!");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }
  
  // Usage in onClick function
  const handleFormSubmit = async () => {
    if (!formValues?.privacyMode) {
      notificationCtx.error("Vui lòng chọn quyền riêng tư!");
      return;
    }
    
    await editPrivacyConfig(eventId, formValues.privacyMode);
  };


  return (
    <Card>
      <CardHeader title="Quyền riêng tư" />
      <Divider />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item md={12} xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Link truy cập ứng dụng</InputLabel>
              <OutlinedInput
                value={eventSlug}
                label="Link truy cập ứng dụng"
                name="slug"
                onChange={handleInputChange}
                startAdornment={<InputAdornment position="start">rating.etik.io.vn/</InputAdornment>}
                endAdornment={
                  <IconButton size="small" onClick={() => handleCopyToClipboard(`https://etik.vn/events/${eventSlug}`)}>
                    <Clipboard />
                  </IconButton>
                }
              />
            </FormControl>
          </Grid>

          <Grid item md={12} xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Ai được phép truy cập ứng dụng?</InputLabel>
              <Select
                label="Ai được phép truy cập ứng dụng?"
                name="privacyMode"
                value={formValues?.privacyMode || "everyone"}
                onChange={(e) => setFormValues({ ...formValues, privacyMode: e.target.value })}
              >
                <MenuItem value="everyone">Bất cứ ai</MenuItem>
                <MenuItem value="etik_users_only">Chỉ những người dùng ETIK</MenuItem>
                <MenuItem value="ticket_holders_only">Chỉ những người dùng có vé</MenuItem>
                <MenuItem value="checked_in_users_only">Chỉ những người dùng đã check-in</MenuItem>
                <MenuItem value="admin_only">Chỉ quản trị viên</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button type="submit" variant="contained" onClick={handleFormSubmit} disabled={isLoading}>
            {isLoading ? "Đang lưu..." : "Lưu"}
          </Button>
        </Grid>
      </CardContent>

    </Card>
  );
}