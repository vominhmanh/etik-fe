"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    Dialog,
    DialogContent,
    Typography,
    Button,
    Box,
} from "@mui/material";

export default function ZaloBrowserGuard() {
    const searchParams = useSearchParams();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const returnUrlRaw = searchParams.get("returnUrl");
        if (!returnUrlRaw) return;

        let decoded = "";
        try {
            decoded = decodeURIComponent(returnUrlRaw);
        } catch {
            return;
        }

        if (!decoded.includes("from=zns")) return;

        const ua = navigator.userAgent || "";
        const isZalo = /zalo/i.test(ua);

        if (isZalo) {
            setOpen(true);
        }
    }, [searchParams]);

    return (
        <Dialog open={open} fullWidth maxWidth="xs">
            <DialogContent>
                <Box textAlign="center">
                    <Typography variant="h6" gutterBottom>
                        Mở bằng trình duyệt để tiếp tục
                    </Typography>

                    <Typography variant="body2" mb={2}>
                        Zalo đang hạn chế một số chức năng. Vui lòng mở trang này bằng trình duyệt để tiếp tục.
                    </Typography>

                    <Typography variant="body2" mb={3}>
                        👉 Nhấn dấu <b>⋯</b> góc trên bên phải <br />
                        → Chọn <b>Mở bằng trình duyệt</b>
                    </Typography>

                    <Button
                        variant="contained"
                        fullWidth
                        onClick={() => {
                            window.location.href = window.location.href;
                        }}
                    >
                        Tôi đã mở bằng trình duyệt
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
}