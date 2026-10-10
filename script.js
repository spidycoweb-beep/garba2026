const actionButtons = document.querySelectorAll('.action-btn');

actionButtons.forEach((button) => {
    button.addEventListener('click', () => {
        actionButtons.forEach((item) => item.classList.remove('is-selected'));
        button.classList.add('is-selected');
    });
});

const scannerModal = document.getElementById('scannerModal');
const closeScannerButton = document.getElementById('closeScanner');
const scanSuccess = document.getElementById('scanSuccess');
const scanButton = document.querySelector('.scan-btn');
const qrVideo = document.getElementById('qrVideo');
const qrCanvas = document.getElementById('qrCanvas');
const scannerStatus = document.getElementById('scannerStatus');
const photoUploadButton = document.getElementById('photoUploadButton');
const photoUploadInput = document.getElementById('photoUploadInput');
const participantPhoto = document.querySelector('.photo-box img');
let cameraStream = null;
let scanFrameId = null;
let resultTimeoutId = null;
let scanCompleted = false;
let participantPhotoUrl = null;

if (photoUploadButton && photoUploadInput && participantPhoto) {
    photoUploadButton.addEventListener('click', () => photoUploadInput.click());

    photoUploadInput.addEventListener('change', () => {
        const photo = photoUploadInput.files[0];
        if (!photo) return;

        if (participantPhotoUrl) {
            URL.revokeObjectURL(participantPhotoUrl);
        }

        participantPhotoUrl = URL.createObjectURL(photo);
        participantPhoto.src = participantPhotoUrl;
        photoUploadInput.value = '';
    });
}

function stopCamera() {
    if (scanFrameId) {
        cancelAnimationFrame(scanFrameId);
        scanFrameId = null;
    }

    if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        cameraStream = null;
    }
    if (qrVideo) {
        qrVideo.srcObject = null;
    }
}

function closeScanner() {
    clearTimeout(resultTimeoutId);
    resultTimeoutId = null;
    scanCompleted = false;
    stopCamera();
    if (scannerModal) {
        scannerModal.classList.add('hidden');
    }
    if (scanSuccess) {
        scanSuccess.classList.add('hidden');
    }
    document.body.classList.remove('pass-visible');
}

function handleScanResult(data) {
    if (!data || scanCompleted) return;

    scanCompleted = true;
    scannerStatus.textContent = 'QR recognized. Showing pass.';

    const delay = 1000 + Math.random() * 500;
    resultTimeoutId = setTimeout(() => {
        stopCamera();
        scannerModal.classList.add('hidden');
        if (scanSuccess) {
            scanSuccess.classList.remove('hidden');
            document.body.classList.add('pass-visible');
        }
    }, delay);
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
        scannerStatus.textContent = 'Camera permission denied.';
    });
}

if (scanButton) {
    scanButton.addEventListener('click', () => {
        scanButton.classList.add('is-selected');
        setTimeout(() => scanButton.classList.remove('is-selected'), 220);

        if (scannerModal) {
            scanCompleted = false;
            if (scanSuccess) {
                scanSuccess.classList.add('hidden');
            }
            scannerModal.classList.remove('hidden');
            scannerStatus.textContent = 'Allow camera access to scan QR.';
            startCameraScan();
        }
    });
}

if (closeScannerButton) {
    closeScannerButton.addEventListener('click', closeScanner);
}

if (scanSuccess) {
    scanSuccess.addEventListener('click', closeScanner);
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && scanSuccess && !scanSuccess.classList.contains('hidden')) {
        closeScanner();
    }
});

if (scannerModal) {
    scannerModal.addEventListener('click', (event) => {
        if (event.target === scannerModal) {
            closeScanner();
        }
    });
}


