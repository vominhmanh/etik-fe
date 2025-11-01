import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Box, Button, Typography } from '@mui/material';
import { X } from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface CustomersTableProps {
  eventId: number;
}

export default function UploadImagePage({ eventId = 0 }: CustomersTableProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalPreviewImage, setOriginalPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onPreviewMode, setOnPreviewMode] = useState<boolean>(false);

  // 🟢 Fetch background image
  useEffect(() => {
    async function fetchBackgroundImage() {
      try {
        const response = await baseHttpServiceInstance.get(
          `/event-studio/events/${eventId}/mini-app-rating-online/configs/get-background-image`
        );
        setImagePreview(response.data.background_image);
        setOriginalPreviewImage(response.data.background_image);
      } catch (error: any) {
        setError(`Lỗi khi tải ảnh nền: ${error.message}`);
      }
    }
    fetchBackgroundImage();
  }, [eventId]);

  // 🟢 Upload Image
  const handleUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await baseHttpServiceInstance.post('/common/s3/upload_image_temp', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setImagePreview(response.data.imageUrl);
      setSelectedFile(file);
      setOnPreviewMode(true);
    } catch (error: any) {
      setError(`Lỗi tải ảnh: ${error.message}`);
    }
  };

  // 🟢 Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      handleUpload(event.target.files[0]);
    }
  };

  // 🟢 Submit new background image
  const handleSave = async () => {
    if (!imagePreview) return;
    try {
      await baseHttpServiceInstance.post(
        `/event-studio/events/${eventId}/mini-app-rating-online/configs/edit-background-image`,
        { background_image: imagePreview }
      );
      alert('Ảnh nền đã được cập nhật thành công!');
    } catch (error: any) {
      setError(`Lỗi khi lưu ảnh nền: ${error.message}`);
    }
  };

  // 🟢 Delete background image
  const handleDelete = async () => {
    try {
      await baseHttpServiceInstance.delete(
        `/event-studio/events/${eventId}/mini-app-rating-online/configs/delete-background-image`
      );
      setImagePreview(null);
      alert('Ảnh nền đã được xóa!');
    } catch (error: any) {
      setError(`Lỗi khi xóa ảnh: ${error.message}`);
    }
  };

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Upload Button */}

      {/* Error Message */}
      {error && <Typography color="error">{error}</Typography>}

      {/* Mobile Screen Simulation */}
      <Box
        sx={{
          mt: 3,
          width: 250,
          height: 444,
          border: '12px solid black',
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#ccc',
        }}
      >
        {imagePreview ? (
          <Image src={imagePreview} alt="Preview" layout="fill" objectFit="contain" priority />
        ) : (
          <Typography color="white">No Image</Typography>
        )}
      </Box>

      {/* Actions */}
      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
      <Button variant="contained" component="label">
        Chọn ảnh mới
        <input type="file" hidden accept="image/*" onChange={handleFileChange} />
      </Button>
      {onPreviewMode ? 
      <>
      <Button variant="contained" color="primary" onClick={handleSave} disabled={!imagePreview}>
          Lưu ảnh
        </Button>
        <Button variant="outlined" color="error"  onClick={() => {setOnPreviewMode(false); setImagePreview(originalPreviewImage)}} disabled={!imagePreview}>
        <X />
      </Button>
      </>
        
        :
        <Button variant="outlined" color="error" onClick={handleDelete} disabled={!imagePreview}>
          Xóa ảnh
        </Button>}
      </Box>
    </Box>
  );
}
