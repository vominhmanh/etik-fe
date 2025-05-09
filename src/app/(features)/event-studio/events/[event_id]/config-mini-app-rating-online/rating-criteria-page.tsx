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
import { Stack } from '@mui/system';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { AxiosResponse } from 'axios';

import NotificationContext from '@/contexts/notification-context';

import CreateRatingCriteriaModal from './create-rating-criteria-page-modal';
import DeleteRatingCriteriaModal from './delete-rating-criteria-modal';
import EditRatingCriteriaModal from './edit-rating-criteria-modal';

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
  const [selectedCriteria, setSelectedCriteria] = React.useState<RatingCriteria | null>(null);
  const [openEditModal, setOpenEditModal] = React.useState(false);
  const [openDeleteModal, setOpenDeleteModal] = React.useState(false);

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

  React.useEffect(() => {
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

  const handleEditCriteria = (criteria: RatingCriteria) => {
    console.log('Edit Criteria', criteria);
    setSelectedCriteria(criteria);
    setOpenEditModal(true);
  };

  const handleDeleteCriteria = (criteria: RatingCriteria) => {
    setSelectedCriteria(criteria);
    setOpenDeleteModal(true);
  };

  const handleDeleteRatingCriteria = async () => {
    if (!selectedCriteria) return;

    try {
      await baseHttpServiceInstance.delete(
        `/event-studio/events/${eventId}/mini-app-rating-online/rating-criterias/${selectedCriteria.id}`
      );
      setRatingCriterias((prev) => prev.filter((c) => c.id !== selectedCriteria.id));
      notificationCtx.success('Xóa tiêu chí đánh giá thành công.');
    } catch (error: any) {
      notificationCtx.error(error.response?.data?.detail || 'Xóa tiêu chí đánh giá thất bại.');
    } finally {
      setOpenDeleteModal(false);
      setSelectedCriteria(null);
    }
  };

  const onCriteriaUpdated = () => {
    fetchCriterias();
    setOpenEditModal(false);
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Danh sách Chấm điểm ứng viên"
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
                <TableCell>Tên tiêu chí</TableCell>
                <TableCell>Dạng đánh giá</TableCell>
                <TableCell>Thang điểm</TableCell>
                <TableCell>Tỷ lệ (%)</TableCell>
                <TableCell>Hành động</TableCell>
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
                    <Stack direction={'row'} spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        onClick={() => handleEditCriteria(criteria)}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={() => handleDeleteCriteria(criteria)}
                      >
                        Xóa
                      </Button>
                    </Stack>
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

      {selectedCriteria && (
        <EditRatingCriteriaModal
          open={openEditModal}
          onClose={() => setOpenEditModal(false)}
          eventId={eventId}
          criteria={selectedCriteria}
          onCriteriaUpdated={onCriteriaUpdated}
        />
      )}
      <DeleteRatingCriteriaModal
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={handleDeleteRatingCriteria}
      />
    </>
  );
}
