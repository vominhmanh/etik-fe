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

import CreateVotingQuestionModal from './create-voting-question-modal';

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
  const [pageVotingQuestions, setPageVotingQuestions] = React.useState(0);
  const [rowsPerPageVotingQuestions, setRowsPerPageVotingQuestions] = React.useState(25);
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const notificationCtx = React.useContext(NotificationContext);
  const [openCreateModal, setOpenCreateModal] = React.useState<boolean>(false);

  const paginatedVotingQuestions = applyPaginationVotingQuestions(
    VotingQuestions,
    pageVotingQuestions,
    rowsPerPageVotingQuestions
  );

  const getVotingQuestions = async (eventId: number): Promise<VotingQuestion[]> => {
    try {
      const response: AxiosResponse<VotingQuestion[]> = await baseHttpServiceInstance.get(
        `/event-studio/events/${eventId}/mini-app-rating-online/voting-questions`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  React.useEffect(() => {
    const fetchVotingQuestions = async () => {
      try {
        setIsLoading(true);
        const data = await getVotingQuestions(eventId);
        setVotingQuestions(data);
      } catch (error) {
        notificationCtx.error('Không thể tải câu hỏi bình chọn.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVotingQuestions();
  }, [eventId]);

  const handlePageChangeVotingQuestions = (event: unknown, newPage: number) => {
    setPageVotingQuestions(newPage);
  };

  const handleRowsPerPageChangeVotingQuestions = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPageVotingQuestions(newRowsPerPage);
    setPageVotingQuestions(0); // Reset to the first page whenever rows per page change
  };

  const handleAddVotingQuestion = (newVotingQuestion: VotingQuestion) => {
    setVotingQuestions([...VotingQuestions, newVotingQuestion]);
  };

  function applyPaginationVotingQuestions(rows: VotingQuestion[], page: number, rowsPerPage: number): VotingQuestion[] {
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
                <TableCell>Câu hỏi</TableCell>
                <TableCell>Loại câu hỏi</TableCell>
                <TableCell>Thời gian bắt đầu câu hỏi</TableCell>
                <TableCell>Thời lượng trả lời (phút)</TableCell>
                <TableCell>Hành động (Actions)</TableCell>
                <TableCell>Số điểm</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedVotingQuestions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell>{question.questionText}</TableCell>
                  <TableCell>{questionTypeMapping[question.questionType]}</TableCell>
                  <TableCell>{question.votingStartTime}</TableCell>
                  <TableCell>{question.votingDuration}</TableCell>
                  <TableCell>{question.votingScore}</TableCell>
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
            </TableBody>
          </Table>
        </Box>
        <Divider />
        <TablePagination
          component="div"
          count={VotingQuestions.length}
          page={pageVotingQuestions}
          rowsPerPage={rowsPerPageVotingQuestions}
          onPageChange={handlePageChangeVotingQuestions}
          onRowsPerPageChange={handleRowsPerPageChangeVotingQuestions}
        />
      </Card>
      <CreateVotingQuestionModal
        eventId={eventId}
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleAddVotingQuestion}
      />
    </>
  );
}
