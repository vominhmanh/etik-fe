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

type OptionListProps = {
  eventId: number;
};

export interface EditPrivacyConfigRequest {
  luckyNumberOptionMode: string;
}

export interface LuckyNumberAppConfig {
  luckyNumberOptionMode: string;
  customList?: string;
}

export interface GetPrivacyConfigResponse {
  exists: boolean;
  config: LuckyNumberAppConfig | null;
}

export default function OptionList({ eventId }: OptionListProps) {
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [formValues, setFormValues] = React.useState<LuckyNumberAppConfig>({
    luckyNumberOptionMode: '',
    customList: '',
  });

  console.log('formValues', formValues);
  return (
    <Card>
      <CardHeader title="Quyền riêng tư" />
      <Divider />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item md={12} xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Danh sách cần quay?</InputLabel>
              <Select
                label="Danh sách cần quay?"
                name="luckyNumberOptionMode"
                value={formValues?.luckyNumberOptionMode || 'everyone'}
                onChange={(e) =>
                  setFormValues({ ...formValues, luckyNumberOptionMode: e.target.value })
                }
              >
                {/* <MenuItem value="everyone">Bất cứ ai</MenuItem> */}
                {/* <MenuItem value="etik_users_only">Chỉ những người dùng ETIK</MenuItem> */}
                <MenuItem value="ticket_holders_only">Chỉ những người dùng có vé</MenuItem>
                <MenuItem value="checked_in_users_only">Chỉ những người dùng đã check-in</MenuItem>
                <MenuItem value="selection_list">Danh sách tùy chọn</MenuItem>
                {/* <MenuItem value="admin_only">Chỉ quản trị viên</MenuItem> */}
              </Select>
            </FormControl>
          </Grid>

          {formValues.luckyNumberOptionMode === 'selection_list' && (
            <Grid item md={12} xs={12}>
              <TextField
                label="Danh sách tuỳ chọn"
                multiline
                minRows={4}
                fullWidth
                value={formValues.customList}
                onChange={(e) => setFormValues({ ...formValues, customList: e.target.value })}
              />
            </Grid>
          )}
        </Grid>

        <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </Grid>
      </CardContent>
    </Card>
  );
}
