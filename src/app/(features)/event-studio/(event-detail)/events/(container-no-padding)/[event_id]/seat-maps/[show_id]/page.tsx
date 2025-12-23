"use client";

import dynamic from "next/dynamic";
import * as React from 'react';
import { Backdrop, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Typography, Box } from "@mui/material";
import Link from "next/link";

const SeatPickerClient = dynamic(() => import("./SeatPickerClient"), {
  ssr: false,
});

import { baseHttpServiceInstance } from "@/services/BaseHttp.service";
import type { TicketCategory } from 'seat-picker';
import { useParams } from "next/navigation";
import { AxiosResponse } from "axios";
import NotificationContext from '@/contexts/notification-context';

export default function Page() {
  const params = useParams();
  const event_id = params?.event_id as string;
  const show_id = params?.show_id as string;
  const [categories, setCategories] = React.useState<TicketCategory[]>([]);
  const [layoutJson, setLayoutJson] = React.useState<any>(null);
  const [seats, setSeats] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showNotFound, setShowNotFound] = React.useState(false);
  const notificationCtx = React.useContext(NotificationContext);

  React.useEffect(() => {
    if (!event_id || !show_id) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [categoriesRes, layoutRes] = await Promise.all([
          baseHttpServiceInstance.get(
            `/event-studio/events/${event_id}/seat-maps/shows/${show_id}/ticket-categories`,
            {},
            true
          ) as Promise<AxiosResponse<TicketCategory[]>>,
          baseHttpServiceInstance.get(
            `/event-studio/events/${event_id}/seat-maps/shows/${show_id}/layout`,
            {},
            true
          ) as Promise<AxiosResponse<{ layoutJson: any; seats: any[] }>>
        ]);

        // Assign random colors
        const colors = [
          '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
          '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
          '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
          '#ff5722', '#795548', '#9e9e9e', '#607d8b'
        ];

        let savedColorMap = new Map();
        if (layoutRes.data && layoutRes.data.layoutJson) {
          if ((layoutRes.data.layoutJson as any).categories) {
            const jsonCats = (layoutRes.data.layoutJson as any).categories;
            savedColorMap = new Map(jsonCats.map((c: any) => [c.id, c.color]));
          }
        }

        if (layoutRes.data.seats) {
          setSeats(layoutRes.data.seats);
        }

        const categoriesWithColor = categoriesRes.data.map((cat: any, index: number) => ({
          ...cat,
          color: savedColorMap.get(cat.id) || colors[index % colors.length]
        }));

        setCategories(categoriesWithColor);

        if (layoutRes.data && layoutRes.data.layoutJson) {
          setLayoutJson(layoutRes.data.layoutJson);
        }
      } catch (error: any) {

        if (error.response && error.response.status === 404) {
          setShowNotFound(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [event_id, show_id]);

  const handleSaveCategories = (newCategories: TicketCategory[]) => {
    console.log('Saving categories:', newCategories);
    setCategories(newCategories);
  };

  const handleSaveLayout = async (json: any) => {
    setIsLoading(true);
    try {
      if (!event_id || !show_id) return;

      const rows = json.rows || [];
      const rowMap = new Map(rows.map((r: any) => [r.id, r.name]));

      console.log('Saving Layout - Rows:', rows.length, 'Objects:', json.canvas?.objects?.length);

      const targetObjects = json.canvas?.objects || [];

      // Debug: Log all object types and IDs to diagnose why they are being filtered out
      console.log('DEBUG: Objects found in JSON:', targetObjects.map((o: any) => ({
        type: o.type,
        customType: o.customType,
        id: o.id,
        category: o.category
      })));

      // Helper to flatten groups, including the group itself and its children
      const flattenObjects = (objects: any[]): any[] => {
        let result: any[] = [];
        objects.forEach(obj => {
          result.push(obj);
          if (obj.type === 'group' && obj.objects) {
            result = result.concat(flattenObjects(obj.objects));
          }
        });
        return result;
      };

      const allObjects = flattenObjects(targetObjects);
      console.log('DEBUG: Flattened Objects count:', allObjects.length);

      const refinedSeats = allObjects
        .filter((obj: any) => {
          const isSeatType = obj.type === 'circle' || obj.customType === 'seat' || obj.type === 'group';
          // User requirement: Only send seats that have a ticket category assigned
          return isSeatType && obj.id && obj.category;
        })
        .map((obj: any) => ({
          canvasSeatId: obj.id,
          rowLabel: rowMap.get(obj.rowId) || null,
          seatNumber: obj.seatNumber ? obj.seatNumber.toString() : null,
          ticketCategoryId: obj.category, // Verified by filter
          status: obj.status || 'available'
        }));

      console.log('Refined Seats count:', refinedSeats.length);


      await baseHttpServiceInstance.put(
        `/event-studio/events/${event_id}/seat-maps/shows/${show_id}/layout`,
        { layoutJson: json, seats: refinedSeats }
      );
      // console.log('Layout and seats saved successfully');
      notificationCtx.success('Lưu sơ đồ ghế thành công!');
    } catch (error) {
      console.error("Failed to save layout:", error);
      notificationCtx.error("Lưu sơ đồ thất bại", error);
    } finally {
      setIsLoading(false);
    }
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
      notificationCtx.error("Lỗi tải ảnh:", error);
      return null;
    }
  };

  return (
    <>
      <div style={{ width: "100%", height: "87vh" }}>
        <SeatPickerClient
          categories={categories}
          onSaveCategories={handleSaveCategories}
          layout={layoutJson}
          onSave={handleSaveLayout}
          existingSeats={seats}
          createCategoryUrl={`/event-studio/events/${event_id}/shows/${show_id}/ticket-categories/create`}
          onUploadBackground={uploadImage}
        />
      </div>

      {/* Loading Overlay */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Show Not Found Modal */}
      <Dialog
        open={showNotFound}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Show Not Found
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            The show you are looking for does not exist or has been deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button component={Link} href={`/event-studio/events/${event_id}/shows`}>
            Back to Shows
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
