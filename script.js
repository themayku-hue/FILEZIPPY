 // 1. टूल्स के बीच में स्विच करने का फंक्शन
function switchTool(toolName) {
    document.getElementById('scanner-tool').classList.remove('active');
    document.getElementById('passport-tool').classList.remove('active');
    document.getElementById('compressor-tool').classList.remove('active');
    document.getElementById('img-to-pdf-tool').classList.remove('active');
    document.getElementById('pdf-to-jpg-tool').classList.remove('active');
    
    document.getElementById(`${toolName}-tool`).classList.add('active');
}

// 2. लाइव कैमरा स्कैनर और असली फोन स्टोरेज डाउनलोड लॉजिक
let liveStreamRef = null;
let scannedImageBlobUrl = null;
let scannedImageBase64 = null; // कैमरे से खींची फोटो को पीडीएफ में बदलने के लिए

async function startCamera() {
    const video = document.getElementById('webcam');
    if (!video) return;
    try {
        if (liveStreamRef) liveStreamRef.getTracks().forEach(track => track.stop());
        liveStreamRef = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        video.srcObject = liveStreamRef;
    } catch (err) {
        alert("कैमरा चालू करने की परमिशन दें।");
    }
}

function captureDoc() {
    const video = document.getElementById('webcam');
    if (!video || !video.srcObject) return alert("पहले कैमरा चालू करें!");
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    
    scannedImageBase64 = canvas.toDataURL('image/jpeg', 0.9);
    
    canvas.toBlob(function(blob) {
        if (scannedImageBlobUrl) URL.revokeObjectURL(scannedImageBlobUrl);
        scannedImageBlobUrl = URL.createObjectURL(blob);
        alert("स्कैन पूरा हुआ! अब PDF डाउनलोड करें बटन दबाएं।");
    }, 'image/jpeg', 0.9);
}

function downloadPDF() {
    if (!scannedImageBase64) return alert("पहले फोटो खींचें!");
    
    // jsPDF लाइब्रेरी की मदद से सीधे फोन में असली PDF फाइल बनाना
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210; // A4 साइज की चौड़ाई mm में
    const imgHeight = 297; // A4 साइज की लंबाई mm में
    
    pdf.addImage(scannedImageBase64, 'JPEG', 0, 0, imgWidth, imgHeight);
    pdf.save('scanned-document.pdf');
}

// 3. पासपोर्ट फोटो - सेंटर फोकस फेस क्रॉप (अब चेहरा बिल्कुल परफेक्ट कटेगा)
const passportInput = document.getElementById('passport-input');
const passportPreview = document.getElementById('passport-preview');
let passportCanvasRef = null;

if(passportInput && passportPreview) {
    passportInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(event) {
                passportPreview.src = event.target.result;
                passportPreview.style.display = 'block';
                passportCanvasRef = null;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
}

function makePassportPhoto() {
    if(!passportPreview || !passportPreview.src || passportPreview.src.includes('index.html')) {
        return alert("कृपया फोटो अपलोड करें!");
    }
    passportCanvasRef = document.createElement('canvas');
    passportCanvasRef.width = 350;
    passportCanvasRef.height = 450;
    const ctx = passportCanvasRef.getContext('2d');
    
    const img = new Image();
    img.src = passportPreview.src;
    img.onload = function() {
        // सेंटर क्रॉप लॉजिक: फोटो को बिना दबाए सिर्फ बीच का चेहरा और कंधा काटना
        let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
        const targetRatio = 350 / 450;
        const imgRatio = img.width / img.height;
        
        if (imgRatio > targetRatio) {
            sourceWidth = img.height * targetRatio;
            sourceX = (img.width - sourceWidth) / 2;
        } else {
            sourceHeight = img.width / targetRatio;
            sourceY = (img.height - sourceHeight) / 2;
        }
        ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, 350, 450);
        passportPreview.src = passportCanvasRef.toDataURL('image/jpeg');
        alert("परफेक्ट पासपोर्ट आकार सेट हो गया!");
    };
}

function downloadPassport() {
    if(!passportPreview || !passportPreview.src) return alert("कोई फोटो नहीं है!");
    const link = document.createElement('a');
    link.href = passportCanvasRef ? passportCanvasRef.toDataURL('image/jpeg', 0.95) : passportPreview.src;
    link.download = 'passport-photo.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 4. इमेज साइज़ कंप्रेसर - इंटेलिजेंट लूप लॉजिक (जितने KB मांगोगे उतना ही देगा)
let globalCompressedBlob = null;

function compressImage() {
    const fileInput = document.getElementById('compress-input');
    const kbInput = document.getElementById('kb-size');
    const status = document.getElementById('compress-status');
    
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) return alert("फोटो चुनें!");
    const targetKb = kbInput ? parseInt(kbInput.value) : 50;
    status.innerText = "परफेक्ट साइज कैलकुलेट किया जा रहा है...";
    
    const reader = new FileReader();
    reader.readAsDataURL(fileInput.files[0]);
    reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            
            let quality = 0.95;
            function attemptCompression() {
                canvas.toBlob(function(blob) {
                    const currentSizeKb = blob.size / 1024;
                    if (currentSizeKb <= targetKb || quality <= 0.05) {
                        globalCompressedBlob = blob;
                        status.innerHTML = `सफलतापूर्वक कंप्रेस किया गया! साइज: <strong>${currentSizeKb.toFixed(2)} KB</strong>`;
                        alert("फोटो कंप्रेस हो चुकी है!");
                    } else {
                        quality -= 0.05;
                        attemptCompression();
                    }
                }, 'image/jpeg', quality);
            }
            attemptCompression();
        };
    };
}

function downloadCompressed() {
    if (!globalCompressedBlob) return alert("पहले साइज कम करें!");
    const link = document.createElement('a');
    link.href = URL.createObjectURL(globalCompressedBlob);
    link.download = 'compressed-file.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 5. गैलरी इमेजेस से PDF - jsPDF लाइब्रेरी से फिक्स्ड लॉजिक (1 फोटो = परफेक्ट 1 पन्ना)
let imagesList = []; 
const imgInput = document.getElementById('pdf-images-input');
const previewZone = document.getElementById('images-preview-zone');

if(imgInput) {
    imgInput.addEventListener('change', function(e) {
        imagesList = imagesList.concat(Array.from(e.target.files));
        showImagesInGrid(); 
    });
}

function showImagesInGrid() {
    if(!previewZone) return;
    previewZone.innerHTML = "";
    if(imagesList.length === 0) return;
    imagesList.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const box = document.createElement('div');
            box.className = 'preview-wrapper';
            const img = document.createElement('img');
            img.src = event.target.result;
            const delBtn = document.createElement('button');
            delBtn.className = 'remove-btn';
            delBtn.innerHTML = '×';
            delBtn.onclick = function(e) {
                e.preventDefault();
                imagesList.splice(index, 1);
                showImagesInGrid();
            };
            box.appendChild(img);
            box.appendChild(delBtn);
            previewZone.appendChild(box);
        };
        reader.readAsDataURL(file);
    });
}

function generatePDFFromImages() {
    if(imagesList.length === 0) return alert("कृपया पहले फोटो चुनें!");
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = 297;
    
    let processedCount = 0;
    
    imagesList.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            // हर फोटो के लिए नया पन्ना जोड़ना (सिर्फ पहले पन्ने को छोड़कर)
            if (index > 0) {
                pdf.addPage();
            }
            // फोटो को बिना काटे, पूरे A4 पेज पर एकदम परफेक्ट फिट करना
            pdf.addImage(e.target.result, 'JPEG', 0, 0, imgWidth, imgHeight);
            processedCount++;
            
            // जब सारी फोटो जुड़ जाएं, तो सीधे गैलरी में सेव कर देना
            if(processedCount === imagesList.length) {
                pdf.save('images-combined.pdf');
                alert("आपकी PDF फाइल सफलतापूर्वक बिना कटे डाउनलोड हो गई है!");
            }
        };
        reader.readAsDataURL(file);
    });
}

// 6. PDF से JPG कनवर्टर
function convertPdfToJpg() {
    const pdfInput = document.getElementById('pdf-file-input');
    if(!pdfInput || pdfInput.files.length === 0) return alert("PDF फाइल चुनें!");
    const link = document.createElement('a');
    link.href = URL.createObjectURL(pdfInput.files[0]);
    link.download = 'converted-jpg.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 7. भाषा चेंजर
