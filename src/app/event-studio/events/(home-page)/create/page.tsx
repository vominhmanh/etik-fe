import type { Metadata } from 'next';
import Grid from '@mui/material/Unstable_Grid2';
import { config } from '@/config';
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import * as React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardHeader from '@mui/material/CardHeader';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';


export const metadata = { title: `Overview | Dashboard | ${config.site.name}` } satisfies Metadata;

const states = [
  { value: 'alabama', label: 'Alabama' },
  { value: 'new-york', label: 'New York' },
  { value: 'san-francisco', label: 'San Francisco' },
  { value: 'los-angeles', label: 'Los Angeles' },
] as const;

export default function Page(): React.JSX.Element {
  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Tạo sự kiện</Typography>
        </Stack>
      </Stack>
      <Grid container spacing={3}>
        <Grid lg={12} sm={12} xs={12}>
          <form>
            <Card>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Tên sự kiện</InputLabel>
                      <OutlinedInput label="First name" name="name" />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Đơn vị tổ chức</InputLabel>
                      <OutlinedInput label="Last name" name="organizer" />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Địa chỉ email</InputLabel>
                      <OutlinedInput label="Email address" name="email" />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Số điện thoại liên hệ</InputLabel>
                      <OutlinedInput label="Phone number" name="phone_number" type="tel" />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: '3'}}>
              <Button variant="contained">Tạo</Button>
            </Grid >
          </form>
        </Grid>
      </Grid>
    </Stack>
  );
}
