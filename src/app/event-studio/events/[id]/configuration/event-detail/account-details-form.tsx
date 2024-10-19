'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Grid from '@mui/material/Unstable_Grid2';
import { Stack, TextField } from '@mui/material';

const states = [
  { value: 'alabama', label: 'Alabama' },
  { value: 'new-york', label: 'New York' },
  { value: 'san-francisco', label: 'San Francisco' },
  { value: 'los-angeles', label: 'Los Angeles' },
] as const;

export function AccountDetailsForm(): React.JSX.Element {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <Stack spacing={3}>
        <Card>
          <CardHeader title="Thông tin sự kiện" />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid md={6} xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Tên sự kiện</InputLabel>
                  <OutlinedInput defaultValue="REFUND MEETING ĐÀ NẴNG" label="First name" name="firstName" />
                </FormControl>
              </Grid>
              <Grid md={6} xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Đơn vị tổ chức</InputLabel>
                  <OutlinedInput defaultValue="Rivers" label="Đơn vị tổ chức" name="lastName" />
                </FormControl>
              </Grid>
              <Grid md={6} xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Email đơn vị tổ chức</InputLabel>
                  <OutlinedInput defaultValue="sofia@devias.io" label="Email đơn vị tổ chức" name="email" />
                </FormControl>
              </Grid>
              <Grid md={6} xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Số điện thoại đơn vị tổ chức</InputLabel>
                  <OutlinedInput label="Phone number" name="Số điện thoại đơn vị tổ chức" type="tel" />
                </FormControl>
              </Grid>
              <Grid md={6} xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Tỉnh / Thành phố</InputLabel>
                  <Select defaultValue="New York" label="Tỉnh / Thành phố" name="state" variant="outlined">
                    {states.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid md={6} xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Quận / huyện</InputLabel>
                  <OutlinedInput label="Quận / huyện" />
                </FormControl>
              </Grid>
              <Grid md={12} xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Mô tả</InputLabel>
                  <OutlinedInput label="Mô tả" name="description" type="text" />
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Địa điểm & Thời gian" />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid md={12} xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Địa điểm</InputLabel>
                  <OutlinedInput defaultValue="" label="Địa điểm" name="firstName" />
                </FormControl>
              </Grid>

              <Grid md={6} xs={12}>
                <FormControl fullWidth>
                  <InputLabel>URL Địa điểm</InputLabel>
                  <OutlinedInput label="URL Địa điểm" />
                </FormControl>
              </Grid>
              <Grid md={6} xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Hướng dẫn thêm</InputLabel>
                  <OutlinedInput label="Hướng dẫn thêm" />
                </FormControl>
              </Grid>

              <Grid md={6} xs={12}>
                <FormControl fullWidth required>
                  <TextField
                    label="Thời gian bắt đầu"
                    type="datetime-local"
                    defaultValue="2024-10-16T12:30"
                    InputLabelProps={{
                      shrink: true, // This keeps the label visible when a date is selected
                    }}
                  />
                </FormControl>
              </Grid>
              <Grid md={6} xs={12}>
                <FormControl fullWidth required>
                  <TextField
                    label="Thời gian kết thúc"
                    type="datetime-local"
                    defaultValue="2024-10-16T14:00"
                    InputLabelProps={{
                      shrink: true, // This keeps the label visible when a date is selected
                    }}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: '3' }}>
          <Button variant="contained">Lưu</Button>
        </Grid>
      </Stack>
    </form>
  );
}
