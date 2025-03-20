'use client';

import * as React from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Button, CardHeader } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { AxiosResponse } from 'axios';

import NotificationContext from '@/contexts/notification-context';

import CreateRatingCriteriaModal from './create-rating-criteria-page';

export type RatingCriteriaType = 'star' | 'numeric' | 'favorite';

export interface RatingCriteria {
  id: number;
  eventId: number;
  name: string;
  type: RatingCriteriaType;
  scaleMin: number;
  scaleMax: number;
  scaleStep: number;
  ratio: number;
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
const getRowStatusDetails = (
  status: string
): { label: string; color: 'success' | 'error' | 'warning' | 'info' | 'secondary' | 'default' | 'primary' } => {
  switch (status) {
    case 'normal':
      return { label: 'Bình thường', color: 'success' };
    case 'wait_for_response':
      return { label: 'Đang chờ', color: 'warning' };
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

const CriteriaTypeMapping = {
  star: '⭐ Star Rating',
  numeric: '🔢 Numeric',
  favorite: '❤️ Favorite',
};

export function RatingCriteriaPage({ eventId = 0 }: CustomersTableProps): React.JSX.Element {
  const [ratingCriterias, setRatingCriterias] = React.useState<RatingCriteria[]>([]);
  const [pageRatingCriterias, setPageRatingCriterias] = React.useState(0);
  const [rowsPerPageRatingCriterias, setRowsPerPageRatingCriterias] = React.useState(25);
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const notificationCtx = React.useContext(NotificationContext);
  const [openCreateModal, setOpenCreateModal] = React.useState<boolean>(false);

  const paginatedRatingCriterias = applyPaginationRatingCriterias(
    ratingCriterias,
    pageRatingCriterias,
    rowsPerPageRatingCriterias
  );

  const getRatingCriterias = async (eventId: number): Promise<RatingCriteria[]> => {
    try {
      const response: AxiosResponse<RatingCriteria[]> = await baseHttpServiceInstance.get(
        `/event-studio/events/${eventId}/mini-app-rating-online/rating-criterias`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  React.useEffect(() => {
    const fetchCriterias = async () => {
      try {
        setIsLoading(true);
        const data = await getRatingCriterias(eventId);
        setRatingCriterias(data);
      } catch (error) {
        notificationCtx.error('Không thể tải tiêu chí đánh giá.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCriterias();
  }, [eventId]);

  const totalRatio = ratingCriterias.reduce((sum, c) => sum + c.ratio, 0);
  const handlePageChangeRatingCriterias = (event: unknown, newPage: number) => {
    setPageRatingCriterias(newPage);
  };

  const handleRowsPerPageChangeRatingCriterias = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPageRatingCriterias(newRowsPerPage);
    setPageRatingCriterias(0); // Reset to the first page whenever rows per page change
  };

  const handleAddCriteria = (newCriteria: RatingCriteria) => {
    setRatingCriterias([...ratingCriterias, newCriteria]);
  };
  // Mock Data
  React.useEffect(() => {
    setRatingCriterias([
      {
        id: 1,
        eventId: 1,
        name: 'Creativity',
        type: 'star',
        scaleMin: 1,
        scaleMax: 5,
        scaleStep: 1,
        ratio: 30,
      },
      {
        id: 2,
        eventId: 1,
        name: 'Performance',
        type: 'numeric',
        scaleMin: 1,
        scaleMax: 5,
        scaleStep: 1,
        ratio: 30,
      },
      {
        id: 3,
        eventId: 1,
        name: 'Technical Skill',
        type: 'numeric',
        scaleMin: 1,
        scaleMax: 5,
        scaleStep: 1,
        ratio: 40,
      },
    ]);
  }, []);

  function applyPaginationRatingCriterias(rows: RatingCriteria[], page: number, rowsPerPage: number): RatingCriteria[] {
    return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Danh sách tiêu chí bình chọn"
          action={
            <Button fullWidth variant="contained" size="small" startIcon={<Plus />} onClick={() => setOpen(true)}>
              Thêm
            </Button>
          }
        />
        <Divider />
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Tên tiêu chí (Criteria Name)</TableCell>
                <TableCell>Dạng đánh giá (Type)</TableCell>
                <TableCell>Thang điểm (Scale)</TableCell>
                <TableCell>Tỷ lệ (%) (Ratio)</TableCell>
                <TableCell>Hành động (Actions)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRatingCriterias.map((criteria) => (
                <TableRow key={criteria.id}>
                  <TableCell>{criteria.name}</TableCell>
                  <TableCell>{CriteriaTypeMapping[criteria.type]}</TableCell>
                  <TableCell>{`Min: ${criteria.scaleMin}, Max: ${criteria.scaleMax}, Step: ${criteria.scaleStep}`}</TableCell>
                  <TableCell>{criteria.ratio}%</TableCell>
                  <TableCell>
                    <Button size="small" variant="contained" color="warning">
                      Sửa
                    </Button>
                    <Button size="small" variant="contained" color="error">
                      Xóa
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {/* Show warning if total ratio is not 100% */}
              {totalRatio !== 100 && (
                <TableRow>
                  <TableCell colSpan={5} style={{ color: 'red', textAlign: 'center' }}>
                    ⚠️ Tổng tỉ lệ phải bằng 100%, nhưng hiện tại chỉ đạt <b>{totalRatio}%</b>!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
        <Divider />
        <TablePagination
          component="div"
          count={ratingCriterias.length}
          page={pageRatingCriterias}
          rowsPerPage={rowsPerPageRatingCriterias}
          onPageChange={handlePageChangeRatingCriterias}
          onRowsPerPageChange={handleRowsPerPageChangeRatingCriterias}
        />
      </Card>
      <CreateRatingCriteriaModal
        eventId={eventId}
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleAddCriteria}
      />
    </>
  );
}
