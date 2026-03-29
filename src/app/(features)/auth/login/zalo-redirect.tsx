"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ZaloRedirect() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const returnUrlRaw = searchParams.get("returnUrl");
        if (!returnUrlRaw) return;

        let decoded = "";
        try {
            decoded = decodeURIComponent(returnUrlRaw);
        } catch {
            return;
        }

        // ❗ chỉ xử lý nếu có from=zns
        if (!decoded.includes("from=zns")) return;

        // ❗ tránh loop
        if (sessionStorage.getItem("zalo_redirected")) return;
        sessionStorage.setItem("zalo_redirected", "1");

        const ua = navigator.userAgent || "";
        const isAndroid = /android/i.test(ua);
        const isIOS = /iPhone|iPad|iPod/i.test(ua);

        // 🔹 parse returnUrl
        const base = window.location.origin;
        const url = new URL(decoded, base);

        // 🔥 QUAN TRỌNG: xoá from=zns
        url.searchParams.delete("from");

        // (optional) xoá thêm tracking
        url.searchParams.delete("zarsrc");
        url.searchParams.delete("utm_source");
        url.searchParams.delete("utm_medium");
        url.searchParams.delete("utm_campaign");

        const cleanPath = url.pathname + url.search;

        // 🚀 ANDROID → intent (mở Chrome)
        if (isAndroid) {
            const intentUrl =
                "intent://" +
                window.location.host +
                cleanPath +
                "#Intent;scheme=https;package=com.android.chrome;end";

            window.location.href = intentUrl;
        }

        // 🍎 iOS → thử Chrome + fallback
        else if (isIOS) {
            const chromeUrl =
                "googlechrome://" +
                window.location.host +
                cleanPath;

            window.location.href = chromeUrl;

            setTimeout(() => {
                window.location.replace(cleanPath);
            }, 1500);
        }

        // 🌐 fallback chung
        else {
            window.location.replace(cleanPath);
        }
    }, [searchParams]);

    return null;
}