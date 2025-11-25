import Card from '@mui/material/Card';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { useTranslation } from '@/contexts/locale-context';
import * as React from 'react';

export function CompaniesFilters(): React.JSX.Element {
  const { tt } = useTranslation();
  return (
    <Card sx={{ p: 2 }}>
      <OutlinedInput
        defaultValue=""
        fullWidth
        placeholder={tt("Tìm", "Search")}
        startAdornment={
          <InputAdornment position="start">
            <MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
          </InputAdornment>
        }
        sx={{ maxWidth: '500px' }}
      />
    </Card>
  );
}
