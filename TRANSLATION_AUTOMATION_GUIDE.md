# Translation Automation Guide

## Current Status

**Total files with Vietnamese text**: 173 files
**Completed**: 3 files (events/[event_slug], events/main-nav, account/my-tickets/[transaction_id])
**In Progress**: 1 file (account/my-tickets)
**Remaining**: 169 files

## Automation Strategy

### Option 1: Semi-Automated Find & Replace (Recommended)

Use your IDE's find/replace with regex for bulk operations:

#### Step 1: Add Import Statement

**Find in each file:**
```regex
^import.*from '@/contexts/notification-context';$
```

**Replace with:**
```typescript
import { useTranslation } from '@/contexts/locale-context';
import NotificationContext from '@/contexts/notification-context';
```

#### Step 2: Add Hook to Component

**Find:**
```regex
(export default function \w+.*\{[\s\S]*?)(const \[)
```

**Add after function declaration:**
```typescript
const { tt } = useTranslation();
```

#### Step 3: Replace Common Strings

**Vietnamese → English mappings** (most common 100 strings):

| Vietnamese | English | Frequency |
|-----------|---------|-----------|
| Đăng nhập | Login/Sign In | Very High |
| Đăng ký | Register/Sign Up | Very High |
| Xác nhận | Confirm | Very High |
| Hủy | Cancel | Very High |
| Lưu | Save | Very High |
| Chỉnh sửa | Edit | High |
| Xóa | Delete | High |
| Thêm | Add | High |
| Tìm kiếm | Search | High |
| Chi tiết | Details | High |
| Danh sách | List | High |
| Trạng thái | Status | High |
| Thanh toán | Payment | High |
| Sự kiện | Event | High |
| Vé | Ticket | High |
| Người dùng | User | Medium |
| Tên | Name | Medium |
| Email | Email | Medium |
| Số điện thoại | Phone Number | Medium |
| Địa chỉ | Address | Medium |
| Mật khẩu | Password | Medium |
| Ngày tạo | Created Date | Medium |
| Cập nhật | Update | Medium |
| Thành công | Success | Medium |
| Thất bại | Failed | Medium |
| Chờ xử lý | Pending | Medium |
| Hoàn thành | Completed | Medium |
| Đã hủy | Cancelled | Medium |
| Tổng cộng | Total | Medium |
| Số lượng | Quantity | Medium |
| Giá | Price | Medium |
| Mô tả | Description | Medium |

### Option 2: Node.js Automation Script

Create `/scripts/translate.js`:

```javascript
const fs = require('fs');
const path = require('path');

// Common translation pairs
const translations = {
  'Đăng nhập': 'Login',
  'Đăng ký': 'Register',
  'Xác nhận': 'Confirm',
  'Hủy': 'Cancel',
  'Lưu': 'Save',
  'Chỉnh sửa': 'Edit',
  'Xóa': 'Delete',
  'Thêm': 'Add',
  'Tìm kiếm': 'Search',
  'Chi tiết': 'Details',
  'Danh sách': 'List',
  'Trạng thái': 'Status',
  'Thanh toán': 'Payment',
  'Sự kiện': 'Event',
  'Vé': 'Ticket',
  // Add all 100+ common pairs...
};

function hasVietnamese(text) {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/.test(text);
}

function processFile(filePath) {
  console.log(`Processing: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Step 1: Add import if not present
  if (!content.includes("useTranslation")) {
    content = content.replace(
      /(import.*from '@\/contexts\/notification-context';)/,
      `import { useTranslation } from '@/contexts/locale-context';\n$1`
    );
  }
  
  // Step 2: Add hook after function declaration
  const functionMatch = content.match(/(export default function \w+[^{]*\{)(\s*)(const)/);
  if (functionMatch && !content.includes('const { tt } = useTranslation()')) {
    content = content.replace(
      functionMatch[0],
      `${functionMatch[1]}\n  const { tt } = useTranslation();\n  ${functionMatch[3]}`
    );
  }
  
  // Step 3: Replace Vietnamese strings in JSX
  Object.entries(translations).forEach(([vi, en]) => {
    // Replace in Typography, Button, etc.
    const patterns = [
      new RegExp(`(<Typography[^>]*>)${vi}(<\\/Typography>)`, 'g'),
      new RegExp(`(<Button[^>]*>)${vi}(<\\/Button>)`, 'g'),
      new RegExp(`(>)${vi}(<)`, 'g'),
    ];
    
    patterns.forEach(pattern => {
      content = content.replace(pattern, `$1{tt('${vi}', '${en}')}$2`);
    });
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✓ Completed: ${filePath}`);
}

// Process all files
const filesToProcess = [
  'src/app/(features)/(customer)/account/page.tsx',
  'src/components/auth/login-form.tsx',
  // Add all 173 files...
];

filesToProcess.forEach(processFile);
```

**Run:**
```bash
node scripts/translate.js
```

### Option 3: VS Code Multi-Cursor (Fast for Similar Files)

1. Open multiple similar files (e.g., all auth forms)
2. Use Find in Files (`Ctrl+Shift+F`)
3. Find Vietnamese pattern: `[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]+`
4. Use "Replace in Files" with transform

## File Priority List

### Tier 1: Critical Customer-Facing (Complete These First)

1. ✅ `/events/[event_slug]/page.tsx`
2. ✅ `/events/main-nav.tsx`
3. 🔄 `/account/my-tickets/page.tsx`
4. ✅ `/account/my-tickets/[transaction_id]/page.tsx`
5. `/account/page.tsx`
6. `/marketplace/page.tsx`
7. `/account-event-agency/page.tsx`
8. `/transaction-checkout/successful-transaction/page.tsx`
9. `/transaction-checkout/payment-failed/page.tsx`
10. `/auth/login/page.tsx`
11. `/auth/sign-up/page.tsx`
12. `/auth/reset-password/page.tsx`
13. `/components/auth/login-form.tsx`
14. `/components/auth/sign-up-form.tsx`
15. `/components/auth/reset-password-form.tsx`

**Estimated time**: 4-6 hours

### Tier 2: Share & Public Pages

16-25. Share ticket pages, error pages, homepage

**Estimated time**: 3-4 hours

### Tier 3: Event Studio Admin Pages

26-173. All event-studio management pages

**Estimated time**: 20-25 hours

## Batch Processing by Pattern

### Pattern A: Simple Pages (No Helper Functions)

Files like homepage, error pages - just add import + hook + replace strings

**Steps:**
1. Add import
2. Add hook
3. Find/replace Vietnamese strings
4. Test

**Time per file**: ~5-10 minutes

### Pattern B: Pages with Helper Functions

Files with `getStatusMap`, `getPaymentDetails`, etc.

**Steps:**
1. Add import
2. Convert helper functions to accept `tt` parameter
3. Add hook
4. Update helper function calls
5. Replace JSX strings
6. Test

**Time per file**: ~15-20 minutes

### Pattern C: Complex Event Pages

Event pages with schedules, ticket categories, multiple components

**Steps:**
1. Add import to main page and sub-components
2. Add hooks
3. Update all components
4. Pass `tt` through props if needed
5. Replace all strings
6. Test thoroughly

**Time per file**: ~30-45 minutes

## Testing Checklist

For each translated page:
- [ ] Visit Vietnamese version (no `/en`)
- [ ] Visit English version (`/en` prefix)
- [ ] Toggle language switcher
- [ ] Check all text (titles, buttons, labels, errors, tooltips)
- [ ] Test form validations
- [ ] Check dynamic content
- [ ] Verify helper function outputs
- [ ] Test modals and dialogs

## Progress Tracking

Update this table as you complete files:

| Category | Total | Completed | % |
|----------|-------|-----------|---|
| Customer Pages | 15 | 4 | 27% |
| Auth Pages | 6 | 0 | 0% |
| Share Pages | 5 | 0 | 0% |
| Event Studio | 100 | 0 | 0% |
| Components | 40 | 0 | 0% |
| Services/Utils | 7 | 0 | 0% |
| **Total** | **173** | **4** | **2%** |

## Common Pitfalls

1. **Missing `tt` dependency** in `useEffect` - Add `tt` to dependency array
2. **Helper functions not updated** - Remember to pass `tt` parameter
3. **Hardcoded labels in objects** - Convert to functions that accept `tt`
4. **Date formats** - Use conditional formatting based on locale
5. **Currency** - Use conditional formatting based on locale

## Tips for Speed

1. **Work in batches** - Do all auth forms together, all tables together
2. **Copy-paste similar patterns** - Many pages share structures
3. **Use snippets** - Create VS Code snippets for common patterns
4. **Test in groups** - Test all auth pages together
5. **Focus on visible text first** - Skip console.log, comments initially

## Estimated Total Effort

- **Manual approach**: 35-40 hours
- **Semi-automated**: 15-20 hours
- **Fully automated script**: 8-10 hours (including script dev)

## Recommendation

1. **Week 1**: Complete Tier 1 (critical customer pages) - 15 files
2. **Week 2**: Complete Tier 2 (public pages) - 10 files  
3. **Week 3-4**: Complete Tier 3 (admin pages) - 148 files

Or develop the automation script to handle 80% of the work automatically.

## Next Steps

Choose your approach:
1. ✅ Manual file-by-file (thorough, slower)
2. ✅ Semi-automated with find/replace (faster, requires review)
3. ✅ Full automation script (fastest, needs initial investment)

Current recommendation: **Semi-automated approach** for Tier 1 files, then evaluate automation for Tier 3.

