"use client";

import { SeatPicker } from "seat-picker";
import NotificationBar from "@/app/notification";

export default function SeatPickerEditor(props: any) {
    return (
        <SeatPicker
            {...props}
            renderOverlay={({ isFullScreen }: { isFullScreen: boolean }) => isFullScreen ? <NotificationBar /> : null}
        />
    );
}
