"use client";

import { useTranslation } from "@/contexts/locale-context";

export default function Policy() {
  const { tt } = useTranslation();

  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 py-5 md:py-5">
      <div className="rounded-2xl bg-white shadow-xl p-8 md:p-12 text-gray-700 space-y-8 border border-gray-100">

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("1. Mục đích và phạm vi áp dụng", "1. Purpose and scope of application")}
          </h3>
          <p>
            {tt("Chính sách giao dịch này quy định các điều kiện, quy trình và nguyên tắc liên quan đến việc mua bán vé điện tử trên nền tảng ", "This transaction policy regulates the conditions, processes, and principles related to the sale and purchase of electronic tickets on the ")}
            <strong>ETIK.vn</strong>.
          </p>
          <p>{tt("Chính sách áp dụng đối với:", "The policy applies to:")}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Người mua vé", "Ticket buyers")}</li>
            <li>{tt("Đơn vị tổ chức sự kiện (BTC)", "Event Organizers (Organizer)")}</li>
            <li>{tt("Các bên tham gia giao dịch trên nền tảng", "Parties involved in transactions on the platform")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("2. Nguyên tắc giao dịch", "2. Transaction principles")}
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              {tt("Giao dịch được thực hiện ", "Transactions are carried out ")}
              <strong>{tt("tự nguyện, minh bạch và tuân thủ pháp luật", "voluntarily, transparently and in compliance with the law")}</strong>
            </li>
            <li>
              {tt("Vé điện tử chỉ có giá trị khi:", "E-tickets are only valid when:")}
              <ul className="list-[circle] pl-5 mt-2 space-y-1 text-gray-600">
                <li>{tt("Được phát hành qua hệ thống ETIK", "Issued through the ETIK system")}</li>
                <li>{tt("Thanh toán đã hoàn tất", "Payment is completed")}</li>
              </ul>
            </li>
            <li>
              {tt("ETIK đóng vai trò ", "ETIK acts as an ")}
              <strong>{tt("trung gian cung cấp nền tảng công nghệ", "intermediary providing a technology platform")}</strong>
              {tt(", không phải bên bán vé (trừ khi có thông báo riêng)", ", not a ticket seller (unless otherwise announced)")}
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("3. Quy trình đặt mua vé", "3. Ticket booking process")}
          </h3>

          <h4 className="text-lg font-semibold text-gray-800 mt-4">{tt("3.1 Các bước giao dịch", "3.1 Transaction steps")}</h4>
          <ol className="list-decimal pl-5 space-y-2">
            <li>{tt("Người mua truy cập ETIK.vn", "Buyer accesses ETIK.vn")}</li>
            <li>{tt("Lựa chọn sự kiện và loại vé", "Select an event and ticket type")}</li>
            <li>{tt("Nhập thông tin cá nhân theo yêu cầu", "Enter personal information as required")}</li>
            <li>{tt("Xác nhận đơn hàng", "Confirm the order")}</li>
            <li>{tt("Thực hiện thanh toán", "Make payment")}</li>
            <li>{tt("Nhận vé điện tử qua email", "Receive e-ticket via email")}</li>
          </ol>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("3.2 Xác nhận đơn hàng", "3.2 Order confirmation")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              {tt("Đơn hàng chỉ được xác nhận khi:", "The order is only confirmed when:")}
              <ul className="list-[circle] pl-5 mt-2 space-y-1 text-gray-600">
                <li>{tt("Thanh toán thành công", "Successful payment")}</li>
                <li>{tt("Hệ thống ETIK ghi nhận giao dịch hợp lệ", "ETIK system records a valid transaction")}</li>
              </ul>
            </li>
            <li>
              {tt("Sau khi xác nhận:", "After confirmation:")}
              <ul className="list-[circle] pl-5 mt-2 space-y-1 text-gray-600">
                <li>{tt("Vé sẽ được gửi tự động qua email", "Tickets will be sent automatically via email")}</li>
                <li>{tt("Người mua có thể tra cứu trong tài khoản (nếu có)", "Buyer can look up in their account (if any)")}</li>
              </ul>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("4. Phương thức thanh toán", "4. Payment methods")}
          </h3>
          <p>{tt("ETIK hỗ trợ các phương thức thanh toán:", "ETIK supports payment methods:")}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Thanh toán qua Napas 247", "Payment via Napas 247")}</li>
            <li>{tt("Chuyển khoản ngân hàng", "Bank transfer")}</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("4.1 Điều kiện thanh toán", "4.1 Payment conditions")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Người mua phải thanh toán đầy đủ giá trị đơn hàng", "The buyer must pay the full value of the order")}</li>
            <li>{tt("Giao dịch chỉ hoàn tất khi hệ thống xác nhận tiền đã nhận", "The transaction is only completed when the system confirms the money has been received")}</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("4.2 Bảo mật thanh toán", "4.2 Payment security")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("ETIK không lưu trữ thông tin nhạy cảm (số thẻ, CVV…)", "ETIK does not store sensitive information (card number, CVV...)")}</li>
            <li>{tt("Thanh toán được xử lý qua hệ thống trung gian hoặc ngân hàng", "Payments are processed via intermediary systems or banks")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("5. Phát hành và giao nhận vé", "5. Ticket issuance and delivery")}
          </h3>

          <h4 className="text-lg font-semibold text-gray-800 mt-4">{tt("5.1 Hình thức vé", "5.1 Ticket format")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Vé điện tử (E-ticket)", "Electronic ticket (E-ticket)")}</li>
            <li>{tt("Mã QR hoặc nhận diện khuôn mặt", "QR code or facial recognition")}</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("5.2 Thời điểm phát hành", "5.2 Issuance time")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Vé được phát hành ngay sau khi thanh toán thành công", "Tickets are issued immediately after successful payment")}</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("5.3 Phương thức giao vé", "5.3 Ticket delivery method")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Gửi qua email đã đăng ký", "Sent to the registered email")}</li>
            <li>{tt("Có thể truy cập lại qua hệ thống ETIK", "Can be accessed again via the ETIK system")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("6. Kiểm soát và sử dụng vé", "6. Ticket control and usage")}
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              {tt("Vé chỉ có giá trị sử dụng ", "Tickets are only valid for ")}
              <strong>{tt("một lần", "single use")}</strong>
              {tt(", trừ khi BTC quy định khác", ", unless otherwise specified by the Organizer")}
            </li>
            <li>
              {tt("Vé được kiểm tra thông qua:", "Tickets are checked via:")}
              <ul className="list-[circle] pl-5 mt-2 space-y-1 text-gray-600">
                <li>{tt("Ứng dụng soát vé ETIK", "ETIK Ticket Check app")}</li>
                <li>{tt("Hệ thống nhận diện khuôn mặt (nếu áp dụng)", "Facial recognition system (if applicable)")}</li>
              </ul>
            </li>
            <li>
              {tt("Người mua có trách nhiệm:", "The buyer is responsible for:")}
              <ul className="list-[circle] pl-5 mt-2 space-y-1 text-gray-600">
                <li>{tt("Bảo mật vé", "Securing the ticket")}</li>
                <li>{tt("Không chia sẻ hoặc chuyển nhượng trái phép", "Not sharing or transferring illegally")}</li>
              </ul>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("7. Chính sách hoàn vé, đổi vé", "7. Ticket refund and exchange policy")}
          </h3>

          <h4 className="text-lg font-semibold text-gray-800 mt-4">{tt("7.1 Nguyên tắc chung", "7.1 General principles")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Chính sách hoàn/đổi vé do BTC quy định riêng cho từng sự kiện", "Refund/exchange policy is separately regulated by the Organizer for each event")}</li>
            <li>{tt("ETIK cung cấp công cụ hỗ trợ xử lý", "ETIK provides processing support tools")}</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("7.2 Trường hợp được hoàn vé", "7.2 Cases eligible for a refund")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Sự kiện bị hủy", "Event canceled")}</li>
            <li>{tt("Sự kiện thay đổi lớn ảnh hưởng đến quyền lợi người mua", "Major event changes affecting buyer benefits")}</li>
            <li>{tt("Theo chính sách cụ thể của BTC", "According to the specific policy of the Organizer")}</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("7.3 Thời gian hoàn tiền", "7.3 Refund time")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              {tt("Từ ", "From ")}
              <strong>{tt("05 – 15 ngày làm việc", "05 - 15 working days")}</strong>
              {tt(" tùy phương thức thanh toán", " depending on the payment method")}
            </li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("7.4 Phí hoàn vé", "7.4 Refund fee")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Có thể áp dụng tùy theo chính sách của BTC", "May apply depending on the Organizer's policy")}</li>
            <li>{tt("Sẽ được thông báo rõ trước khi thực hiện", "Will be clearly announced before implementation")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("8. Chính sách hủy sự kiện", "8. Event cancellation policy")}
          </h3>
          <p>{tt("Trong trường hợp sự kiện bị hủy:", "In case the event is canceled:")}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("BTC có trách nhiệm hoàn tiền cho người mua", "The Organizer is responsible for refunding the buyer")}</li>
            <li>
              {tt("ETIK hỗ trợ:", "ETIK supports:")}
              <ul className="list-[circle] pl-5 mt-2 space-y-1 text-gray-600">
                <li>{tt("Xử lý dữ liệu", "Data processing")}</li>
                <li>{tt("Thực hiện hoàn tiền qua hệ thống", "Processing refunds via the system")}</li>
              </ul>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("9. Xử lý giao dịch lỗi", "9. Error transaction handling")}
          </h3>

          <h4 className="text-lg font-semibold text-gray-800 mt-4">{tt("9.1 Các trường hợp lỗi", "9.1 Error cases")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Thanh toán thành công nhưng chưa nhận vé", "Payment successful but tickets not received")}</li>
            <li>{tt("Thanh toán bị trừ tiền nhưng đơn hàng không ghi nhận", "Money deducted but order not recorded")}</li>
            <li>{tt("Lỗi hệ thống", "System error")}</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("9.2 Cách xử lý", "9.2 Handling method")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              {tt("Người dùng liên hệ ETIK qua:", "Users contact ETIK via:")}
              <ul className="list-[circle] pl-5 mt-2 space-y-1 text-gray-600">
                <li>{tt("Email hoặc hotline", "Email or hotline")}</li>
              </ul>
            </li>
            <li>
              {tt("ETIK sẽ:", "ETIK will:")}
              <ul className="list-[circle] pl-5 mt-2 space-y-1 text-gray-600">
                <li>{tt("Kiểm tra hệ thống", "Check the system")}</li>
                <li>{tt("Phối hợp với ngân hàng/BTC", "Coordinate with bank/Organizer")}</li>
                <li>{tt("Xử lý trong thời gian hợp lý", "Process in a reasonable time")}</li>
              </ul>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("10. Nghĩa vụ của các bên trong giao dịch", "10. Obligations of parties in the transaction")}
          </h3>

          <h4 className="text-lg font-semibold text-gray-800 mt-4">{tt("10.1 Đối với ETIK", "10.1 For ETIK")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Đảm bảo hệ thống vận hành ổn định", "Ensure stable system operation")}</li>
            <li>{tt("Ghi nhận giao dịch chính xác", "Record transactions accurately")}</li>
            <li>{tt("Hỗ trợ xử lý sự cố", "Support troubleshooting")}</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("10.2 Đối với BTC", "10.2 For Organizers")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Cung cấp thông tin vé rõ ràng", "Provide clear ticket information")}</li>
            <li>{tt("Thiết lập chính sách hoàn/đổi minh bạch", "Set up transparent refund/exchange policy")}</li>
            <li>{tt("Thực hiện nghĩa vụ hoàn tiền khi cần", "Perform refund obligations when necessary")}</li>
          </ul>

          <h4 className="text-lg font-semibold text-gray-800 mt-6">{tt("10.3 Đối với Người mua", "10.3 For Buyers")}</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Cung cấp thông tin chính xác", "Provide accurate information")}</li>
            <li>{tt("Thanh toán đầy đủ", "Pay in full")}</li>
            <li>{tt("Kiểm tra thông tin vé sau khi nhận", "Check ticket information after receiving")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("11. Giới hạn trách nhiệm", "11. Limitation of liability")}
          </h3>
          <p>{tt("ETIK không chịu trách nhiệm đối với:", "ETIK is not responsible for:")}</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("Sai sót do người dùng nhập thông tin không chính xác", "Errors due to incorrect user information")}</li>
            <li>{tt("Việc BTC không thực hiện đúng cam kết", "The Organizer failing to fulfill its commitments")}</li>
            <li>{tt("Sự cố phát sinh từ bên thứ ba (ngân hàng, mạng…)", "Incidents from third parties (banks, networks...)")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("12. Điều khoản sửa đổi", "12. Amendment clause")}
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>{tt("ETIK có quyền cập nhật Chính sách này", "ETIK reserves the right to update this Policy")}</li>
            <li>{tt("Thay đổi có hiệu lực ngay khi đăng tải trên website", "Changes take effect immediately upon posting on the website")}</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("13. Hiệu lực", "13. Effectiveness")}
          </h3>
          <p>{tt("Chính sách này có hiệu lực kể từ thời điểm công bố trên ETIK.vn.", "This policy is effective from the time of publication on ETIK.vn.")}</p>
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
