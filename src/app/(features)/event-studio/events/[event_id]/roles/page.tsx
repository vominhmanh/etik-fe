'use client';

import * as React from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import axios, { AxiosResponse } from 'axios';

import NotificationContext from '@/contexts/notification-context';
import Card from '@mui/material/Card';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import { RolesTable } from './roles-table';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import {
  CardContent,
  CardHeader,
  Checkbox,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  Switch,
} from '@mui/material';
import { ArrowRight } from '@phosphor-icons/react';

export interface User {
  id: number;
  email: string;
}

export interface Role {
  eventId: number;
  userId: number;
  role: string;
  isCreator: boolean;
  allowCheckIn: boolean;
  allowSellTicket: boolean;
  alias?: string | null; // Optional field
  createdAt?: string | null; // Date fields are strings in TypeScript, and this is optional
  user?: User; // Optional field
}
type RoleOption = 'owner' | 'member' | 'supporter'

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = 'Phân quyền | ETIK - Vé điện tử & Quản lý sự kiện';
  }, []);

  const [roles, setRoles] = React.useState<Role[]>([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  // State for Modal
  const [isAddMemberModalOpen, setAddMemberModalOpen] = React.useState<boolean>(false);
  const [email, setEmail] = React.useState<string>('');
  const [alias, setAlias] = React.useState<string>('');
  const [role, setRole] = React.useState<RoleOption>('member')
  const [allowCheckIn, setAllowCheckIn] = React.useState(false)
  const [allowSellTicket, setAllowSellTicket] = React.useState(false)

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to the first page whenever rows per page change
  };

  async function fetchTransactions() {
    try {
      setIsLoading(true);
      const response: AxiosResponse<Role[]> = await baseHttpServiceInstance.get(
        `/event-studio/events/${params.event_id}/roles`
      );
      setRoles(response.data);
    } catch (error) {
      notificationCtx.error('Lỗi:', error);
    } finally {
      setIsLoading(false);
    }
  }

  React.useEffect(() => {
    fetchTransactions();
  }, [params.event_id]);

  
  const handleAddMember = async () => {
    if (!email.trim()) {
      notificationCtx.error('Vui lòng nhập email')
      return
    }

    if (!allowCheckIn && !allowSellTicket) {
      notificationCtx.error('Vui lòng chọn ít nhất một tùy chọn cho Cộng tác viên')
      return
    }

    try {
      setIsLoading(true)
      await baseHttpServiceInstance.post(
        `/event-studio/events/${params.event_id}/roles`,
        {
          email: email.trim(),
          alias,
          role,
          allowCheckIn: allowCheckIn,
          allowSellTicket: allowSellTicket,
        }
      )
      await fetchTransactions()
      setAddMemberModalOpen(false)
      setEmail('')
      setAlias('')
      // reset thêm
      setRole('member')
      setAllowCheckIn(false)
      setAllowSellTicket(false)
      notificationCtx.success('Thêm người dùng thành công.')
    } catch (error) {
      notificationCtx.error('Lỗi:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteMember = async (userId: number) => {
    const roleToDelete = roles.find(role => role.userId === userId)
    if (!roleToDelete) return

    if (!confirm(`Bạn có chắc chắn muốn xoá ${roleToDelete.user?.email}?`)) return;

    try {
      setIsLoading(true);
      const response: AxiosResponse<Role[]> = await baseHttpServiceInstance.delete(
        `/event-studio/events/${params.event_id}/roles`,
        { data: { userId } }
      );
      fetchTransactions();
      notificationCtx.success('Xoá người dùng thành công.');
    } catch (error) {
      notificationCtx.error('Lỗi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const paginatedCustomers = applyPagination(roles, page, rowsPerPage);

  return (
    <>
      <Stack spacing={3}>
        <Backdrop
          open={isLoading}
          sx={{
            color: '#fff',
            zIndex: (theme) => theme.zIndex.drawer + 1000,
            marginLeft: '0px !important',
          }}
        >
          <CircularProgress color="inherit" />
        </Backdrop>{' '}
        <Stack direction="row" spacing={3}>
          <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
            <Typography variant="h4">Phân quyền</Typography>
          </Stack>
          <div>
            <Button
              startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
              variant="contained"
              onClick={() => setAddMemberModalOpen(true)}
            >
              Thêm
            </Button>
          </div>
        </Stack>
        <RolesTable
          count={roles.length}
          page={page}
          rows={paginatedCustomers}
          rowsPerPage={rowsPerPage}
          eventId={params.event_id}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onDeleteMember={handleDeleteMember}
        />
      </Stack>

      <Modal
        open={isAddMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        aria-labelledby="add-member-modal-title"
        aria-describedby="add-member-modal-description"
      >
        <Container maxWidth="xl">
          <Card
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { sm: 500, xs: '90%' },
              bgcolor: 'background.paper',
              boxShadow: 24,
            }}
          >
            <CardHeader title="Thêm thành viên" />
            <Divider />
            <CardContent>
              <Stack spacing={3} alignItems="flex-start">
                {/* Email */}
                <Stack direction="row" spacing={1} alignItems="center">
                  <InputLabel htmlFor="email">Email:</InputLabel>
                  <OutlinedInput
                    id="email"
                    required
                    size="small"
                    sx={{ maxWidth: 300 }}
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </Stack>

                {/* Alias */}
                <Stack direction="row" spacing={1} alignItems="center">
                  <InputLabel htmlFor="alias">Tên gợi nhớ:</InputLabel>
                  <OutlinedInput
                    id="alias"
                    size="small"
                    sx={{ maxWidth: 200 }}
                    value={alias}
                    onChange={e => setAlias(e.target.value)}
                  />
                </Stack>

                {/* ▶️ Select Role */}
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel id="role-select-label">Quyền</InputLabel>
                  <Select
                    labelId="role-select-label"
                    value={role}
                    label="Quyền"
                    onChange={e => setRole(e.target.value as RoleOption)}
                  >
                    <MenuItem value="owner">Quản trị viên</MenuItem>
                    <MenuItem value="member">Thành viên</MenuItem>
                    <MenuItem value="supporter">Cộng tác viên</MenuItem>
                  </Select>
                </FormControl>

                {/* ▶️ Khi chọn supporter mới hiện 2 checkbox */}
                {role === 'supporter' && (
                  <Stack direction="row" spacing={2}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={allowCheckIn}
                          onChange={e => setAllowCheckIn(e.target.checked)}
                        />
                      }
                      label="Chỉ soát vé"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={allowSellTicket}
                          onChange={e => setAllowSellTicket(e.target.checked)}
                        />
                      }
                      label="Chỉ bán vé"
                    />
                  </Stack>
                )}
                <Stack spacing={1}>
                  <Typography variant='caption'><b>Quản trị viên:</b> cho phép toàn bộ thao tác + chỉnh sửa sự kiện, giá vé, phân quyền</Typography>
                  <Typography variant='caption'><b>Thành viên:</b> cho phép toàn bộ thao tác</Typography>
                  <Typography variant='caption'><b>Cộng tác viên:</b> cho phép xem và thao tác hạn chế.</Typography>
                </Stack>
              </Stack>
            </CardContent>
            <Divider />
            <Stack direction="row" spacing={2} justifyContent="flex-end" p={2}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setAddMemberModalOpen(false)}
              >
                Hủy
              </Button>
              <Button
                variant="contained"
                size="small"
                endIcon={<ArrowRight />}
                onClick={handleAddMember}
              >
                Lưu
              </Button>
            </Stack>
          </Card>
        </Container>
      </Modal>
    </>
  );
}

function applyPagination(rows: Role[], page: number, rowsPerPage: number): Role[] {
  return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
}
