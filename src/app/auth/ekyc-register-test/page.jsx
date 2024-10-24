"use client";

import {useEffect, useRef, useState} from 'react';
import React from "react";
import Webcam from "react-webcam";

export default function RegisterFace() {
    const [faceOutput, setFaceOutput] = useState(null);
    const [cardValidationOutput, setCardValidationOutput] = useState(null);
    const [bodyOutput, setBodyOutput] = useState(null);
    const [faceDetectionMessage, setFaceDetectionMessage] = useState("");
    const [executeFunctions, setExecuteFunctions] = useState({});
    const [customerName, setCustomerName] = useState('Mạnh');
    const [transactionId, setTransactionId] = useState(10242);
    const [images, setImages] = useState([]);
    const webcamRef = useRef(null);
    const [isLoadingModel, setIsLoadingModel] = useState(true);
    const [ekycFacePoseInstruction, setEkycFacePoseInstruction] = useState("")
    const step = useRef(0)  // step 0: center, step 1: turn left, step 2: turn right, step 3: turn up, step 4: turn down
    const [capturedCenterImage, setCapturedCenterImage] = useState(null);
    const [capturedLeftImage, setCapturedLeftImage] = useState(null);
    const [capturedRightImage, setCapturedRightImage] = useState(null);
    const [capturedUpImage, setCapturedUpImage] = useState(null);
    const [capturedDownImage, setCapturedDownImage] = useState(null);

    const onLoadedMetadata = async () => {
        const etikAiEdgeTool = (await import("etik_ai_edge_tool"));
        const executeLoop = async () => {
            if (webcamRef.current && webcamRef.current.video) {

                // hiển thị hướng dẫn
                switch (step.current) {
                    case 0:
                        setEkycFacePoseInstruction("Nhìn thẳng")
                        break
                    case 1:
                        setEkycFacePoseInstruction("Quay trái")
                        break
                    case 2:
                        setEkycFacePoseInstruction("Quay phải")
                        break
                    case 3:
                        setEkycFacePoseInstruction("Ngửa lên trên")
                        break
                    case 4:
                        setEkycFacePoseInstruction("Cúi xuống")
                        break
                    case 5:
                        setEkycFacePoseInstruction("Thành công.")
                        break

                }
                const result = await etikAiEdgeTool.executeFace({
                    left: 50,
                    right: 50,
                    up: 20,
                    down: 16,
                    centerX_left: 40,
                    centerX_right: 40,
                    centerY_up: 15,
                    centerY_down: 12,
                }, {}, false);
                if (result.codes.length === 1 && result.codes[0] === 0){
                    setFaceDetectionMessage(result.messages[0] + " " + result.pose.yaw + " " + result.pose.pitch)
                    switch (step.current) {
                        case 0:
                            if (result.pose.yaw === 'center' && result.pose.pitch === 'center') {
                                const imageSrc = webcamRef.current.getScreenshot();
                                setCapturedCenterImage(imageSrc)
                                step.current += 1
                            }
                            break
                        case 1:
                            if (result.pose.yaw === 'left' && result.pose.pitch === 'center') {
                                const imageSrc = webcamRef.current.getScreenshot();
                                setCapturedLeftImage(imageSrc)
                                step.current += 1
                            }
                            break
                        case 2:
                            if (result.pose.yaw === 'right' && result.pose.pitch === 'center') {
                                const imageSrc = webcamRef.current.getScreenshot();
                                setCapturedRightImage(imageSrc)
                                step.current += 1
                            }
                            break
                        case 3:
                            if (result.pose.yaw === 'center' && result.pose.pitch === 'up') {
                                const imageSrc = webcamRef.current.getScreenshot();
                                setCapturedUpImage(imageSrc)
                                step.current += 1
                            }
                            break
                        case 4:
                            if (result.pose.yaw === 'center' && result.pose.pitch === 'down') {
                                const imageSrc = webcamRef.current.getScreenshot();
                                setCapturedDownImage(imageSrc)
                                step.current += 1
                            }
                            break
                    }
                } else {
                    setFaceDetectionMessage(result.messages.join(", "))
                }


                setTimeout(executeLoop, 500);
            }
        };
        if (webcamRef.current && webcamRef.current.video) {
            await etikAiEdgeTool.initialFace(
                webcamRef.current.video,
                '/model_tfjs/faceliveness_mobilenetv2_025_mymodel_3_train_01042022_export_01042022/model.json',
            )
            setIsLoadingModel(false)
            setTimeout(executeLoop, 500);
        }
    };

    useEffect(() => {
        if (
            capturedCenterImage &&
            capturedLeftImage &&
            capturedRightImage &&
            capturedUpImage &&
            capturedDownImage
        ) {
            uploadImages(); // Auto-upload images when all are collected
        }
    }, [capturedCenterImage, capturedLeftImage, capturedRightImage, capturedUpImage, capturedDownImage]);

    // helper function: generate a new file from base64 String
    const dataURLtoFile = (dataUrl, filename) => {
        const arr = dataUrl.split(',')
        const mime = arr[0].match(/:(.*?);/)[1]
        const bstr = atob(arr[1])
        let n = bstr.length
        const u8arr = new Uint8Array(n)
        while (n) {
            u8arr[n - 1] = bstr.charCodeAt(n - 1)
            n -= 1 // to make eslint happy
        }
        return new File([u8arr], filename, { type: mime })
    }

    const uploadImages = async () => {
        const formData = new FormData();

        formData.append('centerImage', dataURLtoFile(capturedCenterImage));
        formData.append('leftImage', dataURLtoFile(capturedLeftImage));
        formData.append('rightImage', dataURLtoFile(capturedRightImage));
        formData.append('upImage', dataURLtoFile(capturedUpImage));
        formData.append('downImage', dataURLtoFile(capturedDownImage));

        // Adding additional form data
        formData.append('customerName', customerName);
        formData.append('transactionId', transactionId);

        try {
            const response = await fetch('http://localhost:5000/register-faces', {
                method: 'POST',
                headers: {
                    "Content-Transfer-Encoding": "base64"
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload images');
            }

            const result = await response.json();
            console.log('Upload successful:', result);
        } catch (error) {
            console.error('Error uploading images:', error);
        }
    };


    const handleImageChange = (e) => {
        const files = Array.from(e.target.files).slice(0, 3);
        setImages(files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        uploadImages();
    };
    const videoConstraints = {
        width: 720,
        height: 1080,
        facingMode: { exact: "user" }
    };

    return (
        <>
            <Webcam
                ref={webcamRef}
                audio={false}
                height={1080}
                screenshotFormat="image/jpeg"
                width={720}
                mirrored={true}
                videoConstraints={videoConstraints}
                onLoadedMetadata={onLoadedMetadata}
            >
            </Webcam>
            {isLoadingModel && <div>Đang tải dữ liệu, vui lòng chờ...</div>}
            <div>
                {ekycFacePoseInstruction}
            </div>
            <div>
                {faceDetectionMessage}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                {capturedCenterImage && (
                    <img
                        src={capturedCenterImage}
                        alt="Center"
                        style={{width: '100px', height: 'auto'}}
                    />
                )}
                {capturedLeftImage && (
                    <img
                        src={capturedLeftImage}
                        alt="Left"
                        style={{width: '100px', height: 'auto'}}
                    />
                )}
                {capturedRightImage && (
                    <img
                        src={capturedRightImage}
                        alt="Right"
                        style={{width: '100px', height: 'auto'}}
                    />
                )}
                {capturedUpImage && (
                    <img
                        src={capturedUpImage}
                        alt="Up"
                        style={{width: '100px', height: 'auto' }}
                    />
                )}
                {capturedDownImage && (
                    <img
                        src={capturedDownImage}
                        alt="Down"
                        style={{ width: '100px', height: 'auto' }}
                    />
                )}
            </div>


            <form onSubmit={handleSubmit}>
                <div>
                    <label>
                        Name:
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            required
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Transaction ID:
                        <input
                            type="text"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            required
                        />
                    </label>
                </div>
                {/*<div>*/}
                {/*    <label>*/}
                {/*        Upload Face Images (max 3):*/}
                {/*        <input*/}
                {/*            type="file"*/}
                {/*            accept="image/*"*/}
                {/*            multiple*/}
                {/*            onChange={handleImageChange}*/}
                {/*            required*/}
                {/*        />*/}
                {/*    </label>*/}
                {/*</div>*/}
                <button type="submit">Submit</button>
            </form>
        </>
    );
}