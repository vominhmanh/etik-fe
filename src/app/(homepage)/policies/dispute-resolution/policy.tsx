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
            {tt("Chính sách giải quyết khiếu nại và tranh chấp này được ban hành nhằm thiết lập cơ chế tiếp nhận, xử lý và giải quyết các khiếu nại, phản ánh, cũng như tranh chấp phát sinh trong quá trình sử dụng dịch vụ trên nền tảng thương mại điện tử ETIK.vn, bao gồm nhưng không giới hạn các giao dịch mua bán vé điện tử, việc tổ chức sự kiện của các Đơn vị tổ chức sự kiện (sau đây gọi là “BTC”), cũng như việc sử dụng dịch vụ của người mua.", "This dispute and complaint resolution policy is issued to establish a mechanism for receiving, handling, and resolving complaints, feedback, and disputes arising during the use of services on the ETIK.vn e-commerce platform, including but not limited to electronic ticket sales, event organization by Event Organizers (hereinafter referred to as \"Organizers\"), as well as the buyers' use of services.")}
          </p>
          <p>
            {tt("Chính sách này áp dụng đối với tất cả các cá nhân, tổ chức tham gia hoặc có liên quan đến giao dịch trên nền tảng ETIK.vn và được xem là một phần không thể tách rời của Điều khoản sử dụng và Quy chế hoạt động của nền tảng.", "This policy applies to all individuals and organizations participating in or related to transactions on the ETIK.vn platform and is considered an integral part of the platform's Terms of Use and Operating Regulations.")}
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("2. Nguyên tắc giải quyết tranh chấp", "2. Dispute resolution principles")}
          </h3>
          <p>
            {tt("Mọi khiếu nại và tranh chấp phát sinh trên nền tảng ETIK.vn sẽ được giải quyết trên cơ sở tôn trọng quyền và lợi ích hợp pháp của các bên liên quan, đảm bảo tính minh bạch, khách quan và thiện chí hợp tác.", "All complaints and disputes arising on the ETIK.vn platform will be resolved based on respecting the legal rights and interests of the related parties, ensuring transparency, objectivity, and a cooperative spirit.")}
          </p>
          <p>
            {tt("ETIK khuyến khích các bên ưu tiên giải quyết tranh chấp thông qua thương lượng và hòa giải, trên tinh thần thiện chí và hợp tác, trước khi sử dụng đến các biện pháp pháp lý hoặc cơ quan có thẩm quyền.", "ETIK encourages parties to prioritize resolving disputes through negotiation and mediation, in a spirit of goodwill and cooperation, before resorting to legal measures or competent authorities.")}
          </p>
          <p>
            {tt("Trong mọi trường hợp, việc giải quyết tranh chấp phải tuân thủ các quy định của pháp luật Việt Nam hiện hành.", "In all cases, dispute resolution must comply with current Vietnamese legal regulations.")}
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("3. Cơ chế tiếp nhận khiếu nại", "3. Complaint reception mechanism")}
          </h3>
          <p>
            {tt("Người dùng, bao gồm người mua hoặc BTC, có quyền gửi khiếu nại liên quan đến giao dịch hoặc việc sử dụng dịch vụ thông qua các kênh chính thức của ETIK, bao gồm email hoặc số điện thoại hỗ trợ được công bố trên website.", "Users, including buyers or Organizers, have the right to send complaints related to transactions or the use of services through ETIK's official channels, including the support email or phone number published on the website.")}
          </p>
          <p>
            {tt("Khi gửi khiếu nại, người khiếu nại có trách nhiệm cung cấp đầy đủ, trung thực và chính xác các thông tin liên quan, bao gồm nhưng không giới hạn ở mã đơn hàng, thông tin liên hệ, nội dung khiếu nại và các tài liệu, bằng chứng kèm theo (nếu có), nhằm tạo điều kiện cho việc xác minh và xử lý được thực hiện nhanh chóng và chính xác.", "When submitting a complaint, the complainant is responsible for providing complete, truthful, and accurate relevant information, including but not limited to the order code, contact information, complaint content, and accompanying documents and evidence (if any), to facilitate prompt and accurate verification and processing.")}
          </p>
          <p>
            {tt("ETIK có quyền từ chối tiếp nhận hoặc yêu cầu bổ tiếp thông tin đối với các khiếu nại không đầy đủ, không rõ ràng hoặc có dấu hiệu gian lận.", "ETIK reserves the right to refuse to receive or request additional information for incomplete, unclear complaints or those showing signs of fraud.")}
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("4. Quy trình xử lý khiếu nại", "4. Complaint handling process")}
          </h3>
          <p>
            {tt("Sau khi tiếp nhận khiếu nại hợp lệ, ETIK sẽ tiến hành xác nhận việc tiếp nhận trong thời hạn tối đa hai mươi bốn (24) giờ làm việc và thực hiện quy trình xử lý theo các bước nội bộ, bao gồm việc kiểm tra dữ liệu hệ thống, đối chiếu thông tin giao dịch, cũng như phối hợp với các bên liên quan, đặc biệt là BTC, để xác minh nội dung khiếu nại.", "Upon receiving a valid complaint, ETIK will confirm receipt within a maximum of twenty-four (24) working hours and execute the handling process according to internal steps, including checking system data, cross-referencing transaction information, and coordinating with relevant parties, especially the Organizer, to verify the complaint's content.")}
          </p>
          <p>
            {tt("Trên cơ sở kết quả xác minh, ETIK sẽ đề xuất phương án xử lý phù hợp, có thể bao gồm nhưng không giới hạn ở việc hoàn tiền, cấp lại vé, điều chỉnh thông tin hoặc các biện pháp khắc phục khác nhằm đảm bảo quyền lợi hợp pháp của người dùng.", "Based on the verification results, ETIK will propose a suitable resolution plan, which may include but is not limited to refunds, ticket re-issuance, information adjustments, or other remedial measures to ensure the users' legal rights.")}
          </p>
          <p>
            {tt("Thời gian xử lý khiếu nại thông thường không quá bảy (07) ngày làm việc, trừ trường hợp vụ việc có tính chất phức tạp hoặc cần phối hợp với bên thứ ba, khi đó thời gian xử lý có thể được gia hạn nhưng ETIK sẽ thông báo cho các bên liên quan.", "The standard complaint processing time is no more than seven (07) working days, except in complex cases or those requiring third-party coordination, in which case the processing time may be extended, but ETIK will notify the relevant parties.")}
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("5. Vai trò trung gian của ETIK", "5. ETIK's intermediary role")}
          </h3>
          <p>
            {tt("ETIK hoạt động với tư cách là nền tảng cung cấp dịch vụ trung gian trong giao dịch giữa người mua và BTC, do đó ETIK không phải là bên trực tiếp cung cấp dịch vụ sự kiện, trừ khi có thông báo khác.", "ETIK operates as a platform providing intermediary services in transactions between buyers and Organizers; therefore, ETIK is not the direct provider of event services, unless otherwise notified.")}
          </p>
          <p>
            {tt("Trong quá trình giải quyết tranh chấp, ETIK có trách nhiệm cung cấp thông tin giao dịch, hỗ trợ kết nối các bên và tạo điều kiện thuận lợi cho việc thương lượng, hòa giải, nhưng không chịu trách nhiệm thay thế nghĩa vụ của BTC đối với người mua.", "During the dispute resolution process, ETIK is responsible for providing transaction information, assisting in connecting the parties, and facilitating negotiation and mediation, but is not responsible for bearing the Organizer's obligations towards the buyer.")}
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("6. Trách nhiệm của các bên liên quan", "6. Responsibilities of related parties")}
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              {tt("BTC có trách nhiệm chính trong việc giải quyết các khiếu nại liên quan đến nội dung, chất lượng và việc tổ chức sự kiện, bao gồm cả nghĩa vụ hoàn tiền hoặc bồi thường (nếu có) theo cam kết đã công bố.", "The Organizer holds the primary responsibility for resolving complaints related to the content, quality, and organization of the event, including refund or compensation obligations (if any) according to published commitments.")}
            </li>
            <li>
              {tt("Người mua có trách nhiệm cung cấp thông tin trung thực, hợp tác trong quá trình xử lý và tuân thủ các quy định của nền tảng cũng như của BTC.", "Buyers are responsible for providing truthful information, cooperating during the processing, and complying with the platform's and the Organizer's regulations.")}
            </li>
            <li>
              {tt("ETIK có trách nhiệm hỗ trợ, điều phối và đảm bảo quy trình xử lý khiếu nại được thực hiện một cách minh bạch, đúng quy định và trong thời gian hợp lý.", "ETIK is responsible for supporting, coordinating, and ensuring the complaint handling process is carried out transparently, in accordance with regulations, and within a reasonable timeframe.")}
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("7. Hoàn tiền và biện pháp khắc phục", "7. Refunds and remedies")}
          </h3>
          <p>
            {tt("Việc hoàn tiền có thể được thực hiện trong các trường hợp bao gồm nhưng không giới hạn ở việc sự kiện bị hủy, thay đổi nghiêm trọng ảnh hưởng đến quyền lợi người mua, hoặc do lỗi phát sinh từ hệ thống ETIK.", "Refunds may be processed in cases including but not limited to event cancellation, significant changes affecting the buyer's rights, or errors arising from the ETIK system.")}
          </p>
          <p>
            {tt("Tùy theo từng trường hợp cụ thể, việc hoàn tiền có thể do BTC trực tiếp thực hiện hoặc được ETIK hỗ trợ thông qua hệ thống, với thời gian xử lý thông thường từ năm (05) đến mười lăm (15) ngày làm việc.", "Depending on each specific case, refunds may be processed directly by the Organizer or supported by ETIK through the system, with a typical processing time of five (05) to fifteen (15) working days.")}
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("8. Cơ chế leo thang và giải quyết tranh chấp", "8. Escalation and dispute resolution mechanism")}
          </h3>
          <p>
            {tt("Trong trường hợp các bên không thể đạt được thỏa thuận thông qua thương lượng và hòa giải, tranh chấp có thể được chuyển đến các cơ quan, tổ chức có thẩm quyền theo quy định của pháp luật, bao gồm nhưng không giới hạn ở cơ quan quản lý nhà nước về thương mại điện tử, tổ chức bảo vệ quyền lợi người tiêu dùng hoặc Tòa án có thẩm quyền.", "In the event the parties cannot reach an agreement through negotiation and mediation, the dispute may be escalated to competent authorities or organizations according to the law, including but not limited to state management agencies for e-commerce, consumer protection organizations, or competent Courts.")}
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("9. Giới hạn trách nhiệm", "9. Limitation of liability")}
          </h3>
          <p>
            {tt("Trong phạm vi pháp luật cho phép, ETIK không chịu trách nhiệm đối với các tranh chấp phát sinh từ việc BTC không thực hiện hoặc thực hiện không đúng nghĩa vụ của mình, cũng như các thiệt hại gián tiếp, ngẫu nhiên hoặc hệ quả phát sinh ngoài khả năng kiểm soát hợp lý của ETIK.", "To the extent permitted by law, ETIK is not liable for disputes arising from the Organizer's failure to perform or improper performance of its obligations, as well as indirect, incidental, or consequential damages arising beyond ETIK's reasonable control.")}
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("10. Bảo mật thông tin khiếu nại", "10. Confidentiality of complaint information")}
          </h3>
          <p>
            {tt("Tất cả thông tin liên quan đến khiếu nại và tranh chấp sẽ được ETIK bảo mật và chỉ sử dụng cho mục đích xử lý khiếu nại, trừ trường hợp phải cung cấp theo yêu cầu của cơ quan có thẩm quyền theo quy định pháp luật.", "All information related to complaints and disputes will be kept confidential by ETIK and used strictly for complaint processing purposes, except when provision is required by competent authorities according to the law.")}
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">
            {tt("11. Hiệu lực và sửa đổi", "11. Effectiveness and amendments")}
          </h3>
          <p>
            {tt("Chính sách này có hiệu lực kể từ thời điểm được công bố trên website ETIK.vn. ETIK có quyền sửa đổi, bổ sung nội dung chính sách này vào bất kỳ thời điểm nào và các sửa đổi sẽ có hiệu lực ngay khi được đăng tải.", "This policy is effective from the time it is published on the ETIK.vn website. ETIK reserves the right to amend or supplement the contents of this policy at any time, and such amendments will take effect immediately upon posting.")}
          </p>
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
