import dynamic from "next/dynamic";

const SeatPickerClient = dynamic(() => import("./SeatPickerClient"), {
    ssr: false,
});

export default function Page() {
    return <SeatPickerClient />;
}
