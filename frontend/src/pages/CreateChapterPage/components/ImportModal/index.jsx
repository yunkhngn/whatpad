import { useState, useRef } from 'react';
import { Modal, Button } from 'react-bootstrap';
import styles from './ImportModal.module.css';

const ImportModal = ({ show, onHide, onImport }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'text/plain',
      'application/rtf'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, Word document (.doc, .docx), TXT, or RTF file.');
      return;
    }

    setSelectedFile(file);
  };

  const extractTextFromFile = async (file) => {
    setIsProcessing(true);

    try {
      if (file.type === 'text/plain') {
        // Handle TXT files
        const text = await file.text();
        return text;
      } else if (file.type === 'application/pdf') {
        // Handle PDF files using pdf.js
        const arrayBuffer = await file.arrayBuffer();
        const pdfData = new Uint8Array(arrayBuffer);
        
        // Load PDF.js library dynamically
        const pdfjsLib = window.pdfjsLib;
        if (!pdfjsLib) {
          throw new Error('PDF.js library not loaded. Please refresh the page.');
        }

        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n\n';
        }

        return fullText;
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword'
      ) {
        // Handle Word documents using mammoth.js
        const arrayBuffer = await file.arrayBuffer();
        
        // Load mammoth.js library dynamically
        const mammoth = window.mammoth;
        if (!mammoth) {
          throw new Error('Mammoth.js library not loaded. Please refresh the page.');
        }

        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
      } else {
        throw new Error('Unsupported file type');
      }
    } catch (error) {
      console.error('Error extracting text:', error);
      alert(`Error reading file: ${error.message}`);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert('Please select a file first.');
      return;
    }

    const extractedText = await extractTextFromFile(selectedFile);
    
    if (extractedText) {
      onImport(extractedText);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setIsDragging(false);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Import Document</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div
          className={`${styles.dropZone} ${isDragging ? styles.dragging : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.rtf"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <div className={styles.dropZoneContent}>
            <i className="bi bi-cloud-upload" style={{ fontSize: '3rem', color: '#f26500' }}></i>
            <p className={styles.dropZoneText}>
              {selectedFile ? (
                <>
                  <i className="bi bi-file-earmark-text me-2"></i>
                  <strong>{selectedFile.name}</strong>
                </>
              ) : (
                <>
                  <strong>Click to browse</strong> or drag and drop your file here
                </>
              )}
            </p>
            <p className={styles.dropZoneSubtext}>
              Supported formats: PDF, Word (.doc, .docx), TXT, RTF
            </p>
          </div>
        </div>

        {selectedFile && (
          <div className={styles.fileInfo}>
            <p><strong>File:</strong> {selectedFile.name}</p>
            <p><strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
            <p><strong>Type:</strong> {selectedFile.type || 'Unknown'}</p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={isProcessing}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleImport} 
          disabled={!selectedFile || isProcessing}
          style={{ backgroundColor: '#f26500', borderColor: '#f26500' }}
        >
          {isProcessing ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Processing...
            </>
          ) : (
            'Import'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImportModal;
