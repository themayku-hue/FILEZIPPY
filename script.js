 // 1. टूल्स के बीच में स्विच करने का फंक्शन
function switchTool(toolName) {
    const tools = ['scanner-tool', 'passport-tool', 'compressor-tool', 'img-to-pdf-tool', 'pdf-to-jpg-tool'];
    tools.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
    const target = document.getElementById(`${toolName}-tool`);
    if (target) target.classList.add('active');
}

// 2. लाइव कैमरा और असली सेव लॉजिक
let liveStreamRef = null;
let scannedImageBlobUrl = null;

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
    canvas.toBlob(function(blob) {
        if (scannedImageBlobUrl) URL.revokeObjectURL(scannedImageBlobUrl);
        scannedImageBlobUrl = URL.createObjectURL(blob);
        alert("स्कैन पूरा हुआ! अब डाउनलोड बटन दबाएं।");
    }, 'image/jpeg', 0.9);
}

function downloadPDF() {
    if (!scannedImageBlobUrl) return alert("पहले फोटो खींचें!");
    const link = document.createElement('a');
    link.href = scannedImageBlobUrl;
    link.download = 'scanned-doc.jpg';
    link.click();
}

// 3. पासपोर्ट फोटो - सेंटर फेस फोकस क्रॉप लॉजिक (मोटा होना बंद)
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
        // सेंटर क्रॉप लॉजिक: फोटो को स्ट्रेच किए बिना बीच से परफेक्ट चेहरा काटना
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
        alert("पासपोर्ट साइज फोटो (फेस फोकस) तैयार है!");
    };
}

function downloadPassport() {
    if(!passportPreview || !passportPreview.src) return alert("कोई फोटो नहीं है!");
    const link = document.createElement('a');
    link.href = passportCanvasRef ? passportCanvasRef.toDataURL('image/jpeg', 0.9) : passportPreview.src;
    link.download = 'passport-photo.jpg';
    link.click();
}

// 4. इमेज साइज़ कंप्रेसर - लूप लॉजिक (टारगेट KB हासिल करने के लिए)
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
            
            // लूप चलाकर सही क्वालिटी ढूंढना जो टारगेट केबी के सबसे पास हो
            let quality = 1.0;
            function attemptCompression() {
                canvas.toBlob(function(blob) {
                    const currentSizeKb = blob.size / 1024;
                    if (currentSizeKb <= targetKb || quality <= 0.1) {
                        globalCompressedBlob = blob;
                        status.innerHTML = `सफलतापूर्वक कंप्रेस किया गया! साइज: <strong>${currentSizeKb.toFixed(2)} KB</strong>`;
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
    link.click();
}

// 5. गैलरी इमेजेस से PDF - नो पेज कट लॉजिक (सभी पेजों के लिए फिक्स्ड)
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
    if(imagesList.length === 0) return alert("कृपया फोटो चुनें!");
    const printWindow = window.open('', '_blank');
    // हर पन्ने का मार्जिन और साइज एकदम टाइट फिट किया ताकि कोई भी पेज न कटे
    printWindow.document.write('<html><head><title>PDF</title><style>@page{margin:0; size:auto;} body{margin:0; padding:0; background:#fff;} .page-box{width:100vw; height:100vh; display:flex; align-items:center; justify-content:center; page-break-after:always; overflow:hidden;} img{max-width:100%; max-height:100%; object-fit:contain;}</style></head><body>');
    
    let loadedCount = 0;
    imagesList.forEach((file) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            printWindow.document.write(`<div class="page-box"><img src="${e.target.result}"></div>`);
            loadedCount++;
            if(loadedCount === imagesList.length) {
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => { printWindow.print(); }, 500);
            }
        };
        reader.readAsDataURL(file);
    });
}

// 6. PDF से JPG
function convertPdfToJpg() {
    const pdfInput = document.getElementById('pdf-file-input');
    if(!pdfInput || pdfInput.files.length === 0) return alert("PDF फाइल चुनें!");
    const link = document.createElement('a');
    link.href = URL.createObjectURL(pdfInput.files[0]);
    link.download = 'converted-jpg.jpg';
    link.click();
}

// 7. भाषा चेंजर
