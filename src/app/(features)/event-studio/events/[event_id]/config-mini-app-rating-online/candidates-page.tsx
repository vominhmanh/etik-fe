'use client';

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import RouterLink from 'next/link';
import NotificationContext from '@/contexts/notification-context';
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import { ArrowSquareUpRight as ArrowSquareUpRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowSquareUpRight';
import { Money as MoneyIcon } from '@phosphor-icons/react/dist/ssr/Money';
import { Bank as BankIcon } from '@phosphor-icons/react/dist/ssr/Bank';
import { Lightning as LightningIcon } from '@phosphor-icons/react/dist/ssr/Lightning';
import IconButton from '@mui/material/IconButton';
import { useSelection } from '@/hooks/use-selection';
import { CardHeader, Chip, Link } from '@mui/material';
import { Plus, X } from '@phosphor-icons/react/dist/ssr';
import { Button } from "@mui/material";
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import CreateCandidateModal from './create-candidate-modal';

export interface Candidate {
  id: number;
  eventId: number;
  name: string;
  avatarUrl?: string;
  ratingStartTime?: string;
  ratingDuration: number;
}

// Function to map payment statuses to corresponding labels and colors
const getRoleDetails = (role: string) => {
  switch (role) {
    case 'owner':
      return { label: 'Chủ sở hữu', color: 'success' };
    case 'member':
      return { label: 'Thành viên', color: 'default' };
    default:
      return { label: 'Unknown', color: 'default' };
  }
};

// Function to map row statuses to corresponding labels and colors
const getRowStatusDetails = (status: string): { label: string, color: "success" | "error" | "warning" | "info" | "secondary" | "default" | "primary" } => {
  switch (status) {
    case 'normal':
      return { label: 'Bình thường', color: 'success' };
    case 'customer_cancelled':
      return { label: 'Huỷ bởi KH', color: 'error' }; // error for danger
    case 'staff_locked':
      return { label: 'Khoá bởi NV', color: 'error' };
    default:
      return { label: 'Unknown', color: 'default' };
  }
};


function noop(): void {
  // do nothing
}


const formatPrice = (price: number) => {
  return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};


function stringToColor(string: string) {
  let hash = 0;
  let i;

  /* eslint-disable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  /* eslint-enable no-bitwise */

  return color;
}

function stringAvatar(name: string) {
  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    children: `${name.split(' ')[0][0]}${name.split(' ').length > 1 ? name.split(' ')[1][0] : ''}`,
  };
}
interface CustomersTableProps {
  eventId: number;
}

export function CandidatesPage({
  eventId = 0,
}: CustomersTableProps): React.JSX.Element {
  const [candidates, setCandidates] = React.useState<Candidate[]>([]);
  const [pageCandidate, setPageCandidate] = React.useState(0);
  const [rowsPerPageCandidate, setRowsPerPageCandidate] = React.useState(25);
  const paginatedCandidates = applyPaginationCandidates(candidates, pageCandidate, rowsPerPageCandidate);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const notificationCtx = React.useContext(NotificationContext);
  const [openCreateModal, setOpenCreateModal] = React.useState<boolean>(false);

  // Mock Data
  React.useEffect(() => {
    setCandidates([
      {
        id: 1,
        eventId: 1,
        name: "John Doe",
        avatarUrl: "https://via.placeholder.com/50",
        ratingStartTime: "2025-03-01 12:00",
        ratingDuration: 60,
      },
      {
        id: 2,
        eventId: 1,
        name: "Jane Smith",
        avatarUrl: "https://via.placeholder.com/50",
        ratingStartTime: "2025-03-01 13:30",
        ratingDuration: 90,
      },
      {
        id: 3,
        eventId: 1,
        name: "Mike Johnson",
        avatarUrl: "https://via.placeholder.com/50",
        ratingStartTime: "2025-03-01 15:00",
        ratingDuration: 120,
      },
    ]);
  }, [])

  const handleCreateCandidate = (newCandidate: Candidate) => {
    setCandidates([...candidates, newCandidate]);
  };

  React.useEffect(() => {
    fetchCandidates();
  }, [eventId]);

  async function fetchCandidates() {
    if (!eventId) return;

    try {
      setIsLoading(true);
      const response: AxiosResponse<Candidate[]> = await baseHttpServiceInstance.get(`/event-studio/events/${eventId}/mini-app-rating-online/candidates`);
      setCandidates(response.data);
    } catch (error: any) {
      notificationCtx.error(error.response?.data?.detail || "Có lỗi khi tải danh sách ứng viên.");
    } finally {
      setIsLoading(false);
    }
  }

  const handlePageChangeCandidates = (event: unknown, newPage: number) => {
    setPageCandidate(newPage);
  };

  const handleRowsPerPageChangeCandidates = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10)
    setRowsPerPageCandidate(newRowsPerPage);
    setPageCandidate(0); // Reset to the first page whenever rows per page change
  };
  async function fetchTransactions() {
    try {
      setIsLoading(true);
      const response: AxiosResponse<Candidate[]> = await baseHttpServiceInstance.get(
        `/event-studio/events/${eventId}/roles`
      );
      setCandidates(response.data);
    } catch (error) {
      notificationCtx.error('Lỗi:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function applyPaginationCandidates(rows: Candidate[], page: number, rowsPerPage: number): Candidate[] {
    return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }
  // Re-fetch after a candidate is added
  const handleCandidateCreated = () => {
    fetchCandidates();
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Danh sách đối tượng bình chọn"
          action={<Button
            fullWidth
            variant="contained"
            size="small"
            startIcon={<Plus />}
            onClick={() => setOpenCreateModal(true)}
          >
            Thêm
          </Button>}
        />
        <Divider />
        <Box sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Ảnh</TableCell>
                <TableCell>Tên</TableCell>
                <TableCell>Mở bình chọn lúc</TableCell>
                <TableCell>Thời lượng bình chọn (phút)</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCandidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell>{candidate.id}</TableCell>
                  <TableCell>
                    <Avatar src={candidate.avatarUrl} alt={candidate.name} />
                  </TableCell>
                  <TableCell>{candidate.name}</TableCell>
                  <TableCell>{candidate.ratingStartTime}</TableCell>
                  <TableCell>{candidate.ratingDuration}</TableCell>
                  <TableCell>
                    <Button size='small' variant="contained" color="warning">Sửa</Button>
                    <Button size='small' variant="contained" color="error">Xóa</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        <Divider />
        <TablePagination
          component="div"
          count={candidates.length}
          page={pageCandidate}
          rowsPerPage={rowsPerPageCandidate}
          onPageChange={handlePageChangeCandidates}
          onRowsPerPageChange={handleRowsPerPageChangeCandidates}
        />
      </Card>
      <CreateCandidateModal eventId={eventId} open={openCreateModal} onClose={() => setOpenCreateModal(false)} onCandidateCreated={handleCandidateCreated} />
    </>

  );
}

