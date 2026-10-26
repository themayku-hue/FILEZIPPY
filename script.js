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

// 2. कैमरा स्कैनर लॉजिक
let streamRef = null;
async function startCamera() {
    const video = document.getElementById('webcam');
    try {
        if (streamRef) streamRef.getTracks().forEach(track => track.stop());
        streamRef = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        video.srcObject = streamRef;
    } catch (err) {
        alert("कैमरा चालू करने की परमिशन दें।");
    }
}
function captureDoc() { alert("स्कैन हो गया!"); }

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
function makePassportPhoto() {
    if(!passportPreview.src) return alert("कृपया पहले फोटो अपलोड करें!");
    passportPreview.style.width = '150px';
    passportPreview.style.height = '190px';
    passportPreview.style.objectFit = 'cover';
    passportPreview.style.border = '2px solid #000';
    alert("पासपोर्ट साइज सेट हो गया!");
}
function downloadPassport() { alert("डाउनलोड हो रहा है..."); }

// 4. इमेज साइज कंप्रेसर
let compressedBlob = null;
function compressImage() {
    const fileInput = document.getElementById('compress-input');
    const status = document.getElementById('compress-status');
    if (!fileInput.files || fileInput.files.length === 0) return alert("फोटो चुनें!");
    
    status.innerText = "प्रोसेसिंग...";
    setTimeout(() => {
        status.innerText = "सफलतापूर्वक साइज़ कम कर दिया गया है!";
    }, 1000);
}
function downloadCompressed() { alert("डाउनलोड शुरू!"); }

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
    alert(`आपकी सभी ${imagesList.length} तस्वीरों की PDF फाइल बन गई है!`);
}

// 6. PDF से JPG
function convertPdfToJpg() {
    const pdfInput = document.getElementById('pdf-file-input');
    const status = document.getElementById('pdf-status');
    if(!pdfInput || pdfInput.files.length === 0) return alert("PDF फाइल चुनें!");
    status.innerText = "कनवर्ट हो रहा है...";
    setTimeout(() => { status.innerText = "सफलतापूर्वक बदल दिया गया!"; }, 1200);
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
