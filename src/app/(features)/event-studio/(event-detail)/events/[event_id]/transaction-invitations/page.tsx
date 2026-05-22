'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { AxiosResponse } from 'axios';
import { LocalizedLink } from '@/components/homepage/localized-link';
import { useTranslation } from '@/contexts/locale-context';

import * as React from 'react';
import NotificationContext from '@/contexts/notification-context';
import {
	Box,
	Card,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControl,
	Grid,
	IconButton,
	InputAdornment,
	InputLabel,
	MenuItem,
	OutlinedInput,
	Select,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TablePagination,
	TableRow,
	Tooltip,
	useTheme
} from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { useRouter } from 'next/navigation';
import {
	ArrowCounterClockwise,
	Copy,
	Envelope,
	Eye,
	MagnifyingGlass as MagnifyingGlassIcon,
	PaperPlaneTilt,
	Plus as PlusIcon,
	Trash
} from '@phosphor-icons/react';
import dayjs from 'dayjs';

interface TicketInvitation {
	id: number;
	uuid: string;
	eventId: number;
	recipientEmail: string;
	recipientName: string | null;
	recipientTitle: string | null;
	recipientPhone: string | null;
	message: string | null;
	expiresAt: string | null;
	status: 'PENDING' | 'USED' | 'EXPIRED' | 'CANCELLED';
	preSelectedTickets: {
		tickets?: Array<{
			ticketCategoryId: number;
			quantity: number;
			showId: number;
			seatId?: string;
			seatRow?: string;
			seatNumber?: string;
			seatLabel?: string;
			audienceId?: number;
			audienceName?: string;
		}>;
		concessions?: Array<any>;
	} | null;
	allowTicketEdit: boolean;
	preFilledInfo: {
		customer?: {
			title?: string;
			name?: string;
			email?: string;
			phoneNumber?: string;
			address?: string;
		};
	} | null;
	allowInfoEdit: boolean;
	voucherCode: string | null;
	createdAt: string;
	transactionId?: number | null;
}

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
	const { tt } = useTranslation();
	React.useEffect(() => {
		document.title = tt("Danh sách lời mời | ETIK - Vé điện tử & Quản lý sự kiện", "Invitation List | ETIK - E-tickets & Event Management");
	}, [tt]);

	const theme = useTheme();
	const router = useRouter();

	const [isInitialized, setIsInitialized] = React.useState(false);
	const [invitations, setInvitations] = React.useState<TicketInvitation[]>([]);
	const [eventData, setEventData] = React.useState<any>(null);

	const [querySearch, setQuerySearch] = React.useState<string>('');
	const [statusFilter, setStatusFilter] = React.useState<string>('all');

	const [page, setPage] = React.useState(0);
	const [rowsPerPage, setRowsPerPage] = React.useState(25);

	const notificationCtx = React.useContext(NotificationContext);
	const [isLoading, setIsLoading] = React.useState<boolean>(false);

	// Detail Modal State
	const [selectedInvitation, setSelectedInvitation] = React.useState<TicketInvitation | null>(null);
	const [isDetailOpen, setIsDetailOpen] = React.useState<boolean>(false);

	// Fetch Event details (to map IDs to Category names and get slug)
	const fetchEventInfo = React.useCallback(async () => {
		try {
			const response: AxiosResponse<any> = await baseHttpServiceInstance.get(
				`/event-studio/events/${params.event_id}/transactions/get-info-to-create-transaction`
			);
			setEventData(response.data);
		} catch (error) {
			console.error('Failed to load event details:', error);
		}
	}, [params.event_id]);

	// Fetch all invitations
	const fetchInvitations = React.useCallback(async (showBackdrop = true) => {
		try {
			if (showBackdrop) setIsLoading(true);
			const response: AxiosResponse<TicketInvitation[]> = await baseHttpServiceInstance.get(
				`/event-studio/events/${params.event_id}/transaction-invitations`
			);
			setInvitations(response.data);
		} catch (error) {
			notificationCtx.error(tt('Lỗi khi tải danh sách lời mời:', 'Error loading invitation list:'), error);
		} finally {
			if (showBackdrop) setIsLoading(false);
		}
	}, [params.event_id, notificationCtx, tt]);

	React.useEffect(() => {
		Promise.all([fetchEventInfo(), fetchInvitations()]).then(() => {
			setIsInitialized(true);
		});
	}, [fetchEventInfo, fetchInvitations]);

	const categoryMap = React.useMemo(() => {
		if (!eventData?.shows) return new Map<number, string>();
		const map = new Map<number, string>();
		eventData.shows.forEach((show: any) => {
			show.ticketCategories.forEach((tc: any) => {
				map.set(tc.id, tc.name);
			});
		});
		return map;
	}, [eventData]);

	const showMap = React.useMemo(() => {
		if (!eventData?.shows) return new Map<number, string>();
		const map = new Map<number, string>();
		eventData.shows.forEach((show: any) => {
			map.set(show.id, show.name);
		});
		return map;
	}, [eventData]);

	// Actions
	const handleResendEmail = async (id: number, e?: React.MouseEvent) => {
		if (e) e.stopPropagation();
		const confirmed = window.confirm(tt('Bạn có chắc chắn muốn gửi lại email lời mời này?', 'Are you sure you want to resend this invitation email?'));
		if (!confirmed) return;

		try {
			setIsLoading(true);
			await baseHttpServiceInstance.post(`/event-studio/events/${params.event_id}/transaction-invitations/${id}/resend`);
			notificationCtx.success(tt('Đã gửi lại email lời mời vào hàng chờ', 'Resent invitation email successfully'));
			fetchInvitations(false);
		} catch (error) {
			notificationCtx.error(tt('Gửi lại email thất bại:', 'Failed to resend email:'), error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDisableInvitation = async (id: number, e?: React.MouseEvent) => {
		if (e) e.stopPropagation();
		const confirmed = window.confirm(tt('Bạn có chắc chắn muốn hủy/tắt lời mời này? Khách hàng sẽ không thể truy cập liên kết mua vé được nữa.', 'Are you sure you want to cancel/disable this invitation? The guest will no longer be able to use the ticket link.'));
		if (!confirmed) return;

		try {
			setIsLoading(true);
			await baseHttpServiceInstance.patch(`/event-studio/events/${params.event_id}/transaction-invitations/${id}/disable`);
			notificationCtx.success(tt('Đã hủy lời mời thành công', 'Invitation cancelled successfully'));
			fetchInvitations(false);
			if (selectedInvitation?.id === id) {
				setIsDetailOpen(false);
			}
		} catch (error) {
			notificationCtx.error(tt('Hủy lời mời thất bại:', 'Failed to cancel invitation:'), error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCopyLink = (eventSlug: string, uuid: string) => {
		if (typeof window === 'undefined' || !eventSlug) return;
		const link = `${window.location.origin}/events/${eventSlug}?invitationUuid=${uuid}`;
		navigator.clipboard.writeText(link).then(() => {
			notificationCtx.success(tt('Đã sao chép liên kết vào bộ nhớ tạm!', 'Copied link to clipboard!'));
		}).catch((err) => {
			notificationCtx.error(tt('Lỗi sao chép:', 'Copy failed:'), err);
		});
	};

	// Filtering logic
	const filteredInvitations = React.useMemo(() => {
		let result = [...invitations];

		// Status filter
		if (statusFilter !== 'all') {
			result = result.filter(inv => inv.status === statusFilter);
		}

		// Search filter
		if (querySearch.trim()) {
			const q = querySearch.toLowerCase().trim();
			result = result.filter(inv =>
				(inv.recipientName && inv.recipientName.toLowerCase().includes(q)) ||
				inv.recipientEmail.toLowerCase().includes(q) ||
				(inv.recipientPhone && inv.recipientPhone.includes(q)) ||
				inv.id.toString().includes(q)
			);
		}

		return result;
	}, [invitations, statusFilter, querySearch]);

	// Pagination
	const paginatedInvitations = React.useMemo(() => {
		const start = page * rowsPerPage;
		return filteredInvitations.slice(start, start + rowsPerPage);
	}, [filteredInvitations, page, rowsPerPage]);

	const handleChangePage = (event: unknown, newPage: number) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	// Helpers
	const getStatusChip = (status: TicketInvitation['status']) => {
		switch (status) {
			case 'USED':
				return <Chip label={tt('Đã dùng', 'Used')} color="success" size="small" variant="outlined" />;
			case 'PENDING':
				return <Chip label={tt('Chờ sử dụng', 'Pending')} color="primary" size="small" variant="outlined" />;
			case 'CANCELLED':
				return <Chip label={tt('Đã hủy', 'Cancelled')} color="default" size="small" variant="outlined" />;
			case 'EXPIRED':
				return <Chip label={tt('Hết hạn', 'Expired')} color="error" size="small" variant="outlined" />;
			default:
				return <Chip label={status} color="default" size="small" variant="outlined" />;
		}
	};

	const renderTicketSummary = (inv: TicketInvitation) => {
		const tickets = inv.preSelectedTickets?.tickets;
		if (!tickets || tickets.length === 0) {
			return <Typography variant="body2" color="text.secondary">{tt('Tự chọn vé', 'Customer selects')}</Typography>;
		}

		return (
			<Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
				{tickets.map((t, idx) => {
					const catName = categoryMap.get(t.ticketCategoryId) || `Loại vé #${t.ticketCategoryId}`;
					let details = '';
					const seatLabelVal = t.seatLabel || ((t.seatRow && t.seatNumber) ? `${t.seatRow}-${t.seatNumber}` : '');
					if (seatLabelVal) details += ` - Ghế ${seatLabelVal}`;
					if (t.audienceName) details += ` (${t.audienceName})`;
					return (
						<Chip
							key={idx}
							label={`${catName}${details} x${t.quantity}`}
							size="small"
							variant="filled"
							sx={{ bgcolor: 'action.selected', height: '20px', fontSize: '0.75rem' }}
						/>
					);
				})}
			</Stack>
		);
	};

	const openDetails = (inv: TicketInvitation) => {
		setSelectedInvitation(inv);
		setIsDetailOpen(true);
	};

	return (
		<Stack spacing={3}>
			<Backdrop
				open={isLoading}
				sx={{
					color: '#fff',
					zIndex: (theme) => theme.zIndex.drawer + 1,
					marginLeft: '0px !important',
				}}
			>
				<CircularProgress color="inherit" />
			</Backdrop>

			<Stack direction="row" spacing={3}>
				<Stack spacing={1} sx={{ flex: '1 1 auto' }}>
					<Typography variant="h4">{tt("Quản lý lời mời mua vé", "Buying Invitations")}</Typography>
				</Stack>
				<div>
					<Button
						startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
						component={LocalizedLink}
						href={`/event-studio/events/${params.event_id}/transaction-invitations/create`}
						variant="contained"
					>
						{tt("Tạo lời mời", "Create Invitation")}
					</Button>
				</div>
			</Stack>

			<Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
				<Button color="inherit" startIcon={<ArrowCounterClockwise fontSize="var(--icon-fontSize-md)" />} onClick={() => fetchInvitations()}>
					{tt("Tải lại", "Reload")}
				</Button>
			</Stack>

			<Card sx={{ p: 2 }}>
				<Grid container spacing={2} sx={{ alignItems: 'center' }}>
					<Grid item xs={12} md={4}>
						<OutlinedInput
							fullWidth
							value={querySearch}
							placeholder={tt("Tìm kiếm người nhận, email, SĐT...", "Search recipient, email, phone...")}
							onChange={(e) => {
								setQuerySearch(e.target.value);
								setPage(0);
							}}
							startAdornment={
								<InputAdornment position="start">
									<MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
								</InputAdornment>
							}
						/>
					</Grid>
					<Grid item xs={12} md={3}>
						<FormControl fullWidth>
							<InputLabel id="status-filter-label">{tt('Trạng thái', 'Status')}</InputLabel>
							<Select
								labelId="status-filter-label"
								value={statusFilter}
								label={tt('Trạng thái', 'Status')}
								onChange={(e) => {
									setStatusFilter(e.target.value);
									setPage(0);
								}}
							>
								<MenuItem value="all">{tt('Tất cả trạng thái', 'All statuses')}</MenuItem>
								<MenuItem value="PENDING">{tt('Chờ sử dụng', 'Pending')}</MenuItem>
								<MenuItem value="USED">{tt('Đã dùng', 'Used')}</MenuItem>
								<MenuItem value="EXPIRED">{tt('Hết hạn', 'Expired')}</MenuItem>
								<MenuItem value="CANCELLED">{tt('Đã hủy', 'Cancelled')}</MenuItem>
							</Select>
						</FormControl>
					</Grid>
				</Grid>
			</Card>

			<Card>
				<Box sx={{ overflowX: 'auto' }}>
					<Table sx={{ minWidth: '950px' }}>
						<TableHead>
							<TableRow>
								<TableCell sx={{ width: '80px' }}>{tt('ID', 'ID')}</TableCell>
								<TableCell sx={{ minWidth: '220px' }}>{tt('Người nhận', 'Recipient')}</TableCell>
								<TableCell sx={{ width: '130px' }}>{tt('Trạng thái', 'Status')}</TableCell>
								<TableCell sx={{ minWidth: '200px' }}>{tt('Vé chọn sẵn', 'Pre-selected Tickets')}</TableCell>
								<TableCell sx={{ width: '140px' }}>{tt('Hạn sử dụng', 'Expires At')}</TableCell>
								<TableCell sx={{ width: '140px' }}>{tt('Ngày tạo', 'Created At')}</TableCell>
								<TableCell sx={{ width: '150px' }} align="right">{tt('Thao tác', 'Actions')}</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{paginatedInvitations.length === 0 ? (
								<TableRow>
									<TableCell colSpan={7} align="center" sx={{ py: 6 }}>
										<Typography variant="body1" color="text.secondary">
											{tt('Không tìm thấy lời mời nào', 'No invitations found')}
										</Typography>
									</TableCell>
								</TableRow>
							) : (
								paginatedInvitations.map((inv) => (
									<TableRow
										hover
										key={inv.id}
										onClick={() => openDetails(inv)}
										sx={{ cursor: 'pointer' }}
									>
										<TableCell>
											<Typography variant="body2" fontWeight="bold">#{inv.id}</Typography>
										</TableCell>
										<TableCell>
											<Stack spacing={0.5}>
												<Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
													{inv.recipientTitle ? `${inv.recipientTitle} ` : ''}
													{inv.recipientName || tt('Khách không tên', 'Unnamed Guest')}
												</Typography>
												<Typography variant="caption" color="text.secondary" display="block">
													{inv.recipientEmail}
												</Typography>
												{inv.recipientPhone && (
													<Typography variant="caption" color="text.secondary" display="block">
														{inv.recipientPhone}
													</Typography>
												)}
											</Stack>
										</TableCell>
										<TableCell>{getStatusChip(inv.status)}</TableCell>
										<TableCell>{renderTicketSummary(inv)}</TableCell>
										<TableCell>
											<Typography variant="body2">
												{inv.expiresAt ? dayjs(inv.expiresAt).format('DD/MM/YYYY HH:mm') : tt('Không giới hạn', 'No expiration')}
											</Typography>
										</TableCell>
										<TableCell>
											<Typography variant="body2" color="text.secondary">
												{dayjs(inv.createdAt).format('DD/MM/YYYY HH:mm')}
											</Typography>
										</TableCell>
										<TableCell align="right" onClick={(e) => e.stopPropagation()}>
											<Stack direction="row" spacing={1} justifyContent="flex-end">
												<Tooltip title={tt('Xem chi tiết', 'View Details')}>
													<IconButton size="small" onClick={() => openDetails(inv)}>
														<Eye size={18} />
													</IconButton>
												</Tooltip>

												<Tooltip title={tt('Sao chép liên kết mua vé', 'Copy ticket purchase link')}>
													<IconButton size="small" color="primary" onClick={() => handleCopyLink(eventData?.slug, inv.uuid)}>
														<Copy size={18} />
													</IconButton>
												</Tooltip>

												{inv.status !== 'CANCELLED' && inv.status !== 'USED' && (
													<>
														<Tooltip title={tt('Gửi lại email', 'Resend Email')}>
															<IconButton size="small" color="info" onClick={(e) => handleResendEmail(inv.id, e)}>
																<PaperPlaneTilt size={18} />
															</IconButton>
														</Tooltip>

														<Tooltip title={tt('Hủy lời mời', 'Cancel Invitation')}>
															<IconButton size="small" color="error" onClick={(e) => handleDisableInvitation(inv.id, e)}>
																<Trash size={18} />
															</IconButton>
														</Tooltip>
													</>
												)}
											</Stack>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</Box>
				<Divider />
				<TablePagination
					component="div"
					count={filteredInvitations.length}
					page={page}
					rowsPerPage={rowsPerPage}
					onPageChange={handleChangePage}
					onRowsPerPageChange={handleChangeRowsPerPage}
					rowsPerPageOptions={[10, 25, 50, 100]}
					showFirstButton
					showLastButton
				/>
			</Card>

			{/* Details Dialog */}
			<Dialog
				open={isDetailOpen}
				onClose={() => setIsDetailOpen(false)}
				maxWidth="md"
				fullWidth
			>
				{selectedInvitation && (
					<>
						<DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<Typography variant="h6" fontWeight="bold">
								{tt(`Chi tiết lời mời mua vé #${selectedInvitation.id}`, `Buying Invitation Details #${selectedInvitation.id}`)}
							</Typography>
							<Box>{getStatusChip(selectedInvitation.status)}</Box>
						</DialogTitle>
						<DialogContent dividers sx={{ p: 3 }}>
							<Grid container spacing={3}>
								{/* Left Side: Recipient and custom message */}
								<Grid item xs={12} md={6}>
									<Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
										{tt('Thông tin người nhận', 'Recipient Information')}
									</Typography>
									<Stack spacing={1.5} sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1.5, mb: 2 }}>
										<div>
											<Typography variant="caption" color="text.secondary" display="block">{tt('Họ và tên', 'Full Name')}</Typography>
											<Typography variant="body1" fontWeight="medium">
												{selectedInvitation.recipientTitle ? `${selectedInvitation.recipientTitle} ` : ''}
												{selectedInvitation.recipientName || tt('Chưa cung cấp', 'Not provided')}
											</Typography>
										</div>
										<div>
											<Typography variant="caption" color="text.secondary" display="block">{tt('Email nhận thư', 'Recipient Email')}</Typography>
											<Typography variant="body1">{selectedInvitation.recipientEmail}</Typography>
										</div>
										<div>
											<Typography variant="caption" color="text.secondary" display="block">{tt('Số điện thoại', 'Phone Number')}</Typography>
											<Typography variant="body1">{selectedInvitation.recipientPhone || tt('Chưa cung cấp', 'Not provided')}</Typography>
										</div>
									</Stack>

									<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
										{tt('Lời nhắn đính kèm', 'Attached Message')}
									</Typography>
									<Box sx={{ border: '1px dashed', borderColor: 'divider', p: 2, borderRadius: 1.5, minHeight: '80px', bgcolor: 'background.paper' }}>
										<Typography dangerouslySetInnerHTML={{ __html: selectedInvitation.message || tt('Không có lời nhắn', 'No attached message') }} variant="body2" sx={{ whiteSpace: 'pre-wrap', fontStyle: 'italic' }} />
									</Box>
								</Grid>

								{/* Right Side: Configuration & Link */}
								<Grid item xs={12} md={6}>
									<Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
										{tt('Cấu hình lời mời', 'Invitation Settings')}
									</Typography>
									<Stack spacing={1.5} sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1.5, mb: 2 }}>
										<div>
											<Typography variant="caption" color="text.secondary" display="block" mb={1}>{tt('Vé được chọn sẵn', 'Pre-selected Tickets')}</Typography>
											{selectedInvitation.preSelectedTickets?.tickets && selectedInvitation.preSelectedTickets.tickets.length > 0 ? (
												<Stack spacing={1}>
													{selectedInvitation.preSelectedTickets.tickets.map((t, idx) => {
														const catName = categoryMap.get(t.ticketCategoryId) || `Loại vé #${t.ticketCategoryId}`;
														const showName = showMap.get(t.showId) || `Suất #${t.showId}`;
														let details = '';
														const seatLabelVal = t.seatLabel || ((t.seatRow && t.seatNumber) ? `${t.seatRow}-${t.seatNumber}` : '');
														if (seatLabelVal) details += ` - Ghế ${seatLabelVal}`;
														if (t.audienceName) details += ` (${t.audienceName})`;
														const holder = (t as any).holder;
														return (
															<Box key={idx} sx={{ bgcolor: 'background.default', p: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
																<Typography variant="body2" fontWeight="medium">
																	{catName} (<em>{showName}</em>){details}: <strong>x{t.quantity}</strong>
																</Typography>
																{holder && (holder.name || holder.email || holder.nationalPhone || holder.phone) ? (
																	<Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
																		👤 {holder.name || '---'}
																		{(holder.email) && ` • ✉️ ${holder.email}`}
																		{(holder.nationalPhone || holder.phone) && ` • 📞 ${holder.nationalPhone || holder.phone}`}
																	</Typography>
																) : (
																	<Typography variant="caption" color="text.secondary" fontStyle="italic" display="block" mt={0.5}>
																		{tt('Chưa điền thông tin cá nhân', 'No personal info filled')}
																	</Typography>
																)}
															</Box>
														);
													})}
												</Stack>
											) : (
												<Typography variant="body2" color="text.secondary" fontStyle="italic">{tt('Khách hàng tự chọn loại vé và số lượng', 'Customer chooses ticket categories & quantity')}</Typography>
											)}
										</div>


										<Box sx={{ bgcolor: selectedInvitation.preFilledInfo?.customer ? 'primary.50' : 'background.default', p: 1.5, borderRadius: 1, border: '1px solid', borderColor: selectedInvitation.preFilledInfo?.customer ? 'primary.light' : 'divider' }}>
											<Typography variant="caption" color={selectedInvitation.preFilledInfo?.customer ? 'primary.main' : 'text.secondary'} fontWeight="bold" display="block" mb={0.5}>
												{tt('Thông tin người mua', 'Buyer Info')}
											</Typography>
											{selectedInvitation.preFilledInfo?.customer ? (
												<Typography variant="body2" display="block">
													👤 <strong>{selectedInvitation.preFilledInfo.customer.name || '---'}</strong>
													{selectedInvitation.preFilledInfo.customer.email && ` • ✉️ ${selectedInvitation.preFilledInfo.customer.email}`}
													{(selectedInvitation.preFilledInfo.customer.phoneNumber || selectedInvitation.preFilledInfo.customer.phone) && ` • 📞 ${selectedInvitation.preFilledInfo.customer.phoneNumber || selectedInvitation.preFilledInfo.customer.phone}`}
												</Typography>
											) : (
												<Typography variant="body2" color="text.secondary" fontStyle="italic">
													{tt('Chưa điền thông tin', 'Not filled')}
												</Typography>
											)}
										</Box>

										<div>
											<Typography variant="caption" color="text.secondary" display="block">{tt('Cho phép chọn/sửa vé', 'Allow ticket editing')}</Typography>
											<Typography variant="body2" fontWeight="medium">
												{selectedInvitation.allowTicketEdit ? tt('Có', 'Yes') : tt('Không (Khóa theo vé chọn sẵn)', 'No (Locked to pre-selected tickets)')}
											</Typography>
										</div>
										<div>
											<Typography variant="caption" color="text.secondary" display="block">{tt('Cho phép sửa thông tin cá nhân', 'Allow guest information edit')}</Typography>
											<Typography variant="body2" fontWeight="medium">
												{selectedInvitation.allowInfoEdit ? tt('Có', 'Yes') : tt('Không (Khóa theo thông tin điền sẵn)', 'No (Locked to prefilled details)')}
											</Typography>
										</div>

										<div>
											<Typography variant="caption" color="text.secondary" display="block">{tt('Mã giảm giá đi kèm', 'Promo Code')}</Typography>
											<Typography variant="body2" fontWeight="medium">
												{selectedInvitation.voucherCode ? (
													<Chip label={selectedInvitation.voucherCode} size="small" color="secondary" />
												) : tt('Không có', 'None')}
											</Typography>
										</div>

										<div>
											<Typography variant="caption" color="text.secondary" display="block">{tt('Hạn sử dụng liên kết', 'Link Expiry Date')}</Typography>
											<Typography variant="body2" fontWeight="medium">
												{selectedInvitation.expiresAt ? dayjs(selectedInvitation.expiresAt).format('DD/MM/YYYY HH:mm') : tt('Không giới hạn', 'No expiration')}
											</Typography>
										</div>
									</Stack>

									{/* Public Link Section */}
									<Typography variant="subtitle1" fontWeight="bold" gutterBottom>
										{tt('Liên kết nhận vé', 'Ticket Link')}
									</Typography>
									<Stack direction="row" spacing={1} sx={{ mt: 1 }}>
										<OutlinedInput
											size="small"
											fullWidth
											readOnly
											value={
												typeof window !== 'undefined'
													? `${window.location.origin}/events/${eventData?.slug}?invitationUuid=${selectedInvitation.uuid}`
													: `/events/${eventData?.slug}?invitationUuid=${selectedInvitation.uuid}`
											}
											sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
										/>
										<Button
											variant="outlined"
											startIcon={<Copy size={16} />}
											onClick={() => handleCopyLink(eventData?.slug, selectedInvitation.uuid)}
										>
											{tt('Sao chép', 'Copy')}
										</Button>
									</Stack>
									<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
										{tt('* Gửi liên kết này cho khách mời để họ tiến hành nhận vé.', '* Send this link to the guest so they can receive their tickets.')}
									</Typography>

									{/* Linked Transaction ID */}
									{selectedInvitation.status === 'USED' && selectedInvitation.transactionId && (
										<Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 1.5 }}>
											<Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
												{tt('Lời mời đã được quy đổi thành công!', 'Invitation has been successfully redeemed!')}
											</Typography>
											<Button
												variant="contained"
												size="small"
												color="success"
												sx={{ mt: 1, textTransform: 'none' }}
												component="a"
												href={`/event-studio/events/${params.event_id}/transactions/${selectedInvitation.transactionId}`}
												target="_blank"
												rel="noopener noreferrer"
											>
												{tt('Xem đơn hàng quy đổi ↗', 'View Redeemed Order ↗')}
											</Button>
										</Box>
									)}
								</Grid>
							</Grid>
						</DialogContent>
						<DialogActions sx={{ px: 3, py: 2 }}>
							{selectedInvitation.status !== 'CANCELLED' && selectedInvitation.status !== 'USED' && (
								<>
									<Button
										color="error"
										variant="outlined"
										startIcon={<Trash />}
										onClick={() => handleDisableInvitation(selectedInvitation.id)}
									>
										{tt('Hủy lời mời', 'Cancel Invitation')}
									</Button>
									<Button
										color="info"
										variant="outlined"
										startIcon={<PaperPlaneTilt />}
										onClick={() => handleResendEmail(selectedInvitation.id)}
									>
										{tt('Gửi lại email', 'Resend Email')}
									</Button>
								</>
							)}
							<Button onClick={() => setIsDetailOpen(false)} color="inherit">
								{tt('Đóng', 'Close')}
							</Button>
						</DialogActions>
					</>
				)}
			</Dialog>
		</Stack>
	);
}
