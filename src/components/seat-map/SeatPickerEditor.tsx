"use client";

import { SeatPicker, CustomerSeatPicker as BaseCustomerSeatPicker, ViewOnlySeatPicker as BaseViewOnlySeatPicker } from "seat-picker";
import type { SeatData } from "seat-picker";
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


export function ViewOnlySeatPicker(props: any) {
    return (
        <BaseViewOnlySeatPicker
            {...props}
            renderOverlay={({ isFullScreen }: { isFullScreen: boolean }) => isFullScreen ? <NotificationBar /> : null}
        />
    );
}

export type { SeatData };