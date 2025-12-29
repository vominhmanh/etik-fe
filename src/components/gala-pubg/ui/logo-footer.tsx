import Link from "next/link";
import Image from "next/image";
import logoImage from "@/images/logo_tienphongsmart-nobg.png"; // Logo hiện tại
import leftLogoImage from "@/images/etik-logo1.png"; // Logo bên trái (thay đổi đường dẫn theo ảnh của bạn)

export default function LogoFooter() {
  return (
    <Link href="/" className="inline-flex items-center" aria-label="Cruip">
      {/* Logo bên trái */}
      <Image
        src={leftLogoImage}
        alt="Left Logo"
        width={32} // Kích thước logo bên trái
        height={32}
        className="mr-2" // Khoảng cách giữa hai logo
      />

      {/* Logo chính */}
      <Image
        src={logoImage}
        alt="Logo"
        height={32}
      />
    </Link>
  );
}
