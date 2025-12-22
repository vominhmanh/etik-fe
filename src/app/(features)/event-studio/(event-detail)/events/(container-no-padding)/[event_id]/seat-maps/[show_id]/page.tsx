"use client";

import dynamic from "next/dynamic";
import * as React from 'react';

const SeatPickerClient = dynamic(() => import("./SeatPickerClient"), {
  ssr: false,
});

import { baseHttpServiceInstance } from "@/services/BaseHttp.service";
import { TicketCategory } from 'seat-picker';
import { useParams } from "next/navigation";
import { AxiosResponse } from "axios";

export default function Page() {
  const params = useParams();
  const event_id = params?.event_id as string;
  const show_id = params?.show_id as string;
  const [categories, setCategories] = React.useState<TicketCategory[]>([]);

  React.useEffect(() => {
    if (!event_id || !show_id) return;

    const fetchCategories = async () => {
      try {
        const res: AxiosResponse<TicketCategory[]> = await baseHttpServiceInstance.get(
          `/event-studio/events/${event_id}/seat-maps/shows/${show_id}/ticket-categories`
        );
        // Assign random colors
        const colors = [
          '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
          '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
          '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
          '#ff5722', '#795548', '#9e9e9e', '#607d8b'
        ];

        const categoriesWithColor = res.data.map((cat: any, index: number) => ({
          ...cat,
          color: colors[index % colors.length]
        }));

        setCategories(categoriesWithColor);
      } catch (error) {
        console.error("Failed to fetch ticket categories:", error);
      }
    };

    fetchCategories();
  }, [event_id, show_id]);

  const handleSaveCategories = (newCategories: TicketCategory[]) => {
    console.log('Saving categories:', newCategories);
    setCategories(newCategories);
  };

  return (
    <>
      <div style={{ width: "100%", height: "87vh" }}>
        <SeatPickerClient
          categories={categories}
          onSaveCategories={handleSaveCategories}
        />
      </div>
    </>
  );
}
