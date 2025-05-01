class DocxToPdfConverter {
  constructor() {
    this.docxFile = null;
    this.initialize();
  }

  initialize() {
    // DOM elements
    this.fileInput = document.getElementById('fileInput');
    this.dropZone = document.getElementById('dropZone');
    this.filePreview = document.getElementById('filePreview');
    this.convertBtn = document.getElementById('convertBtn');
    this.downloadModal = document.getElementById('downloadModal');
    this.fileNameDisplay = document.getElementById('fileNameDisplay');
    this.downloadBtn = document.getElementById('downloadBtn');
    this.scrollToBottomBtn = document.getElementById('scrollToBottomBtn');

    this.setupEventListeners();
  }

  setupEventListeners() {
    // File selection
    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFileSelection(e.target.files[0]);
      }
    });

    // Drag and drop
    this.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropZone.classList.add('active');
    });

    this.dropZone.addEventListener('dragleave', () => {
      this.dropZone.classList.remove('active');
    });

    this.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropZone.classList.remove('active');
      const files = Array.from(e.dataTransfer.files).filter(file => file.name.endsWith('.docx'));
      if (files.length > 0) {
        this.handleFileSelection(files[0]);
      }
    });

    // Convert button
    this.convertBtn.addEventListener('click', () => {
      this.convertToPdf();
    });

    // Download button
    this.downloadBtn.addEventListener('click', () => {
      if (this.pdfBlob) {
        const url = URL.createObjectURL(this.pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.generateFileName();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.downloadModal.style.display = 'none';
      }
    });

    // Scroll to bottom button
    window.addEventListener('scroll', this.toggleScrollButton.bind(this));
    this.scrollToBottomBtn.addEventListener('click', () => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    });
  }

  handleFileSelection(file) {
    this.docxFile = file;
    this.renderFilePreview(file);
    this.convertBtn.disabled = false;
  }

  renderFilePreview(file) {
    this.filePreview.innerHTML = `
      <div class="file-preview">
        <i class="fas fa-file-word"></i>
        <div class="file-info">
          <p class="file-name">${file.name}</p>
          <p class="file-size">${(file.size / 1024).toFixed(1)} KB</p>
        </div>
      </div>
    `;
  }

  toggleScrollButton() {
    if (window.scrollY > 300) {
      this.scrollToBottomBtn.classList.add('visible');
    } else {
      this.scrollToBottomBtn.classList.remove('visible');
    }
  }

  async function convertToPdf() {
  // Show loading state
  convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
  
  try {
    // Read file as base64
    const reader = new FileReader();
    reader.readAsDataURL(docxFile);
    
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      
      // Call Netlify function
      const response = await fetch('/.netlify/functions/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: base64 })
      });
      
      if (!response.ok) throw new Error('Conversion failed');
      
      const result = await response.json();
      const pdfBlob = base64ToBlob(result.body, 'application/pdf');
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'converted.pdf';
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
    };
    
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    convertBtn.innerHTML = '<i class="fas fa-file-export"></i> Convert to PDF';
  }
}

function base64ToBlob(base64, type) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type });
}