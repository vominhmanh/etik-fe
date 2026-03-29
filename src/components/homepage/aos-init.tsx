// src/components/homepage/aos-init.tsx
"use client";

import { useEffect } from "react";
import AOS from "aos";

export default function AosInit() {
    useEffect(() => {
        AOS.init({
            once: true,
            disable: "phone",
            duration: 700,
            easing: "ease-out-cubic",
        });
    }, []);

    return null;
}