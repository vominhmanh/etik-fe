"use client"
import Grid from '@mui/material/Grid';
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import * as React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import axios, { AxiosResponse } from 'axios';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Alert, Avatar, Box, CardActions, CardMedia, Container, InputAdornment, Step, StepLabel, Stepper } from '@mui/material';
import dayjs from 'dayjs';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';
import { Tag as TagIcon } from '@phosphor-icons/react/dist/ssr/Tag';
import { Coins as CoinsIcon } from '@phosphor-icons/react/dist/ssr/Coins';
import { Hash as HashIcon } from '@phosphor-icons/react/dist/ssr/Hash';
import { Clock as ClockIcon } from "@phosphor-icons/react/dist/ssr/Clock";
import { MapPin as MapPinIcon } from "@phosphor-icons/react/dist/ssr/MapPin";
import { HouseLine as HouseLineIcon } from "@phosphor-icons/react/dist/ssr/HouseLine";
import { UserPlus } from '@phosphor-icons/react/dist/ssr';
import Webcam from 'react-webcam';
import { initialFace, executeFace } from "@vominhmanh/etik_ai_edge_tool";
import { v4 as uuidv4 } from 'uuid';

interface Transaction {
  name: string;
  id: number;
}

interface MatchedFace {
  userId: number;
  imageUrl: string;
  transactions: Transaction[];
  similarity: number;
}

interface UploadImageResponse {
  fileUrl: string;
  matchedFaces: MatchedFace[];
  requestId: string;
  errorMessage: string;
}
export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  const webcamRef = React.useRef(null);
  const step = React.useRef(0);
  const [ekycFacePoseInstruction, setEkycFacePoseInstruction] = React.useState("");
  const [faceDetectionMessage, setFaceDetectionMessage] = React.useState("");
  const canvasRef = React.useRef(null);
  const [croppedFacesList, setCroppedFacesList] = React.useState<UploadImageResponse[]>([]);
  const previousFaceRef = React.useRef<BoundingBox | null>(null);
  const [countFace, setCountFace] = React.useState<number>(0);
  const countContiniousFaceFrame = React.useRef<number>(0);
  const allowCapture = React.useRef<boolean>(true);

  type BoundingBox = {
    x1: number;
    y1: number;
    width: number;
    height: number;
  };

  const videoConstraints = {
    width: 720,
    height: 720,
    facingMode: { exact: "user" }
  };

  const calculateIoU = (boxA: BoundingBox, boxB: BoundingBox): number => {
    const xA = Math.max(boxA.x1, boxB.x1);
    const yA = Math.max(boxA.y1, boxB.y1);
    const xB = Math.min(boxA.x1 + boxA.width, boxB.x1 + boxB.width);
    const yB = Math.min(boxA.y1 + boxA.height, boxB.y1 + boxB.height);

    const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
    const boxAArea = boxA.width * boxA.height;
    const boxBArea = boxB.width * boxB.height;

    return interArea / (boxAArea + boxBArea - interArea);
  };

  const cropFaceImage = (boundingBox: BoundingBox) => {
    const video = webcamRef.current?.video;
    if (video) {
      const canvas = document.createElement('canvas');
      canvas.width = boundingBox.width;
      canvas.height = boundingBox.height;
      const context = canvas.getContext('2d');

      if (context) {
        context.drawImage(
          video,
          boundingBox.x1,
          boundingBox.y1,
          boundingBox.width,
          boundingBox.height,
          0,
          0,
          boundingBox.width,
          boundingBox.height
        );

        canvas.toBlob(async (blob) => {
          if (blob) {
            const imageDataUrl = URL.createObjectURL(blob);
            const requestId = uuidv4();

            // Add the new cropped face with UUID to the list
            setCroppedFacesList((prevList: React.SetStateAction<UploadImageResponse[]>) => {
              const updatedList = [{ requestId: requestId, fileUrl: imageDataUrl, matchedFaces: [], errorMessage: '' }, ...prevList];
              return updatedList.slice(0, 10); // Ensure max length of 10
            });

            // Upload the cropped face image blob to the backend with the UUID
            await uploadImages(blob, requestId);
          }
        }, 'image/jpeg');
      }
    }
  };
  const uploadImages = async (imageBlob: Blob, requestId: string) => {
    const formData = new FormData();
    formData.append('face_image', imageBlob, 'face_image.jpg');
    formData.append('request_id', requestId);

    try {
      const response: AxiosResponse<UploadImageResponse> = await baseHttpServiceInstance.post(
        `/event-studio/events/${params.event_id}/check-in/face-search`,
        formData,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const matchedFacesData = response.data.matchedFaces;

      

      if (matchedFacesData.length === 0) {
        setCroppedFacesList((prevList) =>
          prevList.map((face) =>
            face.requestId === requestId ? { ...face, errorMessage: `Không tìm thấy người dùng này.` } : face
          )
        );
      } else {
        setCroppedFacesList((prevList) =>
        prevList.map((face) =>
          face.requestId === requestId ? { ...face, matchedFaces: matchedFacesData } : face
        )
      );
      }

    } catch (error) {
      setCroppedFacesList((prevList) =>
        prevList.map((face) =>
          face.requestId === requestId ? { ...face, errorMessage: `Lỗi: ${error}` } : face
        )
      );
    }
  };

  const onLoadedMetadata = async () => {
    const executeLoop = async () => {
      if (webcamRef.current && webcamRef.current.video) {
        const result = await executeFace(
          { left: 50, right: 40, up: 20, down: 16, centerX_left: 40, centerX_right: 30, centerY_up: 15, centerY_down: 12 },
          { min: 0, max: 100 },
          false
        );
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        context.clearRect(0, 0, webcamRef.current.video.videoWidth, webcamRef.current.video.videoHeight);

        if (result.codes.includes(0) && context && webcamRef.current.video && result.face) {
          const x1 = Math.floor(result.face.x1 / webcamRef.current.video.width * webcamRef.current.video.videoWidth);
          const y1 = Math.floor(result.face.y1 / webcamRef.current.video.height * webcamRef.current.video.videoHeight);
          const w = Math.floor(result.face.width / webcamRef.current.video.width * webcamRef.current.video.videoWidth);
          const h = Math.floor(result.face.height / webcamRef.current.video.height * webcamRef.current.video.videoHeight);

          context.strokeStyle = 'red';
          context.lineWidth = 2;
          context.strokeRect(x1, y1, w, h);
          setFaceDetectionMessage(`(${x1}, ${y1}), w ${w}, h ${h}`);

          const currentFaceBox: BoundingBox = { x1, y1, width: w, height: h };

          if (previousFaceRef.current) {
            const iou = calculateIoU(previousFaceRef.current, currentFaceBox);
            if (iou < 0.5) {
              setCountFace((prevCount) => prevCount + 1);
              allowCapture.current = true;
            } else if (allowCapture.current) {
              countContiniousFaceFrame.current++;
              if (countContiniousFaceFrame.current > 7) {
                cropFaceImage(currentFaceBox);
                countContiniousFaceFrame.current = 0;
                allowCapture.current = false;
              }
            }
          } else {
            setCountFace((prevCount) => prevCount + 1);
            allowCapture.current = true;
          }
          previousFaceRef.current = currentFaceBox;
        } else {
          setFaceDetectionMessage(result.messages.join(", "));
          if (result.codes.includes(11)) {
            previousFaceRef.current = null;
          }
        }
        setTimeout(executeLoop, 50);
      }
    };

    if (webcamRef.current && webcamRef.current.video) {
      await initialFace(
        webcamRef.current.video,
        '/model_tfjs/faceliveness_mobilenetv2_025_mymodel_3_train_01042022_export_01042022/model.json'
      );
      setTimeout(executeLoop, 50);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: '10px' }}>
      <Stack spacing={3}>
        <div>
          <Typography variant="h4">Check-in bằng khuôn mặt</Typography>
        </div>
        <Grid container spacing={3}>
          <Grid item lg={5} md={5} xs={12}>
            <Stack spacing={3}>
              <Card>
                <CardHeader title="Vui lòng đưa khuôn mặt lại gần camera" />
                <Divider />
                <CardContent>
                  <Stack spacing={3}>
                    <Box position="relative" width="100%" height="auto">
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        height="100%"
                        width="100%"
                        screenshotFormat="image/jpeg"
                        mirrored={true}
                        videoConstraints={videoConstraints}
                        onLoadedMetadata={onLoadedMetadata}
                        style={{ position: 'relative', zIndex: 1 }}
                      />
                      <canvas
                        ref={canvasRef}
                        width={720}
                        height={720}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          transform: 'scaleX(-1)',
                          zIndex: 2,
                          pointerEvents: 'none',
                        }}
                      />
                    </Box>
                    {faceDetectionMessage && (
                      <Alert variant="standard" severity="warning">
                        {faceDetectionMessage}
                      </Alert>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
          <Grid item lg={7} md={7} xs={12}>
            <div style={{ height: '800px', overflowY: 'scroll' }}>
              <Stack spacing={3}>
                {croppedFacesList.map((face) => (
                  <Card key={face.requestId} style={{ marginBottom: '20px' }}>
                    <Stack spacing={3} direction='row'>
                      <Box>
                        <img style={{ borderRadius: '20px', width: '100px', marginRight: '10px' }} src={face.fileUrl} alt={`Cropped Face ${face.requestId}`} />
                      </Box>
                      {face.errorMessage && <Typography variant="body2">{face.errorMessage}</Typography>}
                      <Stack spacing={2}>
                        {face.matchedFaces.map((matchedFace) => (
                          <>
                            {matchedFace.transactions.length > 0 &&
                              <>
                                <Typography key={matchedFace.similarity} variant="body2">Tìm thấy vé sau:</Typography>
                                {matchedFace.transactions.map((transaction) => (
                                  <Typography variant="body2" key={transaction.id}>
                                    {transaction.name} (ID: {transaction.id})
                                  </Typography>
                                ))}
                              </>}
                            {matchedFace.transactions.length === 0 && <Typography variant="body2">Không tìm thấy vé của người dùng tại sự kiện này</Typography>}
                          </>
                        ))}
                      </Stack>
                      {face.matchedFaces.map((matchedFace) => (
                        <Box key={matchedFace.similarity}>
                          <img style={{ borderRadius: '20px', width: '100px', marginRight: '10px' }} src={matchedFace.imageUrl} alt={`Cropped Face ${matchedFace.similarity}`} />
                        </Box>
                      ))}
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </div>

          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}
