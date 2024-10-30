"use client"
import Grid from '@mui/material/Grid';
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import * as React from 'react';
import NotificationContext from '@/contexts/notification-context';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import axios, { AxiosResponse } from 'axios';
import { Alert, Avatar, Box, CardActions, CardMedia, Container, InputAdornment, Modal, Step, StepLabel, Stepper } from '@mui/material';
import dayjs from 'dayjs';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';
import { Tag as TagIcon } from '@phosphor-icons/react/dist/ssr/Tag';
import { Coins as CoinsIcon } from '@phosphor-icons/react/dist/ssr/Coins';
import { Hash as HashIcon } from '@phosphor-icons/react/dist/ssr/Hash';
import { Clock as ClockIcon } from "@phosphor-icons/react/dist/ssr/Clock";
import { MapPin as MapPinIcon } from "@phosphor-icons/react/dist/ssr/MapPin";
import { CheckCircle as CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { ArrowRight, UserPlus } from '@phosphor-icons/react/dist/ssr';
import Webcam from 'react-webcam';
// import { initialFace, executeFace } from "@vominhmanh/etik_ai_edge_tool";
import { kepple } from '@/styles/theme/colors';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
// import { initialFace, executeFace } from "etik_ai_edge_tool";

export default function Page(): React.JSX.Element {
  const webcamRef = React.useRef(null);
  const step = React.useRef(0)  // step 0: center, step 1: turn left, step 2: turn right, step 3: turn up, step 4: turn down

  const initialFaceRef = React.useRef(null);
  const executeFaceRef = React.useRef(null);

  const [capturedCenterImage, setCapturedCenterImage] = React.useState<Blob>();
  const [capturedLeftImage, setCapturedLeftImage] = React.useState<Blob>();
  const [capturedRightImage, setCapturedRightImage] = React.useState<Blob>();
  const [capturedUpImage, setCapturedUpImage] = React.useState<Blob>();
  const [capturedDownImage, setCapturedDownImage] = React.useState<Blob>();
  const [ekycFacePoseInstruction, setEkycFacePoseInstruction] = React.useState("Đang tải... Vui lòng chờ.")
  const [faceDetectionMessage, setFaceDetectionMessage] = React.useState("");
  const [open, setOpen] = React.useState(true);
  const [startEkyc, setStartEkyc] = React.useState(false);
  const [openWarningModal, setOpenWarningModal] = React.useState(false);
  const [openNotFoundTransactionModal, setOpenNotFoundTransactionModal] = React.useState(false);
  const [customerName, setCustomerName] = React.useState('');
  const [finishLoadingModel, setFinishLoadingModel] = React.useState(false);
  const [ekycRegisterDate, setEkycRegisterDate] = React.useState(null);
  const [openLoadingModal, setOpenLoadingModal] = React.useState(false);
  const [openSuccessModal, setOpenSuccessModal] = React.useState(false);
  const [openErrorModal, setOpenErrorModal] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const notificationCtx = React.useContext(NotificationContext);

  const handleCloseWarningModal = () => setOpenWarningModal(false);

  // Extract query parameters from the URL
  const getQueryParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      event_slug: params.get('event_slug'),
      response_token: params.get('response_token'),
      transaction_id: params.get('transaction_id'),
    };
  };


  // Fetch customer info on component mount
  React.useEffect(() => {
    const { event_slug, response_token, transaction_id } = getQueryParams();
    const fetchData = async () => {
      try {
        const response = await baseHttpServiceInstance.get('/auth/get-info-before-ekyc-register', {
          params: { event_slug, response_token, transaction_id },
        });
        const { customer_name, ekyc_register_date } = response.data;
        setCustomerName(customer_name);
        setEkycRegisterDate(ekyc_register_date);

        // Open modal if registration date exists
        if (ekyc_register_date) {
          setOpenWarningModal(true);
        }
      } catch (error) {
        notificationCtx.error("Failed to fetch eKYC info:", error);
        setOpenNotFoundTransactionModal(true);
      }
    };

    fetchData();
  }, []);

  const handleClose = (event, reason) => {
    if (reason && reason == "backdropClick" && "escapeKeyDown")
      return;
    setOpen(false);
  }

  const handleOpenLoadingModal = () => setOpenLoadingModal(true);
  const handleCloseLoadingModal = (event, reason) => {
    if (reason && reason == "backdropClick" && "escapeKeyDown")
      return;
    setOpenLoadingModal(false);
  }


  const handleOpenSuccessModal = () => setOpenSuccessModal(true);
  const handleCloseSuccessModal = (event, reason) => {
    if (reason && reason == "backdropClick" && "escapeKeyDown")
      return;
    setOpenSuccessModal(false);
  }

  const handleOpenErrorModal = (message) => {
    setErrorMessage(message);
    setOpenErrorModal(true);
  };
  const handleCloseErrorModal = () => setOpenErrorModal(false);

  const handleStartEkycBtn = () => {
    setOpen(false);
    setStartEkyc(true)
  }

  const handleRetryEkycBtn = () => {
    window.location.reload();
  };

  const videoConstraints = {
    width: 720,
    height: 720,
    facingMode: { exact: "user" }
  };

  const steps = [
    '1',
    '2',
    '3',
    '4',
    '5'
  ];


  const executeLoop = React.useCallback(async () => {
    if (webcamRef.current && webcamRef.current.video) {
      // Display instructions based on current step
      switch (step.current) {
        case 0:
          setEkycFacePoseInstruction("Nhìn thẳng");
          break;
        case 1:
          setEkycFacePoseInstruction("Quay trái");
          break;
        case 2:
          setEkycFacePoseInstruction("Quay phải");
          break;
        case 3:
          setEkycFacePoseInstruction("Ngửa lên trên");
          break;
        case 4:
          setEkycFacePoseInstruction("Cúi xuống");
          break;
        case 5:
          setEkycFacePoseInstruction("Thành công. Vui lòng đợi...");
          break;
      }

      const result = await executeFaceRef.current({
        left: 50,
        right: 40,
        up: 20,
        down: 16,
        centerX_left: 40,
        centerX_right: 30,
        centerY_up: 15,
        centerY_down: 12,
      }, {}, false);

      if (result.codes.length === 1 && result.codes[0] === 0) {
        setFaceDetectionMessage('');

        switch (step.current) {
          case 0:
            if (result.pose.yaw === 'center' && result.pose.pitch === 'center') {
              const imageSrc = webcamRef.current.getScreenshot({ width: 448, height: 448 });
              setCapturedCenterImage(await (await fetch(imageSrc)).blob());
              step.current += 1;
              setFaceDetectionMessage('');
            }
            break;
          case 1:
            if (result.pose.yaw === 'left') {
              const imageSrc = webcamRef.current.getScreenshot({ width: 448, height: 448 });
              setCapturedLeftImage(await (await fetch(imageSrc)).blob());
              step.current += 1;
              setFaceDetectionMessage('');
            }
            break;
          case 2:
            if (result.pose.yaw === 'right') {
              const imageSrc = webcamRef.current.getScreenshot({ width: 448, height: 448 });
              setCapturedRightImage(await (await fetch(imageSrc)).blob());
              step.current += 1;
              setFaceDetectionMessage('');
            }
            break;
          case 3:
            if (result.pose.pitch === 'up') {
              const imageSrc = webcamRef.current.getScreenshot({ width: 448, height: 448 });
              setCapturedUpImage(await (await fetch(imageSrc)).blob());
              step.current += 1;
              setFaceDetectionMessage('');
            }
            break;
          case 4:
            if (result.pose.pitch === 'down') {
              const imageSrc = webcamRef.current.getScreenshot({ width: 448, height: 448 });
              setCapturedDownImage(await (await fetch(imageSrc)).blob());
              step.current += 1;
              setFaceDetectionMessage('');
            }
            break;
        }
      } else {
        setFaceDetectionMessage(result.messages[0]);
      }

      if (startEkyc) {
        setTimeout(executeLoop, 500);
      }
    }
  }, [startEkyc]);

  React.useEffect(() => {
    if (startEkyc && finishLoadingModel) {
      setTimeout(executeLoop, 500);
    }
  }, [startEkyc, executeLoop, finishLoadingModel]);


  const onLoadedMetadata = async () => {
    if (webcamRef.current && webcamRef.current.video) {
      if (typeof window !== "undefined") {
        const { initialFace, executeFace } = await import("@vominhmanh/etik_ai_edge_tool");
        initialFaceRef.current = initialFace;
        executeFaceRef.current = executeFace;
      }
      await initialFaceRef.current(
        webcamRef.current.video,
        '/model_tfjs/faceliveness_mobilenetv2_025_mymodel_3_train_01042022_export_01042022/model.json',
      )
      setFinishLoadingModel(true)
    }
  };
  React.useEffect(() => {
    if (
      capturedCenterImage &&
      capturedLeftImage &&
      capturedRightImage &&
      capturedUpImage &&
      capturedDownImage
    ) {
      uploadImages(); // Auto-upload images when all are collected
      setStartEkyc(false);
    }
  }, [capturedCenterImage, capturedLeftImage, capturedRightImage, capturedUpImage, capturedDownImage]);

  // Upload images function
  const uploadImages = async () => {
    handleOpenLoadingModal();

    const { event_slug, response_token, transaction_id } = getQueryParams();
    const formData = new FormData();
    capturedCenterImage && formData.append('center_image', capturedCenterImage, 'center_image.png');
    capturedLeftImage && formData.append('left_image', capturedLeftImage, 'left_image.png');
    capturedRightImage && formData.append('right_image', capturedRightImage, 'right_image.png');
    capturedUpImage && formData.append('up_image', capturedUpImage, 'up_image.png');
    capturedDownImage && formData.append('down_image', capturedDownImage, 'down_image.png');
    formData.append('event_slug', event_slug || '');
    formData.append('response_token', response_token || '');
    formData.append('transaction_id', transaction_id || '');


    try {
      const response = await baseHttpServiceInstance.post('/auth/ekyc-register', formData, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });

      setOpenLoadingModal(false);
      if (response.status === 200) {
        handleOpenSuccessModal();
      } else {
        handleOpenErrorModal('Unexpected response. Please try again.');
      }
    } catch (error) {
      setOpenLoadingModal(false);
      handleOpenErrorModal(error.message || 'Failed to upload images.');
    }
  };
  return (
    <div style={{
      scrollBehavior: 'smooth',
      backgroundColor: '#d1f9db',
      backgroundImage: `linear-gradient(356deg, #d1f9db 0%, #fffed9 100%)`,
    }}>
      <Container maxWidth="xl" sx={{ py: '10px' }} >
        <Stack spacing={3}>
          <div>
            <Typography variant="h4">Đăng ký khuôn mặt</Typography>
          </div>
          <Grid container spacing={3}>
            <Grid item lg={5} md={5} xs={12} spacing={3}>
              <Stack spacing={3}>
                <Card>
                  <CardHeader title="Vui lòng làm theo hướng dẫn" />
                  <Divider />
                  <CardContent>
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      height={'100%'}
                      screenshotFormat="image/jpeg"
                      width={'100%'}
                      mirrored={true}
                      videoConstraints={videoConstraints}
                      onLoadedMetadata={onLoadedMetadata}
                    >
                    </Webcam>
                    <Stack spacing={3}>
                      <Stepper activeStep={step.current}>
                        {steps.map((label) => (
                          <Step key={label}>
                            <StepLabel>{ }</StepLabel>
                          </Step>
                        ))}
                      </Stepper>
                      <Alert variant="outlined" severity="info">
                        {ekycFacePoseInstruction}
                      </Alert>
                      {faceDetectionMessage &&
                        <Alert variant="standard" severity="warning">
                          {faceDetectionMessage}
                        </Alert>}
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>

            <Grid item lg={7} md={7} xs={12} spacing={3}>
              <Stack spacing={3}></Stack>
            </Grid>
          </Grid>
        </Stack>
      </Container>
      <Modal open={openWarningModal} onClose={handleCloseWarningModal} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
        <Container maxWidth="xl">
          <Card sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: { sm: '500px', xs: '90%' }, bgcolor: 'background.paper', boxShadow: 24 }}>
            <CardContent>
              <Stack spacing={3} direction={{ sm: 'row', xs: 'column' }} sx={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '150px', height: '150px', borderRadius: '20px' }}>
                  <DotLottieReact src="/assets/animations/warning.lottie" loop width={'100%'} height={'100%'} style={{ borderRadius: '20px' }} autoplay />
                </div>
                <Stack spacing={3} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Stack spacing={1}>
                    <Typography variant='h6'>Tài khoản của bạn đã đăng ký khuôn mặt trước đây</Typography>
                    <Typography variant='body2'>Thời gian đăng ký: {dayjs(ekycRegisterDate).format('HH:mm:ss DD/MM/YYYY')}. Bạn có chắc chắn muốn đăng ký lại không?</Typography>
                  </Stack>
                  <Stack style={{ marginTop: '20px' }} direction={'row'} spacing={3}>
                    <Button variant='outlined' onClick={() => {window.close();}} size="small">Không</Button>
                    <Button variant='outlined' onClick={handleCloseWarningModal} size="small">Thử lại</Button>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Modal>
      <Modal open={openNotFoundTransactionModal} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
        <Container maxWidth="xl">
          <Card sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: { sm: '500px', xs: '90%' }, bgcolor: 'background.paper', boxShadow: 24 }}>
            <CardContent>
              <Stack spacing={3} direction={{ sm: 'row', xs: 'column' }} sx={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '150px', height: '150px', borderRadius: '20px' }}>
                  <DotLottieReact src="/assets/animations/warning.lottie" loop width={'100%'} height={'100%'} style={{ borderRadius: '20px' }} autoplay />
                </div>
                <Stack spacing={3} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Stack spacing={1}>
                    <Typography variant='h6'>Không tìm thấy giao dịch!</Typography>
                    <Typography variant='body2'>Bạn vui lòng kiểm tra lại hoặc liên hệ với quản trị viên.</Typography>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Modal>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Container maxWidth="xl">
          <Card sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { sm: '500px', xs: '90%' },
            bgcolor: 'background.paper',
            boxShadow: 24,
          }}>
            <CardHeader title="Đăng ký khuôn mặt - Check-in tức thì" />
            <CardContent>
              <Stack spacing={3} direction={{ sm: 'row', xs: 'column' }} >
                <div>
                  <img src="/assets/inline-gate-curved.jpg" style={{ borderRadius: '20px', maxWidth: '200px', width: '100%' }} alt="" />
                </div>
                <Stack spacing={3}>
                  <Stack spacing={1} direction={'row'}>
                    <CheckCircleIcon fontSize="var(--icon-fontSize-lg)" color={kepple[500]} />
                    <Typography variant='body2'>
                      Không cần xuất trình vé.
                    </Typography>
                  </Stack>
                  <Stack spacing={1} direction={'row'}>
                    <CheckCircleIcon fontSize="var(--icon-fontSize-lg)" color={kepple[500]} />
                    <Typography variant='body2'>
                      Nhanh chóng, tiện lợi.
                    </Typography>
                  </Stack>
                  <Stack spacing={1} direction={'row'}>
                    <CheckCircleIcon fontSize="var(--icon-fontSize-lg)" color={kepple[500]} />
                    <Typography variant='body2'>
                      An toàn, bảo mật.
                    </Typography>
                  </Stack>
                  <div style={{ marginTop: '20px' }}>
                    <Button fullWidth variant='contained' onClick={handleStartEkycBtn} size="small" endIcon={<ArrowRight />}>
                      Bắt đầu
                    </Button>
                  </div>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Modal>
      <Modal
        open={openLoadingModal}
        onClose={handleCloseLoadingModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Container maxWidth="xl">
          <Card sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { sm: '500px', xs: '90%' },
            bgcolor: 'background.paper',
            boxShadow: 24,
          }}>
            <CardContent>
              <Stack spacing={3} direction={{ sm: 'row', xs: 'column' }} sx={{ display: 'flex', alignItems: 'center' }} >
                <div style={{ width: '150px', height: '150px', borderRadius: '20px' }}>
                  <DotLottieReact
                    src="/assets/animations/face-scan-animation.lottie"
                    loop
                    width={'100%'}
                    height={'100%'}
                    style={{
                      borderRadius: '20px'
                    }}
                    autoplay
                  />
                </div>

                <Stack spacing={3} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Stack spacing={1}>
                    <Typography variant='h6'>
                      Đang đăng ký khuôn mặt...
                    </Typography>
                    <Typography variant='body2'>
                      Vui lòng đợi trong giây lát.
                    </Typography>
                  </Stack>

                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Modal>
      <Modal
        open={openSuccessModal}
        onClose={handleCloseSuccessModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Container maxWidth="xl">
          <Card sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { sm: '500px', xs: '90%' },
            bgcolor: 'background.paper',
            boxShadow: 24,
          }}>
            <CardContent>
              <Stack spacing={3} direction={{ sm: 'row', xs: 'column' }} sx={{ display: 'flex', alignItems: 'center' }} >
                <div style={{ width: '150px', height: '150px', borderRadius: '20px' }}>
                  <DotLottieReact
                    src="/assets/animations/face-success.lottie"
                    loop
                    width={'100%'}
                    height={'100%'}
                    style={{
                      borderRadius: '20px'
                    }}
                    autoplay
                  />
                </div>

                <Stack spacing={3} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Stack spacing={1}>
                    <Typography variant='h6'>
                      Thành công !
                    </Typography>
                    <Typography variant='body2'>
                      Chúc mừng bạn đã đăng ký check-in bằng khuôn mặt thành công.
                    </Typography>
                    <Typography variant='body2'>
                      Bạn có thể sử dụng khuôn mặt thay thế cho vé điện tử tại sự kiện.
                    </Typography>
                  </Stack>
                  <div style={{ marginTop: '20px' }}>
                    <Button fullWidth variant='contained' onClick={() => {window.close();}} size="small" endIcon={<ArrowRight />}>
                      Đóng trang này
                    </Button>
                  </div>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Modal>
      <Modal
        open={openErrorModal}
        onClose={handleCloseErrorModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Container maxWidth="xl">
          <Card sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { sm: '500px', xs: '90%' },
            bgcolor: 'background.paper',
            boxShadow: 24,
          }}>
            <CardContent>
              <Stack spacing={3} direction={{ sm: 'row', xs: 'column' }} sx={{ display: 'flex', alignItems: 'center' }} >
                <div style={{ width: '150px', height: '150px', borderRadius: '20px' }}>
                  <DotLottieReact
                    src="/assets/animations/failure.lottie"
                    loop
                    width={'100%'}
                    height={'100%'}
                    style={{
                      borderRadius: '20px'
                    }}
                    autoplay
                  />
                </div>

                <Stack spacing={3} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Stack spacing={1}>
                    <Typography variant='h6'>
                      Đăng ký không thành công !
                    </Typography>
                    <Typography variant='body2'>
                      Bạn vui lòng thử đăng ký lại.
                    </Typography>
                    <Typography variant='body2' color={'danger'}>
                      Lỗi: {errorMessage}
                    </Typography>
                  </Stack>
                  <div style={{ marginTop: '20px' }}>
                    <Button fullWidth variant='contained' onClick={handleRetryEkycBtn} size="small" endIcon={<ArrowRight />}>
                      Thử lại
                    </Button>
                  </div>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Modal>

    </div>
  );
}
