'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import {
  Avatar,
  Box,
  Button,
  Card,
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { AxiosResponse } from 'axios';
import * as React from 'react';

import NotificationContext from '@/contexts/notification-context';

import { Stack } from '@mui/system';
import CreateCandidateModal from './create-candidate-modal';
import DeleteCandidateModal from './delete-candidate-modal';
import EditCandidateModal from './edit-candidate-modal';

export interface Candidate {
  id: number;
  eventId: number;
  name: string;
  avatarUrl: string | null;
  ratingStartTime?: string;
  ratingDuration: number;
}

interface CustomersTableProps {
  eventId: number;
}

export function CandidatesPage({ eventId = 0 }: CustomersTableProps): React.JSX.Element {
  const [candidates, setCandidates] = React.useState<Candidate[]>([]);
  const [pageCandidate, setPageCandidate] = React.useState(0);
  const [rowsPerPageCandidate, setRowsPerPageCandidate] = React.useState(25);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [openCreateModal, setOpenCreateModal] = React.useState<boolean>(false);
  const [openEditModal, setOpenEditModal] = React.useState<boolean>(false);
  const [selectedCandidate, setSelectedCandidate] = React.useState<Candidate | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = React.useState<boolean>(false);

  const notificationCtx = React.useContext(NotificationContext);

  React.useEffect(() => {
    fetchCandidates();
  }, [eventId]);

  async function fetchCandidates() {
    if (!eventId) return;

    try {
      setIsLoading(true);
      const response: AxiosResponse<Candidate[]> = await baseHttpServiceInstance.get(
        `/event-studio/events/${eventId}/mini-app-rating-online/candidates`
      );
      setCandidates(response.data);
    } catch (error: any) {
      notificationCtx.error(error.response?.data?.detail || 'Có lỗi khi tải danh sách ứng viên.');
    } finally {
      setIsLoading(false);
    }
  }

  const handleDeleteCandidate = async () => {
    if (!selectedCandidate) return;

    try {
      await baseHttpServiceInstance.delete(
        `/event-studio/events/${eventId}/mini-app-rating-online/candidates/${selectedCandidate.id}`
      );
      setCandidates((prev) => prev.filter((c) => c.id !== selectedCandidate.id));
      notificationCtx.success('Xóa ứng viên thành công.');
    } catch (error: any) {
      notificationCtx.error(error.response?.data?.detail || 'Xóa ứng viên thất bại.');
    } finally {
      setOpenDeleteModal(false);
      setSelectedCandidate(null);
    }
  };

  const handleEditCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setOpenEditModal(true);
  };

  const handleCandidateUpdated = () => {
    fetchCandidates();
    setOpenEditModal(false);
  };

  const handlePageChangeCandidates = (event: unknown, newPage: number) => {
    setPageCandidate(newPage);
  };

  const handleRowsPerPageChangeCandidates = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPageCandidate(parseInt(event.target.value, 10));
    setPageCandidate(0);
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Danh sách đối tượng bình chọn"
          action={
            <Button
              fullWidth
              variant="contained"
              size="small"
              startIcon={<Plus />}
              onClick={() => setOpenCreateModal(true)}
            >
              Thêm
            </Button>
          }
        />
        <Divider />
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Ảnh</TableCell>
                <TableCell>Tên</TableCell>
                <TableCell>Mở bình chọn lúc</TableCell>
                <TableCell>Thời lượng bình chọn (phút)</TableCell>
                <TableCell>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {candidates
                .slice(
                  pageCandidate * rowsPerPageCandidate,
                  pageCandidate * rowsPerPageCandidate + rowsPerPageCandidate
                )
                .map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell>{candidate.id}</TableCell>
                    <TableCell>
                      <Avatar src={candidate.avatarUrl!} alt={candidate.name} />
                    </TableCell>
                    <TableCell>{candidate.name}</TableCell>
                    <TableCell>{candidate.ratingStartTime}</TableCell>
                    <TableCell>{candidate.ratingDuration}</TableCell>
                    <TableCell>
                      <Stack direction={'row'} spacing={1}>
                        <Button
                          size="small"
                          variant="contained"
                          color="warning"
                          onClick={() => handleEditCandidate(candidate)}
                        >
                          Sửa
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setOpenDeleteModal(true);
                          }}
                        >
                          Xóa
                        </Button>
                      </Stack>
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

      <CreateCandidateModal
        eventId={eventId}
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onCandidateCreated={fetchCandidates}
      />

      {selectedCandidate && (
        <EditCandidateModal
          eventId={eventId}
          candidate={selectedCandidate}
          open={openEditModal}
          onClose={() => setOpenEditModal(false)}
          onCandidateUpdated={handleCandidateUpdated}
        />
      )}

      <DeleteCandidateModal
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={handleDeleteCandidate}
      />
    </>
  );
}
