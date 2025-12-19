import dynamic from "next/dynamic";

const SeatPickerClient = dynamic(() => import("./SeatPickerClient"), {
    ssr: false,
});

export default function Page() {
    return (
        <div style={{ width: "100%", height: "87vh" }}>
            <SeatPickerClient />
        </div>
    );
}
