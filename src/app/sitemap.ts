import { MetadataRoute } from "next";
type PageEntry = {
    url: string;
    changeFreq?: "daily" | "monthly" | "weekly" | "always" | "hourly" | "yearly" | "never" | undefined;
    priority: number;
  };
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = "https://etik.vn";

  const pages: PageEntry[] = [
    { url: "/", changeFreq: "daily", priority: 1.0 },
    { url: "/auth/login", changeFreq: "monthly", priority: 0.5 },
    { url: "/account/my-tickets", changeFreq: "daily", priority: 0.8 },
    { url: "/event-studio/events", changeFreq: "weekly", priority: 0.9 },
  ];

  return pages.map((page) => ({
    url: `${siteUrl}${page.url}`,
    changeFrequency: page.changeFreq,
    priority: page.priority,
    lastModified: new Date().toISOString(), // Ngày cập nhật hiện tại
  }));
}