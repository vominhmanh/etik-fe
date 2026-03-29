"use client";

import { useTranslation } from "@/contexts/locale-context";

export default function Policy() {
  const { tt } = useTranslation();

  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 py-5 md:py-5">
      <div className="rounded-2xl bg-white shadow-xl p-8 md:p-12 text-gray-700 space-y-8 border border-gray-100">

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("1. Mục đích và phạm vi", "1. Purpose and scope")}
          </h3>
          <p>{tt("Chính sách này được ban hành nhằm tuân thủ:", "This policy is issued to comply with:")}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân", "Decree 13/2023/ND-CP on personal data protection")}</li>
            <li>{tt("Nghị định 52/2013/NĐ-CP và 85/2021/NĐ-CP về TMĐT", "Decree 52/2013/ND-CP and 85/2021/ND-CP on e-commerce")}</li>
          </ul>
          <p>{tt("Chính sách quy định việc thu thập, xử lý, lưu trữ, chia sẻ và bảo vệ dữ liệu cá nhân của người dùng trên nền tảng ETIK.vn.", "The policy sets out the collection, processing, storage, sharing, and protection of users' personal data on the ETIK.vn platform.")}</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("2. Định nghĩa và phân loại dữ liệu", "2. Definition and classification of data")}
          </h3>

          <h4 className="text-lg font-semibold text-gray-800 mt-4">{tt("2.1 Dữ liệu cá nhân cơ bản", "2.1 Basic personal data")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Họ tên", "Full name")}</li>
            <li>{tt("Email", "Email")}</li>
            <li>{tt("Số điện thoại", "Phone number")}</li>
            <li>{tt("Thông tin tài khoản", "Account information")}</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("2.2 Dữ liệu cá nhân nhạy cảm", "2.2 Sensitive personal data")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Dữ liệu sinh trắc học (khuôn mặt)", "Biometric data (facial)")}</li>
            <li>{tt("Dữ liệu tài chính liên quan giao dịch", "Financial data related to transactions")}</li>
            <li>{tt("Thông tin định danh cá nhân (nếu có)", "Personal identification information (if any)")}</li>
          </ul>
          <blockquote className="border-l-4 border-yellow-500 pl-4 py-2 mt-4 bg-yellow-50 text-yellow-900 italic rounded">
            📌 {tt("Dữ liệu nhạy cảm được xử lý với mức độ bảo vệ cao hơn.", "Sensitive data is processed with a higher level of protection.")}
          </blockquote>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("3. Vai trò xử lý dữ liệu", "3. Data processing roles")}
          </h3>
          <p>{tt("ETIK có thể đóng vai trò:", "ETIK can act as:")}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>{tt("Bên kiểm soát dữ liệu (Data Controller)", "Data Controller")}</strong></li>
            <li><strong>{tt("Bên xử lý dữ liệu (Data Processor)", "Data Processor")}</strong> {tt("đối với dữ liệu do BTC cung cấp", "for data provided by Event Organizers")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("4. Nguyên tắc xử lý dữ liệu", "4. Principles of data processing")}
          </h3>
          <p>{tt("ETIK cam kết:", "ETIK commits to:")}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Xử lý đúng mục đích đã thông báo", "Processing only for the notified purposes")}</li>
            <li>{tt("Thu thập tối thiểu cần thiết (data minimization)", "Collecting the minimum necessity (data minimization)")}</li>
            <li>{tt("Bảo mật và toàn vẹn dữ liệu", "Ensuring data security and integrity")}</li>
            <li>{tt("Lưu trữ có thời hạn", "Storing with a retention limit")}</li>
            <li>{tt("Đảm bảo khả năng kiểm soát của chủ thể dữ liệu", "Ensuring controllability for the data subject")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("5. Cơ sở pháp lý xử lý", "5. Legal basis for processing")}
          </h3>
          <p>{tt("Việc xử lý dữ liệu được thực hiện dựa trên:", "Data processing is carried out based on:")}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Sự đồng ý rõ ràng của người dùng", "Explicit consent of the user")}</li>
            <li>{tt("Nghĩa vụ hợp đồng", "Contractual obligations")}</li>
            <li>{tt("Nghĩa vụ pháp lý", "Legal obligations")}</li>
            <li>{tt("Lợi ích hợp pháp của ETIK (không xâm phạm quyền người dùng)", "Legitimate interests of ETIK (not infringing on user rights)")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("6. Cơ chế thu thập và ghi nhận sự đồng ý", "6. Mechanism for collecting and recording consent")}
          </h3>

          <h4 className="text-lg font-semibold text-gray-800 mt-4">{tt("6.1 Hình thức thu thập", "6.1 Collection forms")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Form đăng ký", "Registration forms")}</li>
            <li>{tt("Giao dịch mua vé", "Ticket purchasing transactions")}</li>
            <li>{tt("Cookie banner", "Cookie banners")}</li>
            <li>{tt("Tích chọn (checkbox consent)", "Checkbox consent")}</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("6.2 Ghi nhận consent", "6.2 Recording consent")}</h4>
          <p>{tt("ETIK lưu trữ:", "ETIK stores:")}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Thời điểm đồng ý", "Time of consent")}</li>
            <li>{tt("Nội dung đã đồng ý", "Consented content")}</li>
            <li>{tt("Nguồn thu thập", "Source of collection")}</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("6.3 Rút lại consent", "6.3 Withdrawing consent")}</h4>
          <p>{tt("Người dùng có thể:", "Users can:")}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Gửi yêu cầu qua email", "Send a request via email")}</li>
            <li>{tt("Hủy đăng ký email marketing", "Unsubscribe from email marketing")}</li>
            <li>{tt("Yêu cầu xóa dữ liệu", "Request data deletion")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("7. Mục đích xử lý dữ liệu", "7. Purposes of data processing")}
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Thực hiện giao dịch và phát hành vé", "Execute transactions and issue tickets")}</li>
            <li>{tt("Xác thực danh tính", "Authenticate identity")}</li>
            <li>{tt("Kiểm soát ra vào sự kiện", "Control event entry and exit")}</li>
            <li>{tt("Hỗ trợ khách hàng", "Provide customer support")}</li>
            <li>{tt("Gửi thông báo và marketing (có opt-out)", "Send notifications and marketing (with opt-out options)")}</li>
            <li>{tt("Phòng chống gian lận", "Prevent fraud")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("8. Chia sẻ và chuyển giao dữ liệu", "8. Data sharing and transfer")}
          </h3>

          <h4 className="text-lg font-semibold text-gray-800 mt-4">{tt("8.1 Bên nhận dữ liệu", "8.1 Data recipients")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("BTC (để tổ chức sự kiện)", "Event Organizers (to organize the event)")}</li>
            <li>{tt("Ngân hàng / Napas", "Banks / Napas")}</li>
            <li>{tt("Nhà cung cấp hạ tầng (cloud, email…)", "Infrastructure providers (cloud, email...)")}</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("8.2 Nguyên tắc chia sẻ", "8.2 Distribution principles")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Có hợp đồng ràng buộc (DPA)", "Bound by contracts (DPA)")}</li>
            <li>{tt("Chỉ chia sẻ dữ liệu cần thiết", "Share only necessary data")}</li>
            <li>{tt("Áp dụng biện pháp bảo mật tương đương", "Apply equivalent security measures")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("9. Chuyển dữ liệu ra nước ngoài", "9. Cross-border data transfer")}
          </h3>
          <p>{tt("Trong trường hợp dữ liệu được lưu trữ hoặc xử lý ngoài lãnh thổ Việt Nam:", "In the event data is stored or processed outside of Vietnam:")}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("ETIK đảm bảo tuân thủ quy định Nghị định 13", "ETIK ensures compliance with Decree 13 regulations")}</li>
            <li>{tt("Có cơ chế đánh giá tác động chuyển dữ liệu", "Mechanisms are in place to assess data transfer impact")}</li>
            <li>{tt("Có biện pháp bảo vệ tương đương", "Equivalent protective measures are applied")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("10. Lưu trữ và thời hạn lưu trữ", "10. Storage and retention periods")}
          </h3>

          <h4 className="text-lg font-semibold text-gray-800 mt-4">{tt("10.1 Nguyên tắc", "10.1 Principles")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Lưu trữ tối thiểu cần thiết", "Minimum necessary storage")}</li>
            <li>{tt("Xóa hoặc ẩn danh khi hết mục đích", "Delete or anonymize when the purpose expires")}</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("10.2 Thời gian lưu trữ tham chiếu", "10.2 Reference retention time")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Dữ liệu tài khoản: Trong thời gian sử dụng + 24 tháng", "Account data: During active use + 24 months")}</li>
            <li>{tt("Dữ liệu giao dịch: 05 năm (theo nghĩa vụ pháp lý)", "Transaction data: 05 years (legal obligation)")}</li>
            <li>{tt("Dữ liệu marketing: Cho đến khi người dùng từ chối", "Marketing data: Until the user opts out")}</li>
            <li>{tt("Dữ liệu sinh trắc học: Xóa ngay sau sự kiện hoặc theo yêu cầu", "Biometric data: Deleted immediately after the event or upon request")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("11. Bảo mật dữ liệu", "11. Data security")}
          </h3>

          <h4 className="text-lg font-semibold text-gray-800 mt-4">{tt("11.1 Biện pháp kỹ thuật", "11.1 Technical measures")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Mã hóa dữ liệu", "Data encryption")}</li>
            <li>{tt("Firewall, IDS/IPS", "Firewall, IDS/IPS")}</li>
            <li>{tt("Logging và monitoring", "Logging and monitoring")}</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("11.2 Kiểm soát truy cập", "11.2 Access controls")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Phân quyền theo vai trò (RBAC)", "Role-based access control (RBAC)")}</li>
            <li>{tt("Xác thực nhiều lớp (MFA)", "Multi-factor authentication (MFA)")}</li>
            <li>{tt("Ghi log truy cập", "Access logging")}</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("11.3 Đánh giá định kỳ", "11.3 Periodic reviews")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Kiểm tra bảo mật", "Security checks")}</li>
            <li>{tt("Audit nội bộ", "Internal audits")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("12. Xử lý sự cố và vi phạm dữ liệu", "12. Incident management and data breaches")}
          </h3>

          <h4 className="text-lg font-semibold text-gray-800 mt-4">{tt("12.1 Phát hiện và phản ứng", "12.1 Detection and Response")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Giám sát liên tục", "Continuous monitoring")}</li>
            <li>{tt("Kích hoạt quy trình Incident Response", "Activating Incident Response procedures")}</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("12.2 Thông báo", "12.2 Notification")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Thông báo cho người dùng bị ảnh hưởng", "Notifying affected users")}</li>
            <li>{tt("Thông báo cơ quan có thẩm quyền (nếu cần)", "Notifying authorities (if necessary)")}</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("12.3 Khắc phục", "12.3 Remediation")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Cô lập sự cố", "Isolating the incident")}</li>
            <li>{tt("Khôi phục hệ thống", "Restoring the system")}</li>
            <li>{tt("Ngăn chặn tái diễn", "Preventing recurrence")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("13. Quyền của chủ thể dữ liệu", "13. Data subject rights")}
          </h3>
          <p>{tt("Người dùng có quyền:", "Users have the right to:")}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Biết và đồng ý xử lý dữ liệu", "Know and consent to data processing")}</li>
            <li>{tt("Truy cập, chỉnh sửa", "Access and edit data")}</li>
            <li>{tt("Xóa dữ liệu", "Delete data")}</li>
            <li>{tt("Hạn chế xử lý", "Restrict data processing")}</li>
            <li>{tt("Phản đối xử lý", "Object to processing")}</li>
            <li>{tt("Khiếu nại", "Lodge a complaint")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("14. Nghĩa vụ của người dùng", "14. User obligations")}
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Cung cấp thông tin chính xác", "Provide accurate information")}</li>
            <li>{tt("Không sử dụng dữ liệu của người khác trái phép", "Not use others' data illegally")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("15. Đánh giá tác động xử lý dữ liệu (DPIA)", "15. Data protection impact assessment (DPIA)")}
          </h3>
          <p>{tt("ETIK thực hiện đánh giá tác động đối với:", "ETIK performs an impact assessment on:")}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Dữ liệu nhạy cảm", "Sensitive data")}</li>
            <li>{tt("Xử lý quy mô lớn", "Large-scale processing")}</li>
            <li>{tt("Công nghệ mới (AI, nhận diện khuôn mặt)", "New technologies (AI, facial recognition)")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("16. Kiểm toán và tuân thủ", "16. Audit and compliance")}
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Thực hiện audit định kỳ", "Conduct periodic audits")}</li>
            <li>{tt("Lưu trữ hồ sơ xử lý dữ liệu", "Store data processing records")}</li>
            <li>{tt("Sẵn sàng cung cấp cho cơ quan chức năng", "Be ready to provide to competent authorities")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("17. Sửa đổi chính sách", "17. Policy amendment")}
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("ETIK có quyền cập nhật chính sách", "ETIK reserves the right to update the policy")}</li>
            <li>{tt("Phiên bản mới có hiệu lực khi công bố", "The new version takes effect upon publication")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("18. Thông báo liên hệ", "18. Contact information")}
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Email: ", "Email: ")}<a href="mailto:Tienphongsmart@gmail.com" className="text-blue-600 hover:underline">Tienphongsmart@gmail.com</a></li>
            <li>{tt("Hotline: 0333.247.242", "Hotline: 0333.247.242")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("19. Hiệu lực", "19. Effectiveness")}
          </h3>
          <p>{tt("Chính sách này có hiệu lực kể từ ngày công bố trên ETIK.vn.", "This policy is effective from the date of publication on ETIK.vn.")}</p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mt-2">
            © {tt("Công ty TNHH Tiên Phong Thông Minh. All rights reserved.", "Tien Phong Smart Co.,Ltd. All rights reserved.")}
          </p>
        </div>
      </div>
    </section>
  );
}
