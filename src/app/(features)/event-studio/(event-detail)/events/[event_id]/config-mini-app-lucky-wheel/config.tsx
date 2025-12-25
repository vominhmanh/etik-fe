"use client";

import { baseHttpServiceInstance } from "@/services/BaseHttp.service";
import NotificationContext from "@/contexts/notification-context";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  FormLabel,
  TextField,
  Select,
  MenuItem,
  Stack,
  Typography,
  CircularProgress,
  Divider,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";

interface LuckyWheelConfig {
  id: number;
  eventId: number;
  name: string;
  status: "active" | "inactive" | "ended";
}

export default function Config({ event_id }: { event_id: number }) {
  const notificationCtx = useContext(NotificationContext);

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<LuckyWheelConfig | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "ended">("inactive");

  const fetchConfig = async () => {
    try {
      setLoading(true);

      // Get config details
      const res = await baseHttpServiceInstance.get(
        `/event-studio/events/${event_id}/mini-app-lucky-wheel/configs`
      );
      setConfig(res.data);
      setName(res.data.name);
      setStatus(res.data.status);
    } catch (error) {
      console.error("Failed to fetch config", error);
      notificationCtx.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleUpdate = async () => {
    try {
      if (!name.trim()) return notificationCtx.warning("Cảnh báo", "Vui lòng nhập tên chương trình");

      await baseHttpServiceInstance.put(
        `/event-studio/events/${event_id}/mini-app-lucky-wheel/configs/edit`,
        { name, status }
      );

      notificationCtx.success("Thành công", "Cập nhật thành công");
      fetchConfig();
    } catch (error) {
      console.error(error);
      notificationCtx.error(error);
    }
  };

  if (loading) return <CircularProgress />;

  if (!config) {
    return (
      <Stack spacing={3} sx={{ maxWidth: 800, mx: "auto", py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Cấu hình chưa được khởi tạo. Vui lòng khởi tạo ứng dụng từ trang chính.
        </Typography>
      </Stack>
    );
  }

  return (

      <Card>
        <CardHeader title="Chỉnh sửa cấu hình" />
        <Divider />
        <CardContent>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <FormLabel>Tên chương trình</FormLabel>
              <TextField
                value={name}
                onChange={(e) => setName(e.target.value)}
                size="small"
              />
            </FormControl>

            <FormControl fullWidth>
              <FormLabel>Trạng thái</FormLabel>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                size="small"
              >
                <MenuItem value="active">Đang hoạt động (Active)</MenuItem>
                <MenuItem value="inactive">Tạm dừng (Inactive)</MenuItem>
                <MenuItem value="ended">Đã kết thúc (Ended)</MenuItem>
              </Select>
            </FormControl>

            <Button variant="contained" onClick={handleUpdate}>
              Lưu thay đổi
            </Button>
          </Stack>
        </CardContent>
      </Card>
  );
}
