'use client';

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
import * as React from 'react';

import NotificationContext from '@/contexts/notification-context';

import { Stack } from '@mui/system';
import CreateVotingQuestionModal from './create-voting-question-modal';
import DeleteVotingQuestionModal from './delete-voting-question-modal';
import EditVotingQuestionModal from './edit-voting-question-modal';

export type VotingQuestionType = 'select_one' | 'select_multiple';

export interface VotingQuestion {
  id: number;
  eventId: number;
  questionText: string;
  questionType: VotingQuestionType;
  votingStartTime: string;
  votingDuration: number;
  votingScore: number;
}

interface CustomersTableProps {
  eventId: number;
}

const questionTypeMapping = {
  select_one: 'Chọn một',
  select_multiple: 'Chọn nhiều',
};

export function VotingQuestionPage({ eventId = 0 }: CustomersTableProps): React.JSX.Element {
  const [VotingQuestions, setVotingQuestions] = React.useState<VotingQuestion[]>([]);
  const [openCreateModal, setOpenCreateModal] = React.useState<boolean>(false);
  const [openEditModal, setOpenEditModal] = React.useState<boolean>(false);
  const [selectedQuestion, setSelectedQuestion] = React.useState<VotingQuestion | null>(null);
  const notificationCtx = React.useContext(NotificationContext);
  const [openDeleteModal, setOpenDeleteModal] = React.useState<boolean>(false);
  const [pageQuestion, setPageQuestion] = React.useState(0);
  const [rowsPerPageQuestion, setRowsPerPageQuestion] = React.useState(25);

  const fetchVotingQuestions = async () => {
    try {
      const response: AxiosResponse<VotingQuestion[]> = await baseHttpServiceInstance.get(
        `/event-studio/events/${eventId}/mini-app-rating-online/voting-questions`
      );
      setVotingQuestions(response.data);
    } catch (error) {
      notificationCtx.error('Không thể tải câu hỏi bình chọn.');
    }
  };

  React.useEffect(() => {
    fetchVotingQuestions();
  }, [eventId]);

  const handleEditQuestion = (question: VotingQuestion) => {
    setSelectedQuestion(question);
    setOpenEditModal(true);
  };

  const onQuestionUpdated = () => {
    fetchVotingQuestions();
    setOpenEditModal(false);
  };

  const handleDeleteVotingQuestion = async () => {
    if (!selectedQuestion) return;

    try {
      await baseHttpServiceInstance.delete(
        `/event-studio/events/${eventId}/mini-app-rating-online/voting-questions/${selectedQuestion.id}`
      );
      setVotingQuestions((prev) => prev.filter((q) => q.id !== selectedQuestion.id));
      notificationCtx.success('Xóa câu hỏi bình chọn thành công.');
    } catch (error: any) {
      notificationCtx.error(error.response?.data?.detail || 'Xóa câu hỏi bình chọn thất bại.');
    } finally {
      setOpenDeleteModal(false);
      setSelectedQuestion(null);
    }
  };

  const handlePageChangeQuestions = (event: unknown, newPage: number) => {
    setPageQuestion(newPage);
  };

  const handleRowsPerPageChangeQuestions = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPageQuestion(parseInt(event.target.value, 10));
    setPageQuestion(0);
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Danh sách câu hỏi bình chọn ứng viên"
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
                <TableCell>Câu hỏi</TableCell>
                <TableCell>Loại câu hỏi</TableCell>
                <TableCell>Thời gian bắt đầu</TableCell>
                <TableCell>Thời lượng (phút)</TableCell>
                <TableCell>Điểm</TableCell>
                <TableCell>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {VotingQuestions.slice(
                pageQuestion * rowsPerPageQuestion,
                pageQuestion * rowsPerPageQuestion + rowsPerPageQuestion
              ).map((question) => (
                <TableRow key={question.id}>
                  <TableCell>{question.questionText}</TableCell>
                  <TableCell>{questionTypeMapping[question.questionType]}</TableCell>
                  <TableCell>{question.votingStartTime}</TableCell>
                  <TableCell>{question.votingDuration}</TableCell>
                  <TableCell>{question.votingScore}</TableCell>
                  <TableCell>
                    <Stack direction={'row'} spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        onClick={() => handleEditQuestion(question)}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={() => {
                          setSelectedQuestion(question);
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
          count={VotingQuestions.length}
          page={pageQuestion}
          rowsPerPage={rowsPerPageQuestion}
          onPageChange={handlePageChangeQuestions}
          onRowsPerPageChange={handleRowsPerPageChangeQuestions}
        />
      </Card>
      <CreateVotingQuestionModal
        eventId={eventId}
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onSave={fetchVotingQuestions}
      />

      {selectedQuestion && (
        <EditVotingQuestionModal
          open={openEditModal}
          onClose={() => setOpenEditModal(false)}
          question={selectedQuestion}
          eventId={eventId}
          onQuestionUpdated={onQuestionUpdated}
        />
      )}

      <DeleteVotingQuestionModal
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={handleDeleteVotingQuestion}
      />
    </>
  );
}
