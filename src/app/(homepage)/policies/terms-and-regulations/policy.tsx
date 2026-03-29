"use client";

import { useTranslation } from "@/contexts/locale-context";

export default function Policy() {
  const { tt } = useTranslation();

  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 py-5 md:py-5">
      <div className="rounded-2xl bg-white shadow-xl p-8 md:p-12 text-gray-700 space-y-8 border border-gray-100">

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("1. Thông tin pháp lý và đơn vị vận hành", "1. Legal information and operator")}
          </h3>
          <p>
            {tt("Website ", "Website ")}<strong>ETIK.vn</strong>{tt(" (sau đây gọi là “Nền tảng ETIK” hoặc “ETIK”) là website cung cấp dịch vụ thương mại điện tử, hoạt động dưới sự quản lý của:", " (hereinafter referred to as “ETIK Platform” or “ETIK”) is a website providing e-commerce services, operated under the management of:")}
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>{tt("Công ty TNHH Tiên Phong Thông Minh", "Tien Phong Smart Co.,Ltd")}</strong></li>
            <li>{tt("Giấy chứng nhận đăng ký doanh nghiệp số: 0110765139", "Business registration certificate number: 0110765139")}</li>
            <li>{tt("Địa chỉ trụ sở: Số 39B ngõ 51 đường Quang Tiến, P. Tây Mỗ, TP. Hà Nội", "Head office address: No. 39B, alley 51, Quang Tien street, Tay Mo ward, Hanoi")}</li>
            <li>{tt("Hotline: 0333.247.242", "Hotline: 0333.247.242")}</li>
            <li>{tt("Email: ", "Email: ")}<a href="mailto:Tienphongsmart@gmail.com" className="text-blue-600 hover:underline">Tienphongsmart@gmail.com</a></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("2. Phạm vi điều chỉnh và đối tượng áp dụng", "2. Scope of regulation and applying subjects")}
          </h3>
          <p>{tt("Quy chế này điều chỉnh việc sử dụng Nền tảng ETIK bởi:", "This regulation governs the use of the ETIK Platform by:")}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>{tt("Đơn vị tổ chức sự kiện (Bên bán / BTC)", "Event Organizers (Seller / Organizer)")}</strong></li>
            <li><strong>{tt("Người mua vé (Khách hàng)", "Ticket Buyers (Customers)")}</strong></li>
            <li><strong>{tt("Các bên liên quan khác tham gia giao dịch", "Other related parties participating in transactions")}</strong></li>
          </ul>
          <p>{tt("Tất cả người dùng khi truy cập và sử dụng ETIK được hiểu là đã đọc, hiểu và đồng ý với toàn bộ nội dung Quy chế này.", "All users, when accessing and using ETIK, are deemed to have read, understood, and agreed to the entire content of this Regulation.")}</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("3. Mô hình hoạt động", "3. Operating model")}
          </h3>
          <p>{tt("ETIK hoạt động theo mô hình:", "ETIK operates according to the model:")}</p>
          <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 text-blue-900 italic rounded">
            {tt("Sàn giao dịch thương mại điện tử cung cấp dịch vụ trung gian", "E-commerce exchange providing intermediary services")}
          </blockquote>
          <p>{tt("Cụ thể:", "Specifically:")}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Cho phép BTC tạo, quản lý và phân phối vé điện tử", "Allows Organizers to create, manage, and distribute e-tickets")}</li>
            <li>{tt("Cho phép người mua tìm kiếm, đặt mua và thanh toán vé", "Allows buyers to search, book, and pay for tickets")}</li>
            <li>{tt("Cung cấp hạ tầng kỹ thuật phục vụ giao dịch", "Provides technical infrastructure to serve transactions")}</li>
          </ul>
          <p className="font-medium text-gray-800">
            {tt("ETIK ", "ETIK ")}<strong>{tt("không phải là bên tổ chức sự kiện", "is not the event organizer")}</strong>{tt(", trừ khi có công bố riêng.", ", unless otherwise announced.")}
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("4. Dịch vụ cung cấp", "4. Provided services")}
          </h3>
          <p>{tt("ETIK cung cấp các dịch vụ bao gồm nhưng không giới hạn:", "ETIK provides services including but not limited to:")}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Tạo và quản lý sự kiện trực tuyến", "Create and manage online events")}</li>
            <li>{tt("Phát hành vé điện tử (QR code / nhận diện khuôn mặt)", "Issue e-tickets (QR code / facial recognition)")}</li>
            <li>{tt("Hệ thống bán vé trực tuyến", "Online ticketing system")}</li>
            <li>{tt("Tích hợp thanh toán (Napas 247, chuyển khoản)", "Payment integration (Napas 247, bank transfer)")}</li>
            <li>{tt("Ứng dụng kiểm soát vé tại sự kiện", "Ticket control application at the event")}</li>
            <li>{tt("Báo cáo doanh thu và quản lý giao dịch", "Revenue reporting and transaction management")}</li>
            <li>{tt("Công cụ truyền thông và email marketing", "Communication and email marketing tools")}</li>
            <li>{tt("Hỗ trợ kỹ thuật và chăm sóc khách hàng", "Technical support and customer care")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("5. Quy trình giao dịch", "5. Transaction process")}
          </h3>

          <h4 className="text-lg font-semibold text-gray-800 mt-4">{tt("5.1 Quy trình mua vé", "5.1 Ticket buying process")}</h4>
          <ol className="list-decimal pl-5 space-y-2">
            <li>{tt("Người mua truy cập ETIK", "Buyer accesses ETIK")}</li>
            <li>{tt("Lựa chọn sự kiện và loại vé", "Selects event and ticket type")}</li>
            <li>{tt("Cung cấp thông tin cần thiết", "Provides necessary information")}</li>
            <li>{tt("Thực hiện thanh toán", "Makes payment")}</li>
            <li>{tt("Nhận vé điện tử qua email", "Receives e-ticket via email")}</li>
          </ol>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("5.2 Xác nhận giao dịch", "5.2 Transaction confirmation")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Giao dịch chỉ được xác nhận khi ", "Transactions are only confirmed upon ")}<strong>{tt("thanh toán thành công", "successful payment")}</strong></li>
            <li>{tt("Vé được phát hành dưới dạng:", "Tickets are issued in the form of:")}
              <ul className="list-[circle] pl-5 mt-2 space-y-1 text-gray-600">
                <li>{tt("Mã QR định danh duy nhất hoặc", "Unique identifier QR code or")}</li>
                <li>{tt("Dữ liệu nhận diện khuôn mặt", "Facial recognition data")}</li>
              </ul>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("6. Quyền và nghĩa vụ", "6. Rights and obligations")}
          </h3>

          <h4 className="text-lg font-semibold text-gray-800 mt-4">{tt("6.1 Đối với ETIK", "6.1 For ETIK")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Cung cấp hạ tầng kỹ thuật ổn định, liên tục", "Provide stable and continuous technical infrastructure")}</li>
            <li>{tt("Đảm bảo an toàn thông tin theo quy định pháp luật", "Ensure information security according to legal regulations")}</li>
            <li>{tt("Hỗ trợ xử lý giao dịch và khiếu nại", "Support transaction and complaint processing")}</li>
            <li>{tt("Có quyền:", "Has the right to:")}
              <ul className="list-[circle] pl-5 mt-2 space-y-1 text-gray-600">
                <li>{tt("Kiểm duyệt nội dung sự kiện", "Censor event content")}</li>
                <li>{tt("Tạm ngưng hoặc chấm dứt tài khoản vi phạm", "Suspend or terminate violating accounts")}</li>
                <li>{tt("Từ chối cung cấp dịch vụ nếu phát hiện rủi ro pháp lý", "Refuse to provide services if legal risks are detected")}</li>
              </ul>
            </li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("6.2 Đối với BTC (Người bán)", "6.2 For Organizers (Sellers)")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Cung cấp thông tin sự kiện chính xác, đầy đủ", "Provide accurate and complete event information")}</li>
            <li>{tt("Chịu trách nhiệm toàn bộ về:", "Take full responsibility for:")}
              <ul className="list-[circle] pl-5 mt-2 space-y-1 text-gray-600">
                <li>{tt("Nội dung sự kiện", "Event content")}</li>
                <li>{tt("Việc tổ chức và thực hiện", "Organization and implementation")}</li>
                <li>{tt("Nghĩa vụ với người mua", "Obligations to buyers")}</li>
              </ul>
            </li>
            <li>{tt("Tuân thủ pháp luật hiện hành", "Comply with current laws")}</li>
            <li>{tt("Không sử dụng ETIK cho mục đích gian lận, trái phép", "Do not use ETIK for fraudulent or illegal purposes")}</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("6.3 Đối với Người mua", "6.3 For Buyers")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Cung cấp thông tin chính xác", "Provide accurate information")}</li>
            <li>{tt("Thanh toán đầy đủ và đúng hạn", "Pay in full and on time")}</li>
            <li>{tt("Tuân thủ quy định của sự kiện", "Comply with event regulations")}</li>
            <li>{tt("Không sử dụng vé giả mạo hoặc gian lận", "Do not use fake or fraudulent tickets")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("7. Chính sách thanh toán", "7. Payment policy")}
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Phương thức thanh toán:", "Payment methods:")}
              <ul className="list-[circle] pl-5 mt-2 space-y-1 text-gray-600">
                <li>{tt("Napas 247", "Napas 247")}</li>
                <li>{tt("Chuyển khoản ngân hàng", "Bank transfer")}</li>
              </ul>
            </li>
            <li>{tt("ETIK không lưu trữ thông tin nhạy cảm về thanh toán", "ETIK does not store sensitive payment information")}</li>
            <li>{tt("Giao dịch được xử lý thông qua hệ thống trung gian", "Transactions are processed through an intermediate system")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("8. Chính sách vé điện tử", "8. E-ticket policy")}
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Vé được phát hành dưới dạng điện tử", "Tickets are issued in electronic form")}</li>
            <li>{tt("Mỗi vé có mã định danh duy nhất", "Each ticket has a unique identifier code")}</li>
            <li>{tt("Vé chỉ có hiệu lực:", "Tickets are only valid:")}
              <ul className="list-[circle] pl-5 mt-2 space-y-1 text-gray-600">
                <li>{tt("Khi thanh toán thành công", "Upon successful payment")}</li>
                <li>{tt("Trong thời gian sự kiện diễn ra", "During the event")}</li>
              </ul>
            </li>
            <li>{tt("Việc kiểm soát vé được thực hiện thông qua hệ thống ETIK", "Ticket control is performed through the ETIK system")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("9. Hoàn vé, hủy vé và thay đổi", "9. Ticket refund, cancellation and changes")}
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Chính sách hoàn/hủy do BTC quy định", "Refund/cancellation policy is regulated by the Organizer")}</li>
            <li>{tt("ETIK cung cấp công cụ hỗ trợ xử lý", "ETIK provides tools to support processing")}</li>
            <li>{tt("Trong trường hợp sự kiện bị hủy:", "In case the event is canceled:")}
              <ul className="list-[circle] pl-5 mt-2 space-y-1 text-gray-600">
                <li>{tt("BTC có trách nhiệm hoàn tiền", "The Organizer is responsible for refunding")}</li>
                <li>{tt("ETIK hỗ trợ kỹ thuật hoàn tiền", "ETIK provides technical support for the refund")}</li>
              </ul>
            </li>
          </ul>
          <p className="font-semibold text-gray-800">
            {tt("Thời gian xử lý hoàn tiền: ", "Refund processing time: ")}
            <span className="text-blue-600">{tt("5–15 ngày làm việc", "5–15 working days")}</span>
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("10. Giải quyết khiếu nại và tranh chấp", "10. Complaint and dispute resolution")}
          </h3>

          <h4 className="text-lg font-semibold text-gray-800 mt-4">{tt("10.1 Kênh tiếp nhận", "10.1 Reception channels")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Email: ", "Email: ")}<a href="mailto:Tienphongsmart@gmail.com" className="text-blue-600 hover:underline">Tienphongsmart@gmail.com</a></li>
            <li>{tt("Hotline: 0333.247.242", "Hotline: 0333.247.242")}</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("10.2 Quy trình xử lý", "10.2 Handling process")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Tiếp nhận và ghi nhận thông tin", "Receive and record information")}</li>
            <li>{tt("Xác minh dữ liệu giao dịch", "Verify transaction data")}</li>
            <li>{tt("Làm việc với các bên liên quan", "Work with related parties")}</li>
            <li>{tt("Đề xuất phương án xử lý", "Propose handling measures")}</li>
          </ul>
          <p className="font-semibold text-gray-800">
            {tt("Thời gian xử lý tiêu chuẩn: ", "Standard processing time: ")}
            <span className="text-blue-600">{tt("03–07 ngày làm việc", "03–07 working days")}</span>
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("11. Bảo mật thông tin", "11. Information security")}
          </h3>
          <p>{tt("ETIK cam kết:", "ETIK commits to:")}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Thu thập và sử dụng dữ liệu đúng mục đích", "Collect and use data for the right purposes")}</li>
            <li>{tt("Không cung cấp thông tin cho bên thứ ba nếu không có sự đồng ý", "Not provide information to third parties without consent")}</li>
            <li>{tt("Áp dụng biện pháp kỹ thuật và tổ chức để bảo vệ dữ liệu", "Apply technical and organizational measures to protect data")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("12. Giới hạn trách nhiệm", "12. Limitation of liability")}
          </h3>
          <p>{tt("ETIK không chịu trách nhiệm đối với:", "ETIK is not responsible for:")}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Nội dung và việc tổ chức sự kiện của BTC", "Content and event organization by the Organizer")}</li>
            <li>{tt("Thiệt hại phát sinh từ việc người dùng cung cấp thông tin sai", "Damages arising from users providing incorrect information")}</li>
            <li>{tt("Sự cố từ bên thứ ba (ngân hàng, hệ thống mạng…)", "Incidents from third parties (banks, network systems…)")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("13. Tạm ngưng và chấm dứt dịch vụ", "13. Suspension and termination of services")}
          </h3>
          <p>{tt("ETIK có quyền:", "ETIK has the right to:")}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Tạm ngưng hoặc chấm dứt cung cấp dịch vụ", "Suspend or terminate the provision of services")}</li>
            <li>{tt("Khóa tài khoản nếu phát hiện vi phạm", "Lock accounts if violations are detected")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("14. Sửa đổi và hiệu lực", "14. Amendments and validity")}
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("ETIK có quyền cập nhật Quy chế này bất kỳ lúc nào", "ETIK has the right to update this Regulation at any time")}</li>
            <li>{tt("Phiên bản cập nhật có hiệu lực ngay khi đăng tải", "The updated version is effective immediately upon posting")}</li>
            <li>{tt("Người dùng có trách nhiệm theo dõi thay đổi", "Users are responsible for monitoring changes")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("15. Điều khoản chung", "15. General terms")}
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Quy chế này được điều chỉnh theo pháp luật Việt Nam", "This regulation is governed by Vietnamese law")}</li>
            <li>{tt("Trường hợp có tranh chấp không giải quyết được, các bên có quyền đưa ra cơ quan có thẩm quyền", "In case of disputes that cannot be resolved, the parties have the right to bring them to the competent authority")}</li>
          </ul>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="font-medium text-gray-800">
            {tt("Hiệu lực: ", "Effective date: ")}{tt("Áp dụng từ thời điểm công bố trên website ETIK.vn", "Applied from the time of publication on the website ETIK.vn")}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            © {tt("Công ty TNHH Tiên Phong Thông Minh. All rights reserved.", "Tien Phong Smart Co.,Ltd. All rights reserved.")}
          </p>
        </div>
      </div>
    </section>
  );
}
