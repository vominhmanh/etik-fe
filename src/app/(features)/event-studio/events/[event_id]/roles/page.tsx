'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { AxiosResponse } from 'axios';
import * as React from 'react';

import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';
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
  Select
} from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import OutlinedInput from '@mui/material/OutlinedInput';
import { ArrowRight } from '@phosphor-icons/react';
import { RolesTable } from './roles-table';

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
  const { tt } = useTranslation();
  
  React.useEffect(() => {
    document.title = tt('Phân quyền | ETIK - Vé điện tử & Quản lý sự kiện', 'Permissions | ETIK - Electronic Tickets & Event Management');
  }, [tt]);

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
      notificationCtx.error(tt('Lỗi:', 'Error:'), error);
    } finally {
      setIsLoading(false);
    }
  }

  React.useEffect(() => {
    fetchTransactions();
  }, [params.event_id]);

  
  const handleAddMember = async () => {
    if (!email.trim()) {
      notificationCtx.error(tt('Vui lòng nhập email', 'Please enter email'))
      return
    }

    if (role === 'supporter' && !allowCheckIn && !allowSellTicket) {
      notificationCtx.error(tt('Vui lòng chọn ít nhất một tùy chọn cho Cộng tác viên', 'Please select at least one option for Supporter'))
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
      notificationCtx.success(tt('Thêm người dùng thành công.', 'User added successfully.'))
    } catch (error) {
      notificationCtx.error(tt('Lỗi:', 'Error:'), error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteMember = async (userId: number) => {
    const roleToDelete = roles.find(role => role.userId === userId)
    if (!roleToDelete) return

    if (!confirm(tt(`Bạn có chắc chắn muốn xoá ${roleToDelete.user?.email}?`, `Are you sure you want to delete ${roleToDelete.user?.email}?`))) return;

    try {
      setIsLoading(true);
      const response: AxiosResponse<Role[]> = await baseHttpServiceInstance.delete(
        `/event-studio/events/${params.event_id}/roles`,
        { data: { userId } }
      );
      fetchTransactions();
      notificationCtx.success(tt('Xoá người dùng thành công.', 'User deleted successfully.'));
    } catch (error) {
      notificationCtx.error(tt('Lỗi:', 'Error:'), error);
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
            <Typography variant="h4">{tt('Phân quyền', 'Permissions')}</Typography>
          </Stack>
          <div>
            <Button
              startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
              variant="contained"
              onClick={() => setAddMemberModalOpen(true)}
            >
              {tt('Thêm', 'Add')}
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
            <CardHeader title={tt("Thêm thành viên", "Add Member")} />
            <Divider />
            <CardContent>
              <Stack spacing={3} alignItems="flex-start">
                {/* Email */}
                <Stack direction="row" spacing={1} alignItems="center">
                  <InputLabel htmlFor="email">{tt("Email:", "Email:")}</InputLabel>
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
                  <InputLabel htmlFor="alias">{tt("Tên gợi nhớ:", "Alias:")}</InputLabel>
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
                  <InputLabel id="role-select-label">{tt("Quyền", "Role")}</InputLabel>
                  <Select
                    labelId="role-select-label"
                    value={role}
                    label={tt("Quyền", "Role")}
                    onChange={e => setRole(e.target.value as RoleOption)}
                  >
                    <MenuItem value="owner">{tt("Quản trị viên", "Administrator")}</MenuItem>
                    <MenuItem value="member">{tt("Thành viên", "Member")}</MenuItem>
                    <MenuItem value="supporter">{tt("Cộng tác viên", "Supporter")}</MenuItem>
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
                      label={tt("Chỉ soát vé", "Check-in only")}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={allowSellTicket}
                          onChange={e => setAllowSellTicket(e.target.checked)}
                        />
                      }
                      label={tt("Chỉ bán vé", "Sell tickets only")}
                    />
                  </Stack>
                )}
                <Stack spacing={1}>
                  <Typography variant='caption'><b>{tt("Quản trị viên:", "Administrator:")}</b> {tt("cho phép toàn bộ thao tác + chỉnh sửa sự kiện, giá vé, phân quyền", "allows all operations + edit events, ticket prices, permissions")}</Typography>
                  <Typography variant='caption'><b>{tt("Thành viên:", "Member:")}</b> {tt("cho phép toàn bộ thao tác", "allows all operations")}</Typography>
                  <Typography variant='caption'><b>{tt("Cộng tác viên:", "Supporter:")}</b> {tt("cho phép xem và thao tác hạn chế.", "allows limited viewing and operations.")}</Typography>
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
                {tt("Hủy", "Cancel")}
              </Button>
              <Button
                variant="contained"
                size="small"
                endIcon={<ArrowRight />}
                onClick={handleAddMember}
              >
                {tt("Lưu", "Save")}
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
