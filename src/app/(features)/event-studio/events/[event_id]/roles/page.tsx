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
import { debounce } from 'lodash';
import {
  CardContent,
  CardHeader,
  Container,
  Divider,
  FormControlLabel,
  InputLabel,
  Modal,
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
  alias?: string | null; // Optional field
  createdAt?: string | null; // Date fields are strings in TypeScript, and this is optional
  user?: User; // Optional field
}

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
      notificationCtx.error('Vui lòng nhập email');
      return;
    }

    try {
      setIsLoading(true);
      const response: AxiosResponse<Role[]> = await baseHttpServiceInstance.post(
        `/event-studio/events/${params.event_id}/roles`,
        { email: email.trim(), alias }
      );
      fetchTransactions();
      setAddMemberModalOpen(false);
      setEmail('');
      setAlias('');
      notificationCtx.success('Thêm người dùng thành công.');
    } catch (error) {
      notificationCtx.error('Lỗi:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
              width: { sm: '500px', xs: '90%' },
              bgcolor: 'background.paper',
              boxShadow: 24,
            }}
          >
            <CardHeader title="Thêm thành viên" />
            <Divider />
            <CardContent>
              <Stack spacing={3} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <InputLabel htmlFor="email">Email:</InputLabel>
                  <OutlinedInput
                    required
                    id="email"
                    sx={{ maxWidth: 300 }}
                    type="email"
                    size="small"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Stack>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <InputLabel htmlFor="alias">Tên gợi nhớ:</InputLabel>
                  <OutlinedInput
                    id="alias"
                    sx={{ maxWidth: 200 }}
                    type="text"
                    size="small"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                  />
                </Stack>
              </Stack>
            </CardContent>
            <Divider />
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end', p: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setAddMemberModalOpen(false)}
                size="small"
              >
                Hủy
              </Button>
              <Button
                variant="contained"
                onClick={handleAddMember}
                size="small"
                endIcon={<ArrowRight />}
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
