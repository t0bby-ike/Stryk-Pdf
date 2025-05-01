class DocxToPdfConverter {
  constructor() {
    this.docxFile = null;
    this.pdfBlob = null;
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
      const files = Array.from(e.dataTransfer.files).filter(file => 
        file.name.endsWith('.docx') || 
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      if (files.length > 0) {
        this.handleFileSelection(files[0]);
      } else {
        alert('Please upload a .docx file');
      }
    });

    // Convert button
    this.convertBtn.addEventListener('click', () => {
      this.convertToPdf();
    });

    // Download button
    this.downloadBtn.addEventListener('click', () => {
      this.downloadPdf();
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
    // Validate file type
    if (!file.name.endsWith('.docx') && 
        file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      alert('Please upload a valid .docx file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit');
      return;
    }

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
          <p class="file-size">${this.formatFileSize(file.size)}</p>
        </div>
      </div>
    `;
  }

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  toggleScrollButton() {
    if (window.scrollY > 300) {
      this.scrollToBottomBtn.classList.add('visible');
    } else {
      this.scrollToBottomBtn.classList.remove('visible');
    }
  }

  async convertToPdf() {
    if (!this.docxFile) return;

    this.convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
    this.convertBtn.disabled = true;

    try {
      // Read file as base64
      const base64String = await this.readFileAsBase64(this.docxFile);
      
      // Call Netlify function
      const response = await fetch('/.netlify/functions/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: base64String })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Conversion failed');
      }
      
      const result = await response.json();
      
      if (!result.body) {
        throw new Error('No PDF data received from server');
      }
      
      this.pdfBlob = this.base64ToBlob(result.body, 'application/pdf');
      this.fileNameDisplay.textContent = this.generateFileName();
      this.downloadModal.style.display = 'block';
      
    } catch (error) {
      console.error('Conversion error:', error);
      alert('Error converting DOCX to PDF: ' + error.message);
    } finally {
      this.convertBtn.innerHTML = '<i class="fas fa-file-export"></i> Convert to PDF';
      this.convertBtn.disabled = false;
    }
  }

  downloadPdf() {
    if (!this.pdfBlob) return;

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

  readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  base64ToBlob(base64, contentType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  }

  generateFileName() {
    const randomId = Math.random().toString(36).substring(2, 8);
    const originalName = this.docxFile.name.replace(/\.[^/.]+$/, ""); // Remove extension
    return `converted_${originalName}_${randomId}.pdf`;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.docxToPdfConverter = new DocxToPdfConverter();
});