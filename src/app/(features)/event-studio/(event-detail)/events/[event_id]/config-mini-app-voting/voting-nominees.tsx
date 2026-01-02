"use client";

import { baseHttpServiceInstance } from "@/services/BaseHttp.service";
import NotificationContext from "@/contexts/notification-context";

import { useContext, useEffect, useState, useRef, useCallback } from "react";
import {
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
  CircularProgress,
  Alert,
  Grid,
} from "@mui/material";
import { Pencil, Plus, Trash } from "@phosphor-icons/react/dist/ssr";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export interface VotingCategory {
  id: number;
  eventId: number;
  name: string;
  description: string | null;
  maxVotesPerUserTotal: number | null;
  maxVotesPerUserDaily: number | null;
  allowMultipleNominees: boolean;
  allowVoting: boolean;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface VotingNominee {
  id: number;
  eventId: number;
  categoryId: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  socialUrl: string | null;
  voteCount: number;
  createdAt: string;
  updatedAt: string;
}

interface VotingNomineeFormData {
  title: string;
  description: string;
  imageUrl: string;
  socialUrl: string;
}

interface VotingNomineesProps {
  event_id: number;
  category: VotingCategory | null;
  open: boolean;
  onClose: () => void;
}

export function VotingNominees({
  event_id,
  category,
  open,
  onClose,
}: VotingNomineesProps) {
  const notificationCtx = useContext(NotificationContext);

  const [nominees, setNominees] = useState<VotingNominee[]>([]);
  const [loadingNominees, setLoadingNominees] = useState(false);
  const [openCreateNomineeModal, setOpenCreateNomineeModal] = useState(false);
  const [openEditNomineeModal, setOpenEditNomineeModal] = useState(false);
  const [openDeleteNomineeModal, setOpenDeleteNomineeModal] = useState(false);
  const [editingNominee, setEditingNominee] = useState<VotingNominee | null>(null);
  const [deletingNominee, setDeletingNominee] = useState<VotingNominee | null>(null);
  const [savingNominee, setSavingNominee] = useState(false);
  const [deletingNomineeState, setDeletingNomineeState] = useState(false);

  const [nomineeFormData, setNomineeFormData] = useState<VotingNomineeFormData>({
    title: "",
    description: "",
    imageUrl: "",
    socialUrl: "",
  });
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>("");
  const reactQuillRef = useRef<ReactQuill>(null);

  const fetchNominees = async (categoryId: number) => {
    try {
      setLoadingNominees(true);
      const response = await baseHttpServiceInstance.get(
        `/event-studio/events/${event_id}/mini-app-voting/categories/${categoryId}/nominees`
      );
      setNominees(response.data || []);
    } catch (error: any) {
      notificationCtx.error(error?.response?.data?.detail || "Không thể tải danh sách đề cử");
    } finally {
      setLoadingNominees(false);
    }
  };

  useEffect(() => {
    if (open && category) {
      fetchNominees(category.id);
    } else {
      setNominees([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category]);

  const handleOpenCreateNomineeModal = () => {
    setNomineeFormData({
      title: "",
      description: "",
      imageUrl: "",
      socialUrl: "",
    });
    setSelectedImageFile(null);
    setPreviewImageUrl("");
    setOpenCreateNomineeModal(true);
  };

  const handleCloseCreateNomineeModal = () => {
    setOpenCreateNomineeModal(false);
  };

  const handleOpenEditNomineeModal = (nominee: VotingNominee) => {
    setEditingNominee(nominee);
    setNomineeFormData({
      title: nominee.title,
      description: nominee.description || "",
      imageUrl: nominee.imageUrl || "",
      socialUrl: nominee.socialUrl || "",
    });
    setSelectedImageFile(null);
    setPreviewImageUrl(nominee.imageUrl || "");
    setOpenEditNomineeModal(true);
  };

  const handleCloseEditNomineeModal = () => {
    setOpenEditNomineeModal(false);
    setEditingNominee(null);
  };

  const handleOpenDeleteNomineeModal = (nominee: VotingNominee) => {
    setDeletingNominee(nominee);
    setOpenDeleteNomineeModal(true);
  };

  const handleCloseDeleteNomineeModal = () => {
    setOpenDeleteNomineeModal(false);
    setDeletingNominee(null);
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
      return fileUrl;
    } catch (error) {
      notificationCtx.error('Lỗi tải ảnh');
      return null;
    }
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        notificationCtx.error("Kích thước ảnh không được vượt quá 5MB");
        return;
      }
      setSelectedImageFile(file);
      setPreviewImageUrl(URL.createObjectURL(file));
    }
  };

  const handleDescriptionChange = (value: string) => {
    setNomineeFormData({ ...nomineeFormData, description: value });
  };

  const handleSubmitNominee = async () => {
    if (!nomineeFormData.title.trim()) {
      notificationCtx.error("Vui lòng nhập tên đề cử");
      return;
    }

    if (!category) return;

    try {
      setSavingNominee(true);
      
      // Upload image if a new file is selected
      let imageUrl = nomineeFormData.imageUrl;
      if (selectedImageFile) {
        const uploadedUrl = await uploadImage(selectedImageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          setSavingNominee(false);
          return;
        }
      }

      const payload = {
        title: nomineeFormData.title,
        description: nomineeFormData.description || null,
        imageUrl: imageUrl || null,
        socialUrl: nomineeFormData.socialUrl || null,
      };

      if (editingNominee) {
        // Update
        await baseHttpServiceInstance.put(
          `/event-studio/events/${event_id}/mini-app-voting/categories/${category.id}/nominees/${editingNominee.id}`,
          payload
        );
        notificationCtx.success("Cập nhật đề cử thành công");
        handleCloseEditNomineeModal();
      } else {
        // Create
        await baseHttpServiceInstance.post(
          `/event-studio/events/${event_id}/mini-app-voting/categories/${category.id}/nominees`,
          payload
        );
        notificationCtx.success("Tạo đề cử thành công");
        handleCloseCreateNomineeModal();
      }

      if (category) {
        await fetchNominees(category.id);
      }
    } catch (error: any) {
      notificationCtx.error(error?.response?.data?.detail || "Có lỗi xảy ra");
    } finally {
      setSavingNominee(false);
    }
  };

  const handleDeleteNominee = async () => {
    if (!deletingNominee || !category) return;

    try {
      setDeletingNomineeState(true);
      await baseHttpServiceInstance.delete(
        `/event-studio/events/${event_id}/mini-app-voting/categories/${category.id}/nominees/${deletingNominee.id}`
      );
      notificationCtx.success("Xóa đề cử thành công");
      handleCloseDeleteNomineeModal();
      await fetchNominees(category.id);
    } catch (error: any) {
      notificationCtx.error(error?.response?.data?.detail || "Có lỗi xảy ra khi xóa");
    } finally {
      setDeletingNomineeState(false);
    }
  };

  return (
    <>
      {/* Nominees Modal */}
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Danh sách đề cử - {category?.name}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Plus />}
              onClick={handleOpenCreateNomineeModal}
            >
              Thêm đề cử
            </Button>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {loadingNominees ? (
            <Box sx={{ display: "flex", justifyContent: "center", padding: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>STT</TableCell>
                    <TableCell>Ảnh</TableCell>
                    <TableCell>Tên đề cử</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell>Mạng xã hội</TableCell>
                    <TableCell>Số phiếu</TableCell>
                    <TableCell align="right">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {nominees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Typography variant="body2" align="center">
                          Chưa có đề cử nào
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    nominees.map((nominee, index) => (
                      <TableRow key={nominee.id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          {nominee.imageUrl ? (
                            <Box
                              component="img"
                              src={nominee.imageUrl}
                              alt={nominee.title}
                              sx={{ width: 60, height: 60, objectFit: "cover", borderRadius: 1 }}
                            />
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{nominee.title}</TableCell>
                        <TableCell>{nominee.description || "-"}</TableCell>
                        <TableCell>
                          {nominee.socialUrl ? (
                            <Button
                              href={nominee.socialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="small"
                              variant="outlined"
                            >
                              Xem
                            </Button>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{nominee.voteCount}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditNomineeModal(nominee)}
                              title="Chỉnh sửa"
                            >
                              <Pencil />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDeleteNomineeModal(nominee)}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Create Nominee Modal */}
      <Dialog
        open={openCreateNomineeModal}
        onClose={handleCloseCreateNomineeModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Thêm đề cử</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Tên đề cử"
              required
              fullWidth
              value={nomineeFormData.title}
              onChange={(e) =>
                setNomineeFormData({ ...nomineeFormData, title: e.target.value })
              }
            />
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Mô tả
              </Typography>
              <ReactQuill
                ref={reactQuillRef}
                value={nomineeFormData.description}
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
                placeholder="Nhập mô tả về đề cử"
                style={{ minHeight: '200px' }}
              />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Ảnh đại diện
              </Typography>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="upload-image-create"
                type="file"
                onChange={handleImageChange}
              />
              <label htmlFor="upload-image-create">
                <Button variant="outlined" component="span" fullWidth>
                  Chọn ảnh
                </Button>
              </label>
              {previewImageUrl && (
                <Box sx={{ mt: 2 }}>
                  <Box
                    component="img"
                    src={previewImageUrl}
                    alt="Preview"
                    sx={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      objectFit: 'contain',
                      borderRadius: 1,
                    }}
                  />
                </Box>
              )}
            </Box>
            <TextField
              label="URL mạng xã hội"
              fullWidth
              value={nomineeFormData.socialUrl}
              onChange={(e) =>
                setNomineeFormData({ ...nomineeFormData, socialUrl: e.target.value })
              }
              helperText="Nhập URL Facebook, Instagram, TikTok, etc. (nếu có)"
              placeholder="https://..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateNomineeModal} disabled={savingNominee}>
            Hủy
          </Button>
          <Button onClick={handleSubmitNominee} variant="contained" disabled={savingNominee}>
            {savingNominee ? <CircularProgress size={20} /> : "Tạo"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Nominee Modal */}
      <Dialog
        open={openEditNomineeModal}
        onClose={handleCloseEditNomineeModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Chỉnh sửa đề cử</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Tên đề cử"
              required
              fullWidth
              value={nomineeFormData.title}
              onChange={(e) =>
                setNomineeFormData({ ...nomineeFormData, title: e.target.value })
              }
            />
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Mô tả
              </Typography>
              <ReactQuill
                ref={reactQuillRef}
                value={nomineeFormData.description}
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
                placeholder="Nhập mô tả về đề cử"
                style={{ minHeight: '200px' }}
              />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Ảnh đại diện
              </Typography>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="upload-image-edit"
                type="file"
                onChange={handleImageChange}
              />
              <label htmlFor="upload-image-edit">
                <Button variant="outlined" component="span" fullWidth>
                  Chọn ảnh
                </Button>
              </label>
              {previewImageUrl && (
                <Box sx={{ mt: 2 }}>
                  <Box
                    component="img"
                    src={previewImageUrl}
                    alt="Preview"
                    sx={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      objectFit: 'contain',
                      borderRadius: 1,
                    }}
                  />
                </Box>
              )}
            </Box>
            <TextField
              label="URL mạng xã hội"
              fullWidth
              value={nomineeFormData.socialUrl}
              onChange={(e) =>
                setNomineeFormData({ ...nomineeFormData, socialUrl: e.target.value })
              }
              helperText="Nhập URL Facebook, Instagram, TikTok, etc. (nếu có)"
              placeholder="https://..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditNomineeModal} disabled={savingNominee}>
            Hủy
          </Button>
          <Button onClick={handleSubmitNominee} variant="contained" disabled={savingNominee}>
            {savingNominee ? <CircularProgress size={20} /> : "Cập nhật"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Nominee Confirmation Modal */}
      <Dialog
        open={openDeleteNomineeModal}
        onClose={handleCloseDeleteNomineeModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Xác nhận xóa đề cử</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning">
              <Typography variant="body1" sx={{ fontWeight: "bold", mb: 1 }}>
                Bạn sắp xóa đề cử: <strong>{deletingNominee?.title}</strong>
              </Typography>
              <Typography variant="body2">Hành động này sẽ xóa vĩnh viễn:</Typography>
              <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                <li>Đề cử này</li>
                <li>Toàn bộ lịch sử bình chọn cho đề cử này</li>
              </ul>
              <Typography variant="body2" sx={{ mt: 1, fontWeight: "bold" }}>
                Hành động này không thể hoàn tác!
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteNomineeModal} disabled={deletingNomineeState}>
            Hủy
          </Button>
          <Button
            onClick={handleDeleteNominee}
            variant="contained"
            color="error"
            disabled={deletingNomineeState}
          >
            {deletingNomineeState ? <CircularProgress size={20} /> : "Xóa"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

