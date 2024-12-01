import Link from "next/link";
import LogoFooter from "./logo-footer";

export default function Footer({ border = false }: { border?: boolean }) {
  return (
    <footer>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Top area: Blocks */}
        <div
          className={`grid gap-10 py-8 sm:grid-cols-12 md:py-12 ${border ? "border-t [border-image:linear-gradient(to_right,transparent,theme(colors.slate.200),transparent)1]" : ""}`}
        >
          {/* 1st block */}
          <div className="space-y-2 sm:col-span-12 lg:col-span-4">
            <div>
              <LogoFooter />
            </div>
            <div className="text-sm text-gray-600">
              &copy; Công ty TNHH Tiên Phong Thông Minh - All rights reserved.<br />
              Giấy phép đăng ký kinh doanh số: 0110765139<br />
              Số điện thoại: 0333.247.242<br />
              Email: Tienphongsmart@gmail.com
            </div>
          </div>

          {/* 2nd block */}
          <div className="space-y-2 sm:col-span-6 md:col-span-3 lg:col-span-2">
            <h3 className="text-sm font-medium">Sản phẩm:</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  className="text-gray-600 transition hover:text-gray-900"
                  href="#0"
                >
                  ETIK
                </Link>
              </li>
              <li>
                <Link
                  className="text-gray-600 transition hover:text-gray-900"
                  href="#0"
                >
                  Chìa khóa thông minh
                </Link>
              </li>
              <li>
                <Link
                  className="text-gray-600 transition hover:text-gray-900"
                  href="#0"
                >
                  Tien Phong AI
                </Link>
              </li>
              <li>
                <Link
                  className="text-gray-600 transition hover:text-gray-900"
                  href="#0"
                >
                  Tien Phong Oursourcing
                </Link>
              </li>
            </ul>
          </div>

          {/* 3rd block */}
          <div className="space-y-2 sm:col-span-6 md:col-span-3 lg:col-span-2">
            <h3 className="text-sm font-medium">Công ty:</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  className="text-gray-600 transition hover:text-gray-900"
                  href="#0"
                >
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link
                  className="text-gray-600 transition hover:text-gray-900"
                  href="#0"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  className="text-gray-600 transition hover:text-gray-900"
                  href="#0"
                >
                  Tuyển dụng
                </Link>
              </li>
            </ul>
          </div>

          {/* 4th block */}
          <div className="space-y-2 sm:col-span-6 md:col-span-3 lg:col-span-2">
            <h3 className="text-sm font-medium">Tài nguyên:</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  className="text-gray-600 transition hover:text-gray-900"
                  href="#0"
                >
                  Điều khoản dịch vụ
                </Link>
              </li>
              <li>
                <Link
                  className="text-gray-600 transition hover:text-gray-900"
                  href="#0"
                >
                  Nguyên tắc bảo mật
                </Link>
              </li>
            </ul>
          </div>

          {/* 5th block */}
          <div className="space-y-2 sm:col-span-6 md:col-span-3 lg:col-span-2">
            <h3 className="text-sm font-medium">Mạng xã hội:</h3>
            <ul className="flex gap-1">
              <li>
                <Link
                  className="flex items-center justify-center text-blue-500 transition hover:text-blue-600"
                  href="#0"
                  aria-label="Facebook"
                >
                  <svg
                    className="h-8 w-8 fill-current"
                    viewBox="0 0 32 32"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M19 6h-3a5 5 0 0 0-5 5v3H8v4h3v9h4v-9h3l1-4h-4v-3a1 1 0 0 1 1-1h3V6Z"></path>
                  </svg>
                </Link>
              </li>
            </ul>

          </div>
        </div>
      </div>

      {/* Big text */}
      <div className="relative -mt-16 h-60 w-full" aria-hidden="true">
        <div className="pointer-events-none absolute left-1/2 -z-10 -translate-x-1/2 text-center text-[348px] font-bold leading-none before:bg-gradient-to-b before:from-gray-200 before:to-gray-100/30 before:to-80% before:bg-clip-text before:text-transparent before:content-['ETIK'] after:absolute after:inset-0 after:bg-gray-300/70 after:bg-clip-text after:text-transparent after:mix-blend-darken after:content-['ETIK'] after:[text-shadow:0_1px_0_white]"></div>
        {/* Glow */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2/3"
          aria-hidden="true"
        >
          <div className="h-56 w-56 rounded-full border-[20px] border-blue-700 blur-[80px]"></div>
        </div>
      </div>
    </footer>
  );
}
