"use client";

import { baseHttpServiceInstance } from "@/services/BaseHttp.service";
import NotificationContext from "@/contexts/notification-context";

import { useContext, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import { Pencil, Plus, List } from "@phosphor-icons/react/dist/ssr";

interface VotingCategory {
  id: number;
  eventId: number;
  name: string;
  description: string | null;
  maxVotesPerUserTotal: number | null;
  maxVotesPerUserDaily: number | null;
  allowMultipleNominees: boolean;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface VotingCategoryFormData {
  name: string;
  description: string;
  maxVotesPerUserTotal: number | null;
  maxVotesPerUserDaily: number | null;
  allowMultipleNominees: boolean;
  startAt: string;
  endAt: string;
}

export function VotingCategories({ event_id }: { event_id: number }) {
  const notificationCtx = useContext(NotificationContext);

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<VotingCategory[]>([]);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<VotingCategory | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<VotingCategoryFormData>({
    name: "",
    description: "",
    maxVotesPerUserTotal: null,
    maxVotesPerUserDaily: null,
    allowMultipleNominees: true,
    startAt: "",
    endAt: "",
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await baseHttpServiceInstance.get(
        `/event-studio/events/${event_id}/mini-app-voting/categories`
      );
      setCategories(response.data || []);
    } catch (error: any) {
      notificationCtx.error(error?.response?.data?.detail || "Không thể tải danh sách hạng mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (event_id) {
      fetchCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event_id]);

  const handleOpenCreateModal = () => {
    setFormData({
      name: "",
      description: "",
      maxVotesPerUserTotal: null,
      maxVotesPerUserDaily: null,
      allowMultipleNominees: true,
      startAt: "",
      endAt: "",
    });
    setOpenCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setOpenCreateModal(false);
  };

  const handleOpenEditModal = (category: VotingCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      maxVotesPerUserTotal: category.maxVotesPerUserTotal,
      maxVotesPerUserDaily: category.maxVotesPerUserDaily,
      allowMultipleNominees: category.allowMultipleNominees,
      startAt: category.startAt ? category.startAt.substring(0, 16) : "",
      endAt: category.endAt ? category.endAt.substring(0, 16) : "",
    });
    setOpenEditModal(true);
  };

  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setEditingCategory(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      notificationCtx.error("Vui lòng nhập tên hạng mục");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name,
        description: formData.description || null,
        maxVotesPerUserTotal: formData.maxVotesPerUserTotal || null,
        maxVotesPerUserDaily: formData.maxVotesPerUserDaily || null,
        allowMultipleNominees: formData.allowMultipleNominees,
        startAt: formData.startAt ? new Date(formData.startAt).toISOString() : null,
        endAt: formData.endAt ? new Date(formData.endAt).toISOString() : null,
      };

      if (editingCategory) {
        // Update
        await baseHttpServiceInstance.put(
          `/event-studio/events/${event_id}/mini-app-voting/categories/${editingCategory.id}`,
          payload
        );
        notificationCtx.success("Cập nhật hạng mục thành công");
        handleCloseEditModal();
      } else {
        // Create
        await baseHttpServiceInstance.post(
          `/event-studio/events/${event_id}/mini-app-voting/categories`,
          payload
        );
        notificationCtx.success("Tạo hạng mục thành công");
        handleCloseCreateModal();
      }

      fetchCategories();
    } catch (error: any) {
      notificationCtx.error(error?.response?.data?.detail || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return "-";
    return new Date(dateTime).toLocaleString("vi-VN");
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Hạng mục bình chọn"
          action={
            <Button
              variant="contained"
              startIcon={<Plus />}
              onClick={handleOpenCreateModal}
            >
              Thêm hạng mục
            </Button>
          }
        />
        <Divider />
        <CardContent sx={{ padding: 0 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", padding: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>STT</TableCell>
                    <TableCell>Tên hạng mục</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell>Tối đa tổng</TableCell>
                    <TableCell>Tối đa mỗi ngày</TableCell>
                    <TableCell>Nhiều đề cử</TableCell>
                    <TableCell>Bắt đầu</TableCell>
                    <TableCell>Kết thúc</TableCell>
                    <TableCell align="right">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <Typography variant="body2" align="center">
                          Chưa có hạng mục nào
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category, index) => (
                      <TableRow key={category.id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>
                          {category.description || "-"}
                        </TableCell>
                        <TableCell>
                          {category.maxVotesPerUserTotal ?? "Không giới hạn"}
                        </TableCell>
                        <TableCell>
                          {category.maxVotesPerUserDaily ?? "Không giới hạn"}
                        </TableCell>
                        <TableCell>
                          {category.allowMultipleNominees ? "Có" : "Không"}
                        </TableCell>
                        <TableCell>{formatDateTime(category.startAt)}</TableCell>
                        <TableCell>{formatDateTime(category.endAt)}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton
                              size="small"
                              onClick={() => {
                                // TODO: Navigate to nominees list
                              }}
                              title="Xem danh sách đề cử"
                            >
                              <List />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditModal(category)}
                              title="Chỉnh sửa"
                            >
                              <Pencil />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={openCreateModal} onClose={handleCloseCreateModal} maxWidth="md" fullWidth>
        <DialogTitle>Thêm hạng mục bình chọn</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Tên hạng mục"
              required
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Mô tả"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Tối đa tổng (phiếu/user)"
                type="number"
                fullWidth
                value={formData.maxVotesPerUserTotal || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxVotesPerUserTotal: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                helperText="Để trống = không giới hạn"
              />
              <TextField
                label="Tối đa mỗi ngày (phiếu/user)"
                type="number"
                fullWidth
                value={formData.maxVotesPerUserDaily || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxVotesPerUserDaily: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                helperText="Để trống = không giới hạn"
              />
            </Stack>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.allowMultipleNominees}
                  onChange={(e) =>
                    setFormData({ ...formData, allowMultipleNominees: e.target.checked })
                  }
                />
              }
              label="Cho phép bình chọn nhiều đề cử trong cùng hạng mục"
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Thời gian bắt đầu"
                type="datetime-local"
                fullWidth
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Thời gian kết thúc"
                type="datetime-local"
                fullWidth
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateModal} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : "Tạo"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={openEditModal} onClose={handleCloseEditModal} maxWidth="md" fullWidth>
        <DialogTitle>Chỉnh sửa hạng mục bình chọn</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Tên hạng mục"
              required
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Mô tả"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Tối đa tổng (phiếu/user)"
                type="number"
                fullWidth
                value={formData.maxVotesPerUserTotal || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxVotesPerUserTotal: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                helperText="Để trống = không giới hạn"
              />
              <TextField
                label="Tối đa mỗi ngày (phiếu/user)"
                type="number"
                fullWidth
                value={formData.maxVotesPerUserDaily || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxVotesPerUserDaily: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                helperText="Để trống = không giới hạn"
              />
            </Stack>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.allowMultipleNominees}
                  onChange={(e) =>
                    setFormData({ ...formData, allowMultipleNominees: e.target.checked })
                  }
                />
              }
              label="Cho phép bình chọn nhiều đề cử trong cùng hạng mục"
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Thời gian bắt đầu"
                type="datetime-local"
                fullWidth
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Thời gian kết thúc"
                type="datetime-local"
                fullWidth
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : "Cập nhật"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
