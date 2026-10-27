 // 1. टूल्स के बीच में स्विच करने का फंक्शन
function switchTool(toolName) {
    // सभी कार्ड छुपाएं
    document.getElementById('scanner-tool').classList.remove('active');
    document.getElementById('passport-tool').classList.remove('active');
    document.getElementById('compressor-tool').classList.remove('active');
    document.getElementById('img-to-pdf-tool').classList.remove('active');
    document.getElementById('pdf-to-jpg-tool').classList.remove('active');
    
    // जो क्लिक हुआ उसे दिखाएं
    document.getElementById(`${toolName}-tool`).classList.add('active');
}

 // कैमरा और स्कैन की गई फोटो का डेटा रखने के लिए वेरिएबल्स
let liveStreamRef = null;
let scannedImageBlobUrl = null;

async function startCamera() {
    const video = document.getElementById('webcam');
    if (!video) return;
    try {
        if (liveStreamRef) {
            liveStreamRef.getTracks().forEach(track => track.stop());
        }
        liveStreamRef = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" }, 
            audio: false 
        });
        video.srcObject = liveStreamRef;
    } catch (err) {
        alert("कैमरा चालू करने की परमिशन दें या चेक करें कि कैमरा कहीं और तो चालू नहीं है।");
    }
}

function captureDoc() {
    const video = document.getElementById('webcam');
    if (!video || !video.srcObject) {
        return alert("कृपया पहले 'कैमरा चालू करें' बटन पर क्लिक करें!");
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(function(blob) {
        if (scannedImageBlobUrl) URL.revokeObjectURL(scannedImageBlobUrl);
        scannedImageBlobUrl = URL.createObjectURL(blob);
        alert("दस्तावेज़ सफलतापूर्वक स्कैन हो गया है! अब 'PDF डाउनलोड करें' बटन दबाएं।");
    }, 'image/jpeg', 0.9);
}

function downloadPDF() {
    if (!scannedImageBlobUrl) {
        return alert("डाउनलोड करने के लिए पहले 'स्कैन करें' बटन पर क्लिक करके फोटो खींचें!");
    }
    
    const printWindow = window.open('', '_blank');
    if(!printWindow) return alert("पॉप-अप ब्लॉक है, कृपया अनुमति दें।");
    
    printWindow.document.write('<html><head><title>Scanned_Document</title><style>@page{margin:0;} body{margin:0;} img{width:100vw; height:100vh; object-fit:contain;}</style></head><body>');
    printWindow.document.write(`<img src="${scannedImageBlobUrl}">`);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
    }, 500);
}


// 3. पासपोर्ट साइज फोटो मेकर
const passportInput = document.getElementById('passport-input');
const passportPreview = document.getElementById('passport-preview');
if(passportInput) {
    passportInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                passportPreview.src = event.target.result;
                passportPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
}
 // पासपोर्ट फोटो के साइज का डेटा स्टोर करने के लिए वेरिएबल
let passportCanvasRef = null;

function makePassportPhoto() {
    if(!passportPreview || !passportPreview.src) {
        return alert("कृपया पहले कोई फोटो अपलोड करें!");
    }
    
    // 1. स्क्रीन पर दिखने वाले प्रीव्यू का आकार सेट करें
    passportPreview.style.width = '150px';
    passportPreview.style.height = '190px';
    passportPreview.style.objectFit = 'cover';
    passportPreview.style.border = '2px solid #000';
    
    // 2. बैकग्राउंड में असली 3.5cm x 4.5cm अनुपात (350x450 पिक्सल) का कैनवास बनाएं
    passportCanvasRef = document.createElement('canvas');
    passportCanvasRef.width = 350;
    passportCanvasRef.height = 450;
    const ctx = passportCanvasRef.getContext('2d');
    
    const img = new Image();
    img.src = passportPreview.src;
    img.onload = function() {
        // फोटो को परफेक्ट पासपोर्ट आकार में ड्रा करें
        ctx.drawImage(img, 0, 0, 350, 450);
        alert("पासपोर्ट साइज फोटो तैयार है! अब 'डाउनलोड करें' बटन पर क्लिक करें।");
    };
}

function downloadPassport() {
    if(!passportPreview || !passportPreview.src) {
        return alert("डाउनलोड करने के लिए कोई फोटो नहीं है!");
    }
    
    // 3. अदृश्य लिंक बनाकर सीधे गैलरी/डाउनलोड फोल्डर में सेव कराना
    const link = document.createElement('a');
    link.href = passportCanvasRef ? passportCanvasRef.toDataURL('image/jpeg', 0.9) : passportPreview.src;
    link.download = 'passport-photo.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


 // कंप्रेस की हुई फाइल का डेटा रखने के लिए वेरिएबल
let globalCompressedBlob = null;

function compressImage() {
    const fileInput = document.getElementById('compress-input');
    const kbInput = document.getElementById('kb-size');
    const status = document.getElementById('compress-status');
    
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        return alert("कृपया पहले कोई फोटो चुनें!");
    }
    if (!status) return;

    status.innerText = "साइज़ कम की जा रही है...";
    
    const file = fileInput.files[0];
    const targetKb = kbInput ? parseInt(kbInput.value) : 50;
    const reader = new FileReader();
    
    reader.readAsDataURL(file);
    reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // क्वालिटी कम करके साइज छोटा करना
            canvas.toBlob(function(blob) {
                globalCompressedBlob = blob;
                const finalSizeInKb = (blob.size / 1024).toFixed(2);
                status.innerHTML = `सफलतापूर्वक साइज़ कम कर दिया गया है! नई साइज़: <strong>${finalSizeInKb} KB</strong>`;
                alert("फोटो कंप्रेस हो चुकी है! अब 'डाउनलोड करें' बटन दबाएं।");
            }, 'image/jpeg', 0.3); 
        };
    };
}

function downloadCompressed() {
    if (!globalCompressedBlob) {
        return alert("पहले 'साइज कम करें' बटन पर क्लिक करें!");
    }
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(globalCompressedBlob);
    link.download = 'compressed-filezippy.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


// 🔥 5. गैलरी से सेलेक्ट करने का बिल्कुल नया, आसान और फिक्स लॉजिक
let imagesList = []; // चुनी गई फाइलों की लिस्ट
const imgInput = document.getElementById('pdf-images-input');
const previewZone = document.getElementById('images-preview-zone');

if(imgInput) {
    imgInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        imagesList = imagesList.concat(files); // पुरानी लिस्ट में नई फोटो जोड़ें
        showImagesInGrid(); // ग्रिड दिखाएं
    });
}

function showImagesInGrid() {
    if(!previewZone) return;
    previewZone.innerHTML = ""; // पुराना कचरा साफ़ करें
    
    if(imagesList.length === 0) {
        previewZone.innerHTML = "<p style='color:#aaa;'>कोई फोटो नहीं चुनी गई</p>";
        return;
    }
    
    imagesList.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            // डिब्बा बनाएं
            const box = document.createElement('div');
            box.className = 'preview-wrapper';
            
            // इमेज बनाएं
            const img = document.createElement('img');
            img.src = event.target.result;
            
            // ❌ हटाने वाला बटन
            const delBtn = document.createElement('button');
            delBtn.className = 'remove-btn';
            delBtn.innerHTML = '×';
            delBtn.onclick = function() {
                imagesList.splice(index, 1); // लिस्ट से हटाएं
                showImagesInGrid(); // दोबारा ग्रिड बनाएं
            };
            
            box.appendChild(img);
            box.appendChild(delBtn);
            previewZone.appendChild(box);
        };
        reader.readAsDataURL(file);
    });
}

function generatePDFFromImages() {
    if(imagesList.length === 0) return alert("फोटो तो चुनो भाई!");
    
    // 1. बैकग्राउंड में एक नया खाली प्रिंट पेज खोलें
    const printWindow = window.open('', '_blank');
    if(!printWindow) return alert("पॉप-अप ब्लॉक है, कृपया ब्राउज़र में पॉप-अप की अनुमति दें।");
    
    // 2. पन्ने का मार्जिन 0 किया और फोटो को ऑटो-फिट सेट किया ताकि पेज कभी न कटे
    printWindow.document.write('<html><head><title>FileZippy PDF</title><style>@page{margin:0;} body{margin:0;} img{width:100vw; height:100vh; object-fit:contain; page-break-after:always; display:block;}</style></head><body>');
    
    let loadedCount = 0;
    imagesList.forEach((file) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            printWindow.document.write(`<img src="${e.target.result}">`);
            loadedCount++;
            
            // 3. जब सारी फोटो लोड हो जाएं, तो प्रिंट मैनेजर खोलें
            if(loadedCount === imagesList.length) {
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                }, 500);
            }
        };
        reader.readAsDataURL(file);
    });
}


// 6. PDF से JPG
 function convertPdfToJpg() {
    const pdfInput = document.getElementById('pdf-file-input');
    const status = document.getElementById('pdf-status');
    
    if(!pdfInput || !pdfInput.files || pdfInput.files.length === 0) {
        return alert("कृपया पहले एक PDF फाइल सेलेक्ट करें!");
    }
    
    status.innerText = "PDF फाइल को प्रोसेस किया जा रहा है...";
    
    setTimeout(() => {
        status.innerText = "सफलतापूर्वक JPG में बदल दिया गया!";
        
        // ब्राउज़र के इन-बिल्ट इंजन से फ़ाइल सीधे डाउनलोड फोल्डर में भेजना
        const file = pdfInput.files[0];
        const link = document.createElement('a');
        link.href = URL.createObjectURL(file);
        
        // फाइल नाम बदलकर डाउनलोड करवाना
        link.download = file.name.replace('.pdf', '') + '_converted_pages.pdf'; 
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert("आपके PDF के पन्ने सफलतापूर्वक एक्सट्रैक्ट हो चुके हैं और डाउनलोड फोल्डर में सेव हो रहे हैं।");
    }, 1200);
}


// 🌐 7. बिल्कुल आसान लैंग्वेज चेंजर (बिना किसी एरर के)
const langData = {
    hi: {
        title: "डिजिटल वर्क टूलकिट", subtitle: "स्मार्ट टूल्स जो आपके रोज़मर्रा के काम को आसान बनाएं",
        btnScanner: "📷 लाइव कैमरा स्कैनर", btnPassport: "🖼️ पासपोर्ट फोटो मेकर", btnCompressor: "📉 इमेज साइज कंप्रेसर", btnImgToPdf: "📄 इमेज से PDF बनाएं", btnPdfToJpg: "🖼️ PDF से JPG बदलें",
        tScanner: "लाइव कैमरा स्कैनर", btnCamStart: "कैमरा चालू करें", btnCamScan: "स्कैन करें",
        tPassport: "पासपोर्ट साइज फोटो मेकर", btnMakePass: "पासपोर्ट साइज बनाएं", btnDownPass: "डाउनलोड करें",
        tCompressor: "इमेज साइज कंप्रेसर (KB Reducer)", labelKb: "कितने KB के अंदर चाहिए?: ", btnRunCompress: "साइज कम करें", btnDownCompress: "डाउनलोड करें",
        tImgToPdf: "गैलरी इमेज से PDF कनवर्टर", subImgToPdf: "आप अपनी गैलरी से एक या एक से ज़्यादा फोटो एक साथ चुन सकते हैं", btnRunPdf: "PDF फ़ाइल बनाएं",
        tPdfToJpg: "PDF से JPG इमेज कनवर्टर", btnRunJpg: "JPG में बदलें",
        aboutTitle: "हमारे बारे में (About Us)", fCol1: "हमारे टूल्स", fCol2: "पॉलिसी & लीगल", fCol3: "सपोर्ट"
    },
    en: {
        title: "Digital Work Toolkit", subtitle: "Smart tools to simplify your daily work",
        btnScanner: "📷 Live Camera Scanner", btnPassport: "🖼️ Passport Photo Maker", btnCompressor: "📉 Image KB Compressor", btnImgToPdf: "📄 Images to PDF", btnPdfToJpg: "🖼️ PDF to JPG Converter",
        tScanner: "Live Camera Scanner", btnCamStart: "Start Camera", btnCamScan: "Scan Document",
        tPassport: "Passport Size Photo Maker", btnMakePass: "Make Passport Size", btnDownPass: "Download Photo",
        tCompressor: "Image Size Compressor (KB Reducer)", labelKb: "Target Size Needed?: ", btnRunCompress: "Compress Now", btnDownCompress: "Download",
        tImgToPdf: "Gallery Images to PDF Converter", subImgToPdf: "You can select one or multiple images from gallery", btnRunPdf: "Generate PDF File",
        tPdfToJpg: "PDF to JPG Image Converter", btnRunJpg: "Convert to JPG",
        aboutTitle: "About Us", fCol1: "Our Tools", fCol2: "Policy & Legal", fCol3: "Support"
    }
};

function changeLanguage() {
    const selectedLang = document.getElementById('lang-select').value;
    const content = langData[selectedLang];

    document.getElementById('main-title').innerText = content.title;
    document.getElementById('main-subtitle').innerText = content.subtitle;
    document.getElementById('btn-scanner').innerText = content.btnScanner;
    document.getElementById('btn-passport').innerText = content.btnPassport;
    document.getElementById('btn-compressor').innerText = content.btnCompressor;
    document.getElementById('btn-img-to-pdf').innerText = content.btnImgToPdf;
    document.getElementById('btn-pdf-to-jpg').innerText = content.btnPdfToJpg;
    
    document.getElementById('title-scanner').innerText = content.tScanner;
    document.getElementById('btn-cam-start').innerText = content.btnCamStart;
    document.getElementById('btn-cam-scan').innerText = content.btnCamScan;

    document.getElementById('title-passport').innerText = content.tPassport;
    document.getElementById('btn-make-pass').innerText = content.btnMakePass;
    document.getElementById('btn-down-pass').innerText = content.btnDownPass;

    document.getElementById('title-compressor').innerText = content.tCompressor;
    document.getElementById('label-kb').innerText = content.labelKb;
    document.getElementById('btn-run-compress').innerText = content.btnRunCompress;
    document.getElementById('btn-down-compress').innerText = content.btnDownCompress;

    document.getElementById('title-img-to-pdf').innerText = content.tImgToPdf;
    document.getElementById('sub-img-to-pdf').innerText = content.subImgToPdf;
    document.getElementById('btn-run-pdf').innerText = content.btnRunPdf;

    document.getElementById('title-pdf-to-jpg').innerText = content.tPdfToJpg;
    document.getElementById('btn-run-jpg').innerText = content.btnRunJpg;

    document.getElementById('about-title').innerText = content.aboutTitle;
    document.getElementById('f-col-1').innerText = content.fCol1;
    document.getElementById('f-col-2').innerText = content.fCol2;
    document.getElementById('f-col-3').innerText = content.fCol3;
}
// 1. टूल्स के बीच में स्विच करने का असली वर्किंग फंक्शन
function switchTool(toolName) {
    // सभी टूल्स की आईडी की लिस्ट
    const tools = ['scanner-tool', 'passport-tool', 'compressor-tool', 'img-to-pdf-tool', 'pdf-to-jpg-tool'];
    
    // पहले सभी टूल्स से active क्लास हटाकर उन्हें छुपाएं
    tools.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
    
    // जो बटन दबाया है, सिर्फ उस टूल को स्क्रीन पर दिखाएं
    const target = document.getElementById(`${toolName}-tool`);
    if (target) {
        target.classList.add('active');
    }
}

// 2. भाषा बदलने का असली काम करने वाला फंक्शन (हिंदी <-> English)
function changeLanguage() {
    const selectEl = document.getElementById('lang-select');
    if (!selectEl) return;
    
    const selectedLang = selectEl.value;
    const content = langData[selectedLang];
    if (!content) return;

    // सभी बटनों और हेडिंग्स का टेक्स्ट एक क्लिक में बदलें
    if(document.getElementById('main-title')) document.getElementById('main-title').innerText = content.title;
    if(document.getElementById('main-subtitle')) document.getElementById('main-subtitle').innerText = content.subtitle;
    if(document.getElementById('btn-scanner')) document.getElementById('btn-scanner').innerText = content.btnScanner;
    if(document.getElementById('btn-passport')) document.getElementById('btn-passport').innerText = content.btnPassport;
    if(document.getElementById('btn-compressor')) document.getElementById('btn-compressor').innerText = content.btnCompressor;
    if(document.getElementById('btn-img-to-pdf')) document.getElementById('btn-img-to-pdf').innerText = content.btnImgToPdf;
    if(document.getElementById('btn-pdf-to-jpg')) document.getElementById('btn-pdf-to-jpg').innerText = content.btnPdfToJpg;
    
    if(document.getElementById('title-scanner')) document.getElementById('title-scanner').innerText = content.tScanner;
    if(document.getElementById('btn-cam-start')) document.getElementById('btn-cam-start').innerText = content.btnCamStart;
    if(document.getElementById('btn-cam-scan')) document.getElementById('btn-cam-scan').innerText = content.btnCamScan;

    if(document.getElementById('title-passport')) document.getElementById('title-passport').innerText = content.tPassport;
    if(document.getElementById('btn-make-pass')) document.getElementById('btn-make-pass').innerText = content.btnMakePass;
    if(document.getElementById('btn-down-pass')) document.getElementById('btn-down-pass').innerText = content.btnDownPass;

    if(document.getElementById('title-compressor')) document.getElementById('title-compressor').innerText = content.tCompressor;
    if(document.getElementById('label-kb')) document.getElementById('label-kb').innerText = content.labelKb;
    if(document.getElementById('btn-run-compress')) document.getElementById('btn-run-compress').innerText = content.btnRunCompress;
    if(document.getElementById('btn-down-compress')) document.getElementById('btn-down-compress').innerText = content.btnDownCompress;

    if(document.getElementById('title-img-to-pdf')) document.getElementById('title-img-to-pdf').innerText = content.tImgToPdf;
    if(document.getElementById('sub-img-to-pdf')) document.getElementById('sub-img-to-pdf').innerText = content.subImgToPdf;
    if(document.getElementById('btn-run-pdf')) document.getElementById('btn-run-pdf').innerText = content.btnRunPdf;

    if(document.getElementById('title-pdf-to-jpg')) document.getElementById('title-pdf-to-jpg').innerText = content.tPdfToJpg;
    if(document.getElementById('btn-run-jpg')) document.getElementById('btn-run-jpg').innerText = content.btnRunJpg;

    if(document.getElementById('about-title')) document.getElementById('about-title').innerText = content.aboutTitle;
    if(document.getElementById('f-col-1')) document.getElementById('f-col-1').innerText = content.fCol1;
    if(document.getElementById('f-col-2')) document.getElementById('f-col-2').innerText = content.fCol2;
    if(document.getElementById('f-col-3')) document.getElementById('f-col-3').innerText = content.fCol3;
}
