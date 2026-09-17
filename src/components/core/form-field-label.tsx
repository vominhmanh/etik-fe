'use client';

import * as React from 'react';
import Typography from '@mui/material/Typography';

export interface FormFieldLabelProps {
  label: React.ReactNode;
  required?: boolean;
}

// Nhãn câu hỏi đứng trên control nhập liệu - đậm để phân biệt với giá trị nhập
// bên dưới, nhưng cỡ chữ nhỏ và tinh tế (gần với caption) để không lấn át control.
export function FormFieldLabel({ label, required }: FormFieldLabelProps): React.JSX.Element {
  return (
    <Typography
      sx={{ fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.4, color: 'text.primary', mb: 0.5 }}
    >
      {label}
      {required && <Typography component="span" sx={{ color: 'error.main', fontWeight: 600 }}> *</Typography>}
    </Typography>
  );
}
