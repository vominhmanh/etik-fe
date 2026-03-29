"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ZaloRedirect() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const from = searchParams.get("from");
        if (from !== "zns") return;

        // tránh loop
        if (sessionStorage.getItem("zalo_redirected")) return;
        sessionStorage.setItem("zalo_redirected", "1");

        const ua = navigator.userAgent || "";
        const isAndroid = /android/i.test(ua);
        const isIOS = /iPhone|iPad|iPod/i.test(ua);

        // 🔹 build URL mới (xoá param)
        const url = new URL(window.location.href);
        url.searchParams.delete("from");
        url.searchParams.delete("zarsrc");
        url.searchParams.delete("utm_source");
        url.searchParams.delete("utm_medium");
        url.searchParams.delete("utm_campaign");

        const cleanUrl = url.toString();

        if (isAndroid) {
            // ✅ Android → mở Chrome
            const intentUrl =
                "intent://" +
                url.host +
                url.pathname +
                url.search +
                "#Intent;scheme=https;package=com.android.chrome;end";

            window.location.href = intentUrl;
        } else if (isIOS) {
            // ⚠️ iOS → thử Chrome
            const chromeUrl =
                "googlechrome://" +
                url.host +
                url.pathname +
                url.search;

            window.location.href = chromeUrl;

            // fallback về link sạch
            setTimeout(() => {
                window.location.replace(cleanUrl);
            }, 1500);
        } else {
            // các trường hợp khác → vào link sạch luôn
            window.location.replace(cleanUrl);
        }
    }, [searchParams]);

    return null;
}