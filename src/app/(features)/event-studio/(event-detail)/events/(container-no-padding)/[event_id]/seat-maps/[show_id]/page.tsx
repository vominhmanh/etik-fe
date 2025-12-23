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
  const [layoutJson, setLayoutJson] = React.useState<any>(null);

  React.useEffect(() => {
    if (!event_id || !show_id) return;

    const fetchData = async () => {
      try {
        const [categoriesRes, layoutRes] = await Promise.all([
          baseHttpServiceInstance.get<TicketCategory[]>(
            `/event-studio/events/${event_id}/seat-maps/shows/${show_id}/ticket-categories`
          ),
          baseHttpServiceInstance.get<{ layoutJson: any }>(
            `/event-studio/events/${event_id}/seat-maps/shows/${show_id}/layout`
          )
        ]);

        // Assign random colors
        const colors = [
          '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
          '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
          '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
          '#ff5722', '#795548', '#9e9e9e', '#607d8b'
        ];

        let savedCategories: TicketCategory[] = [];
        if (layoutRes.data && layoutRes.data.layoutJson) {
          setLayoutJson(layoutRes.data.layoutJson);
          if ((layoutRes.data.layoutJson as any).categories) {
            savedCategories = (layoutRes.data.layoutJson as any).categories;
          }
        }

        const savedColorMap = new Map(savedCategories.map((c) => [c.id, c.color]));

        const categoriesWithColor = categoriesRes.data.map((cat: any, index: number) => ({
          ...cat,
          color: savedColorMap.get(cat.id) || colors[index % colors.length]
        }));

        setCategories(categoriesWithColor);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, [event_id, show_id]);

  const handleSaveCategories = (newCategories: TicketCategory[]) => {
    console.log('Saving categories:', newCategories);
    setCategories(newCategories);
  };

  const handleSaveLayout = async (json: any) => {
    try {
      if (!event_id || !show_id) return;

      await baseHttpServiceInstance.put(
        `/event-studio/events/${event_id}/seat-maps/shows/${show_id}/layout`,
        { layoutJson: json }
      );
      console.log('Layout saved successfully');
    } catch (error) {
      console.error("Failed to save layout:", error);
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
          readOnly={true}
        />
      </div>
    </>
  );
}
