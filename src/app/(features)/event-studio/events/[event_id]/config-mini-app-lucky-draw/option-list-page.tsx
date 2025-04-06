'use client';

import React, { useEffect } from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import NotificationContext from '@/contexts/notification-context';
import { AxiosResponse } from 'axios';

export interface GetLuckyDrawConfigResponse {
  listType: string;
  customDrawList?: string[];
}

export interface EditLuckyDrawConfigRequest {
  listType: string;
  customDrawList: string[];
}

type OptionListProps = {
  eventId: number;
};


export interface LuckyNumberAppConfig {
  luckyNumberOptionMode: string;
  customList?: string;
}

export default function OptionList({ eventId }: OptionListProps) {
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [formValues, setFormValues] = React.useState<LuckyNumberAppConfig>({
    luckyNumberOptionMode: '',
    customList: '',
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    if (!eventId) return;

    try {
      setIsLoading(true);
      const response: AxiosResponse<GetLuckyDrawConfigResponse> = await baseHttpServiceInstance.get(
        `/event-studio/events/${eventId}/mini-app-lucky-draw/configs/get-config`
      );

      const config = response.data;
      if (config) {
        setFormValues({
          luckyNumberOptionMode: config.listType,
          customList: (config.customDrawList || []).join('\n'),
        });
      }
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit() {
    try {
      setIsLoading(true);

      // Chuyển customList (string) → string[] bằng cách tách theo dòng
      const customListArray = (formValues.customList || '')
        .split('\n')
        .map((item) => item.trim())
        .filter((item) => item); // loại bỏ dòng rỗng

      const payload: EditLuckyDrawConfigRequest = {
        listType: formValues.luckyNumberOptionMode,
        customDrawList: customListArray,
      };

      await baseHttpServiceInstance.post(
        `/event-studio/events/${eventId}/mini-app-lucky-draw/configs/edit-config`,
        payload
      );

      notificationCtx.success('Đã cập nhật cấu hình thành công!');
    } catch (error) {
      notificationCtx.error(error)
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Cấu hình danh sách quay số" />
      <Divider />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item md={12} xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Danh sách cần quay?</InputLabel>
              <Select
                label="Danh sách cần quay?"
                name="luckyNumberOptionMode"
                value={formValues?.luckyNumberOptionMode}
                onChange={(e) =>
                  setFormValues({ ...formValues, luckyNumberOptionMode: e.target.value })
                }
              >
                <MenuItem value="ticket_holders_only">Những người dùng có vé</MenuItem>
                <MenuItem value="checked_in_users_only">Những người dùng đã check-in</MenuItem>
                <MenuItem value="custom_list">Danh sách tự nhập</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {formValues.luckyNumberOptionMode === 'custom_list' && (
            <Grid item md={12} xs={12}>
              <TextField
                label="Danh sách tuỳ chọn"
                multiline
                minRows={4}
                maxRows={30}
                fullWidth
                value={formValues.customList}
                onChange={(e) => setFormValues({ ...formValues, customList: e.target.value })}
              />
            </Grid>
          )}
        </Grid>

        <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button onClick={handleSubmit} variant="contained" disabled={isLoading}>
            {isLoading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </Grid>
      </CardContent>
    </Card>
  );
}
