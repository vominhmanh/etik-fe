"use client";

import { SeatPicker } from "seat-picker";
import NotificationBar from "@/app/notification";

export default function SeatPickerClient(props: any) {
    return (
        <SeatPicker
            {...props}
            renderOverlay={({ isFullScreen }) => isFullScreen ? <NotificationBar /> : null}
        />
    );
}
