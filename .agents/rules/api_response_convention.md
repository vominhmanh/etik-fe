# API Payload Case Convention

## Quy tắc giao tiếp dữ liệu với Backend API

Trong dự án này, hệ thống Backend được viết bằng Python (dùng `snake_case`), tuy nhiên toàn bộ dữ liệu đi qua HTTP (API Request Body / API Response) đều đã được Backend tự động cấu hình alias để chuyển đổi sang `camelCase`.

Vì vậy, đối với Frontend, Agent cần tuân thủ tuyệt đối quy tắc sau:

1. **Luôn sử dụng `camelCase`** khi định nghĩa các TypeScript `interface` hoặc `type` cho các DTO (Data Transfer Objects) tương tác với API.
2. **Không sử dụng `snake_case`** trong các component hoặc các lời gọi API ở phía Frontend, ngay cả khi API Docs hoặc cấu trúc Database gốc đang lưu bằng `snake_case`.

### Ví dụ chuẩn (TS/JS):

```typescript
// ĐÚNG: Sử dụng camelCase toàn bộ
export interface TransactionResponse {
    eventId: string;
    transactionId: string;
    phoneNumber?: string;
    formAnswers?: Record<string, any>;
}

// SAI: Không dùng snake_case ở frontend
export interface BadTransactionResponse {
    event_id: string;
    transaction_id: string;
    phone_number?: string;
    form_answers?: Record<string, any>;
}
```

**Nhắc nhở AI Agent:**
Khi gọi API hoặc mock dữ liệu API, hãy luôn đảm bảo mapping chuẩn về `camelCase` để đồng bộ với cơ chế `to_camel` của Backend.
