const actionButtons = document.querySelectorAll('.action-btn');

actionButtons.forEach((button) => {
    button.addEventListener('click', () => {
        actionButtons.forEach((item) => item.classList.remove('is-selected'));
        button.classList.add('is-selected');
    });
});

const scannerModal = document.getElementById('scannerModal');
const closeScannerButton = document.getElementById('closeScanner');
const scanButton = document.querySelector('.scan-btn');
const qrVideo = document.getElementById('qrVideo');
const qrCanvas = document.getElementById('qrCanvas');
const scannerStatus = document.getElementById('scannerStatus');
const qrFileInput = document.getElementById('qrFileInput');
const uploadBtn = document.getElementById('uploadBtn');
const torchButton = document.getElementById('torchBtn');
const helpButton = document.getElementById('scannerHelp');
let cameraStream = null;
let scanFrameId = null;
let cameraTrack = null;
let torchEnabled = false;

function stopCamera() {
    if (scanFrameId) {
        cancelAnimationFrame(scanFrameId);
        scanFrameId = null;
    }

    if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        cameraStream = null;
    }
    cameraTrack = null;
    torchEnabled = false;
    if (torchButton) {
        torchButton.setAttribute('aria-pressed', 'false');
    }

    if (qrVideo) {
        qrVideo.srcObject = null;
    }
}

function closeScanner() {
    stopCamera();
    if (scannerModal) {
        scannerModal.classList.add('hidden');
    }
}

function handleScanResult(data) {
    if (!data) return;

    scannerStatus.textContent = `QR scanned: ${data}`;
    alert(`QR code scanned successfully: ${data}`);
    closeScanner();
}

function startCameraScan() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        scannerStatus.textContent = 'Camera not supported on this device.';
        return;
    }

    if (qrVideo) {
        qrVideo.setAttribute('playsinline', true);
    }

    navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
    }).then((stream) => {
        cameraStream = stream;
        cameraTrack = stream.getVideoTracks()[0];
        if (qrVideo) {
            qrVideo.srcObject = stream;
            qrVideo.play();
        }

        scannerStatus.textContent = 'Scanning for QR code...';

        const context = qrCanvas.getContext('2d', { willReadFrequently: true });

        function tick() {
            if (!qrVideo || qrVideo.readyState < 2) {
                scanFrameId = requestAnimationFrame(tick);
                return;
            }

            const width = qrVideo.videoWidth;
            const height = qrVideo.videoHeight;

            if (width && height) {
                qrCanvas.width = width;
                qrCanvas.height = height;
                context.drawImage(qrVideo, 0, 0, qrCanvas.width, qrCanvas.height);

                const imageData = context.getImageData(0, 0, qrCanvas.width, qrCanvas.height);
                const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'dontInvert'
                });

                if (code) {
                    handleScanResult(code.data);
                    return;
                }
            }

            scanFrameId = requestAnimationFrame(tick);
        }

        tick();
    }).catch(() => {
        scannerStatus.textContent = 'Camera permission denied. You can upload a QR image instead.';
        if (uploadBtn) {
            uploadBtn.style.display = 'block';
        }
    });
}

function readQrFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert'
            });

            if (code) {
                handleScanResult(code.data);
            } else {
                scannerStatus.textContent = 'No QR code detected in the uploaded image.';
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

if (scanButton) {
    scanButton.addEventListener('click', () => {
        scanButton.classList.add('is-selected');
        setTimeout(() => scanButton.classList.remove('is-selected'), 220);

        if (scannerModal) {
            scannerModal.classList.remove('hidden');
            scannerStatus.textContent = 'Allow camera access to scan QR.';
            startCameraScan();
        }
    });
}

if (closeScannerButton) {
    closeScannerButton.addEventListener('click', closeScanner);
}

if (scannerModal) {
    scannerModal.addEventListener('click', (event) => {
        if (event.target === scannerModal) {
            closeScanner();
        }
    });
}

if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
        qrFileInput.click();
    });
}

if (torchButton) {
    torchButton.addEventListener('click', async () => {
        const supportsTorch = cameraTrack?.getCapabilities?.().torch;
        if (!supportsTorch) {
            scannerStatus.textContent = 'Torch is not supported by this camera.';
            return;
        }

        try {
            torchEnabled = !torchEnabled;
            await cameraTrack.applyConstraints({ advanced: [{ torch: torchEnabled }] });
            torchButton.setAttribute('aria-pressed', String(torchEnabled));
        } catch {
            torchEnabled = false;
            torchButton.setAttribute('aria-pressed', 'false');
            scannerStatus.textContent = 'Could not turn on the torch.';
        }
    });
}

if (helpButton) {
    helpButton.addEventListener('click', () => {
        scannerStatus.textContent = 'Hold your camera steady and fit the QR code inside the purple frame.';
    });
}

if (qrFileInput) {
    qrFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        readQrFromFile(file);
    });
}

