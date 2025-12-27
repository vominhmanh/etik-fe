"use client";

import { SeatPicker, CustomerSeatPicker as BaseCustomerSeatPicker } from "seat-picker";
import NotificationBar from "@/app/notification";

export default function SeatPickerEditor(props: any) {
    return (
        <SeatPicker
            {...props}
            renderOverlay={({ isFullScreen }: { isFullScreen: boolean }) => isFullScreen ? <NotificationBar /> : null}
        />
    );
}

export function CustomerSeatPicker(props: any) {
    return (
        <BaseCustomerSeatPicker
            {...props}
            renderOverlay={({ isFullScreen }: { isFullScreen: boolean }) => isFullScreen ? <NotificationBar /> : null}
        />
    );
}
