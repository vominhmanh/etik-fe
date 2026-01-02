"use client";

import { baseHttpServiceInstance } from "@/services/BaseHttp.service";
import NotificationContext from "@/contexts/notification-context";

import { useContext, useEffect, useState, useRef } from "react";
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
  Alert,
} from "@mui/material";
import { Pencil, Plus, List, Trash } from "@phosphor-icons/react/dist/ssr";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { VotingNominees } from "./voting-nominees";

import { VotingCategory } from "./voting-nominees";

interface VotingCategoryFormData {
  name: string;
  description: string;
  maxVotesPerUserTotal: number | null;
  maxVotesPerUserDaily: number | null;
  allowMultipleNominees: boolean;
  allowVoting: boolean;
  startAt: string;
  endAt: string;
}


export function VotingCategories({ event_id }: { event_id: number }) {
  const notificationCtx = useContext(NotificationContext);

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<VotingCategory[]>([]);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<VotingCategory | null>(null);
  const [editingCategory, setEditingCategory] = useState<VotingCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Nominees state
  const [openNomineesModal, setOpenNomineesModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<VotingCategory | null>(null);
  
  const reactQuillRef = useRef<ReactQuill>(null);
  
  const [formData, setFormData] = useState<VotingCategoryFormData>({
    name: "",
    description: "",
    maxVotesPerUserTotal: null,
    maxVotesPerUserDaily: null,
    allowMultipleNominees: true,
    allowVoting: true,
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
      const errorMessage = error?.response?.data?.detail || error?.message || "Không thể tải danh sách hạng mục";
      notificationCtx.error(errorMessage);
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
      allowVoting: true,
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
      allowVoting: category.allowVoting ?? true,
      startAt: category.startAt ? category.startAt.substring(0, 16) : "",
      endAt: category.endAt ? category.endAt.substring(0, 16) : "",
    });
    setOpenEditModal(true);
  };

  const handleCloseEditModal = () => {
    setOpenEditModal(false);
    setEditingCategory(null);
  };

  const handleDescriptionChange = (value: string) => {
    setFormData({ ...formData, description: value });
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
        allowVoting: formData.allowVoting,
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
      const errorMessage = error?.response?.data?.detail || error?.message || "Có lỗi xảy ra";
      notificationCtx.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteModal = (category: VotingCategory) => {
    setDeletingCategory(category);
    setOpenDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setOpenDeleteModal(false);
    setDeletingCategory(null);
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    try {
      setDeleting(true);
      await baseHttpServiceInstance.delete(
        `/event-studio/events/${event_id}/mini-app-voting/categories/${deletingCategory.id}`
      );
      notificationCtx.success("Xóa hạng mục bình chọn thành công");
      handleCloseDeleteModal();
      fetchCategories();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || "Có lỗi xảy ra khi xóa";
      notificationCtx.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return "-";
    return new Date(dateTime).toLocaleString("vi-VN");
  };

  const handleOpenNomineesModal = (category: VotingCategory) => {
    setSelectedCategory(category);
    setOpenNomineesModal(true);
  };

  const handleCloseNomineesModal = () => {
    setOpenNomineesModal(false);
    setSelectedCategory(null);
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
                    <TableCell>Cho phép bình chọn</TableCell>
                    <TableCell>Bắt đầu</TableCell>
                    <TableCell>Kết thúc</TableCell>
                    <TableCell align="right">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10}>
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
                        <TableCell>
                          {category.allowVoting !== false ? (
                            <Typography variant="body2" color="success.main">
                              Có
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="error.main">
                              Không
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{formatDateTime(category.startAt)}</TableCell>
                        <TableCell>{formatDateTime(category.endAt)}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenNomineesModal(category)}
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
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDeleteModal(category)}
                              title="Xóa"
                              color="error"
                            >
                              <Trash />
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
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Mô tả
              </Typography>
              <ReactQuill
                ref={reactQuillRef}
                value={formData.description}
                onChange={handleDescriptionChange}
                modules={{
                  toolbar: {
                    container: [
                      [{ header: '1' }, { header: '2' }, { font: [] }],
                      [{ size: [] }],
                      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['link', 'image'],
                      ['clean'],
                    ],
                  },
                  clipboard: {
                    matchVisual: false,
                  },
                }}
                placeholder="Nhập mô tả về hạng mục bình chọn"
                style={{ minHeight: '200px' }}
              />
            </Box>
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
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.allowVoting}
                  onChange={(e) =>
                    setFormData({ ...formData, allowVoting: e.target.checked })
                  }
                />
              }
              label="Cho phép bình chọn cho hạng mục này"
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
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Mô tả
              </Typography>
              <ReactQuill
                ref={reactQuillRef}
                value={formData.description}
                onChange={handleDescriptionChange}
                modules={{
                  toolbar: {
                    container: [
                      [{ header: '1' }, { header: '2' }, { font: [] }],
                      [{ size: [] }],
                      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['link', 'image'],
                      ['clean'],
                    ],
                  },
                  clipboard: {
                    matchVisual: false,
                  },
                }}
                placeholder="Nhập mô tả về hạng mục bình chọn"
                style={{ minHeight: '200px' }}
              />
            </Box>
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
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.allowVoting}
                  onChange={(e) =>
                    setFormData({ ...formData, allowVoting: e.target.checked })
                  }
                />
              }
              label="Cho phép bình chọn cho hạng mục này"
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

      {/* Delete Confirmation Modal */}
      <Dialog open={openDeleteModal} onClose={handleCloseDeleteModal} maxWidth="sm" fullWidth>
        <DialogTitle>Xác nhận xóa hạng mục bình chọn</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning">
              <Typography variant="body1" sx={{ fontWeight: "bold", mb: 1 }}>
                Bạn sắp xóa hạng mục bình chọn: <strong>{deletingCategory?.name}</strong>
              </Typography>
              <Typography variant="body2">
                Hành động này sẽ xóa vĩnh viễn:
              </Typography>
              <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                <li>Hạng mục bình chọn này</li>
                <li>Tất cả đề cử trong hạng mục này</li>
                <li>Toàn bộ lịch sử bình chọn của hạng mục này</li>
              </ul>
              <Typography variant="body2" sx={{ mt: 1, fontWeight: "bold" }}>
                Hành động này không thể hoàn tác!
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteModal} disabled={deleting}>
            Hủy
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : "Xóa"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Nominees Component */}
      <VotingNominees
        event_id={event_id}
        category={selectedCategory}
        open={openNomineesModal}
        onClose={handleCloseNomineesModal}
      />
    </>
  );
}
