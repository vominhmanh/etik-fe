'use client';

import * as React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export interface DobDatePickerProps {
  // Bỏ trống khi label đã được hiển thị riêng bên ngoài (FormFieldLabel), để tránh
  // lặp label bên trong control - đồng bộ với các input khác trong form.
  label?: string;
  // Giá trị lưu/gửi đi luôn ở dạng ISO "YYYY-MM-DD" - chỉ phần hiển thị/nhập là DD/MM/YYYY.
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  required?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
}

export function DobDatePicker({
  label,
  value,
  onChange,
  required,
  disabled,
  size = 'small',
  fullWidth = true,
}: DobDatePickerProps): React.JSX.Element {
  const parsedValue = React.useMemo(() => {
    if (!value) return null;
    const parsed = dayjs(value, 'YYYY-MM-DD', true);
    return parsed.isValid() ? parsed : null;
  }, [value]);

  return (
    <DatePicker
      label={label}
      format="DD/MM/YYYY"
      value={parsedValue}
      disabled={disabled}
      maxDate={dayjs()}
      onChange={(newValue: Dayjs | null) => {
        onChange(newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : null);
      }}
      slotProps={{
        textField: {
          fullWidth,
          size,
          required,
          placeholder: label ? undefined : 'DD/MM/YYYY',
        },
      }}
    />
  );
}
