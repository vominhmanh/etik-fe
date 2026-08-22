# Package Manager Convention

Dự án Frontend này sử dụng **pnpm** làm trình quản lý gói (Package Manager) mặc định. 

AI Agent khi thao tác với dự án này (cài đặt package, chạy script, build) cần tuân thủ nghiêm ngặt các quy tắc sau:
- **Tuyệt đối KHÔNG** sử dụng lệnh `npm` hay `yarn`.
- Luôn sử dụng `pnpm add <package>` hoặc `pnpm add -D <package>` khi cài đặt thêm thư viện mới.
- Luôn sử dụng lệnh `pnpm dev` (để chạy môi trường dev), `pnpm build` (để build code), hoặc `pnpm <script>` để chạy các lệnh trong `package.json`.
