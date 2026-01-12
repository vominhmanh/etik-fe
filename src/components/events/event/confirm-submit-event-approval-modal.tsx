import * as React from 'react';
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    Container,
    Divider,
    Grid,
    Modal,
    Stack,
    Typography,
} from '@mui/material';
import { AxiosResponse } from 'axios';

import NotificationContext from '@/contexts/notification-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { useTranslation } from '@/contexts/locale-context';

interface ConfirmSubmitEventApprovalModalProps {
    open: boolean;
    onClose: () => void;
    eventId: number;
    onSuccess: () => void;
}

export default function ConfirmSubmitEventApprovalModal({
    open,
    onClose,
    eventId,
    onSuccess,
}: ConfirmSubmitEventApprovalModalProps): React.JSX.Element {
    const { tt } = useTranslation();
    const notificationCtx = React.useContext(NotificationContext);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);

    const handleSendRequestEventApproval = async () => {
        try {
            setIsLoading(true);

            const response: AxiosResponse = await baseHttpServiceInstance.post(
                `/event-studio/events/${eventId}/approval-requests/event-approval-request`
            );

            // Handle success response
            if (response.status === 200) {
                notificationCtx.success(
                    tt(
                        'Yêu cầu nâng cấp thành Sự kiện Được xác thực đã được gửi thành công!',
                        'The request to upgrade to a Verified Event has been sent successfully!'
                    )
                );
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            notificationCtx.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="ticket-category-description-modal-title"
            aria-describedby="ticket-category-description-modal-description"
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
                    <CardHeader title={tt('Quy định chung', 'General Regulations')} />
                    <Divider />
                    <CardContent>
                        <Stack spacing={1} textAlign={'justify'}>
                            <Typography variant="body2">
                                <b>
                                    {tt(
                                        'Để sự kiện được nâng cấp thành Sự kiện Được xác thực, Nhà tổ chức sự kiện vui lòng tuân thủ các quy định dưới đây trước khi gửi yêu cầu:',
                                        'To upgrade your event to a Verified Event, the event organizer must comply with the following regulations before submitting the request:'
                                    )}
                                </b>
                            </Typography>
                            <Typography variant="body2">
                                {tt(
                                    '- Sự kiện có đầy đủ thông tin về tên, mô tả, đơn vị tổ chức, ảnh bìa, ảnh đại diện.',
                                    '- The event must have complete information including name, description, organizer, banner image, and avatar.'
                                )}
                            </Typography>
                            <Typography variant="body2">
                                {tt(
                                    '- Thời gian và địa điểm rõ ràng, chính xác. Hạn chế thay đổi thông tin về thời gian, địa điểm và phải thông báo cho ETIK trước khi thay đổi.',
                                    '- Clear and accurate time and location. Minimize changes to time and location information and must notify ETIK before making changes.'
                                )}
                            </Typography>
                            <Typography variant="body2">
                                {tt(
                                    '- Chính sách Giá vé, chính sách hoàn trả, hủy vé rõ ràng, minh bạch.',
                                    '- Clear and transparent ticket pricing, refund policy, and cancellation policy.'
                                )}
                            </Typography>
                            <Typography variant="body2">
                                {tt(
                                    '- Sự kiện tuân thủ quy định của pháp luật Việt Nam, phù hợp chuẩn mực đạo đức, thuần phong mỹ tục.',
                                    '- The event must comply with Vietnamese law and be consistent with ethical standards and good customs.'
                                )}
                            </Typography>
                            <Typography variant="body2">
                                {tt(
                                    '- Cung cấp cho ETIK các thông tin, giấy tờ để xác minh khi được yêu cầu.',
                                    '- Provide ETIK with information and documents for verification when requested.'
                                )}
                            </Typography>
                            <Typography variant="body2">
                                {tt(
                                    'Nếu cần hỗ trợ, Quý khách vui lòng liên hệ Hotline CSKH 0333.247.242 hoặc email tienphongsmart@gmail.com',
                                    'If you need support, please contact Customer Service Hotline 0333.247.242 or email tienphongsmart@gmail.com'
                                )}
                            </Typography>
                        </Stack>
                        <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSendRequestEventApproval}
                                disabled={isLoading}
                            >
                                {tt('Gửi yêu cầu', 'Submit Request')}
                            </Button>
                        </Grid>
                    </CardContent>
                </Card>
            </Container>
        </Modal>
    );
}
