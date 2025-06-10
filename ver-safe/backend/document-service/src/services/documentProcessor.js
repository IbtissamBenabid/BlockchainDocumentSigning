const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const sharp = require('sharp');

/**
 * Document Processing Service
 * Extracts metadata and content from various document types
 */

/**
 * Extract metadata from uploaded document
 * @param {string} filePath - Path to the document file
 * @param {string} mimeType - MIME type of the document
 * @returns {Promise<Object>} Extracted metadata
 */
async function extractDocumentMetadata(filePath, mimeType) {
  try {
    const stats = fs.statSync(filePath);
    const baseMetadata = {
      fileSize: stats.size,
      createdAt: stats.birthtime.toISOString(),
      modifiedAt: stats.mtime.toISOString(),
      mimeType,
      extension: path.extname(filePath).toLowerCase()
    };

    let specificMetadata = {};
    let extractedData = {};

    // Process based on file type
    switch (mimeType) {
      case 'application/pdf':
        specificMetadata = await processPDF(filePath);
        break;
      
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        specificMetadata = await processWordDocument(filePath);
        break;
      
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
        specificMetadata = await processImage(filePath);
        break;
      
      case 'text/plain':
        specificMetadata = await processTextFile(filePath);
        break;
      
      default:
        specificMetadata = await processGenericFile(filePath);
    }

    return {
      ...baseMetadata,
      ...specificMetadata,
      extractedData,
      processingTimestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Document metadata extraction error:', error);
    return {
      fileSize: fs.statSync(filePath).size,
      mimeType,
      extension: path.extname(filePath).toLowerCase(),
      error: error.message,
      processingTimestamp: new Date().toISOString()
    };
  }
}

/**
 * Process PDF documents
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<Object>} PDF metadata
 */
async function processPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    // Extract basic PDF information
    const metadata = {
      pageCount: pdfData.numpages,
      textLength: pdfData.text.length,
      hasText: pdfData.text.length > 0,
      wordCount: pdfData.text.split(/\s+/).filter(word => word.length > 0).length
    };

    // Extract PDF metadata if available
    if (pdfData.info) {
      metadata.pdfInfo = {
        title: pdfData.info.Title || null,
        author: pdfData.info.Author || null,
        subject: pdfData.info.Subject || null,
        creator: pdfData.info.Creator || null,
        producer: pdfData.info.Producer || null,
        creationDate: pdfData.info.CreationDate || null,
        modificationDate: pdfData.info.ModDate || null
      };
    }

    // Simple content analysis
    if (pdfData.text.length > 0) {
      metadata.contentAnalysis = analyzeTextContent(pdfData.text);
    }

    return metadata;

  } catch (error) {
    console.error('PDF processing error:', error);
    return {
      pageCount: null,
      error: 'Failed to process PDF',
      errorDetails: error.message
    };
  }
}

/**
 * Process Word documents
 * @param {string} filePath - Path to Word file
 * @returns {Promise<Object>} Word document metadata
 */
async function processWordDocument(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;

    const metadata = {
      textLength: text.length,
      hasText: text.length > 0,
      wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
      paragraphCount: text.split(/\n\s*\n/).length
    };

    // Content analysis
    if (text.length > 0) {
      metadata.contentAnalysis = analyzeTextContent(text);
    }

    // Check for conversion messages
    if (result.messages && result.messages.length > 0) {
      metadata.conversionMessages = result.messages.map(msg => ({
        type: msg.type,
        message: msg.message
      }));
    }

    return metadata;

  } catch (error) {
    console.error('Word document processing error:', error);
    return {
      error: 'Failed to process Word document',
      errorDetails: error.message
    };
  }
}

/**
 * Process image files
 * @param {string} filePath - Path to image file
 * @returns {Promise<Object>} Image metadata
 */
async function processImage(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      colorSpace: metadata.space,
      channels: metadata.channels,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      hasProfile: metadata.hasProfile,
      isAnimated: metadata.isAnimated || false,
      aspectRatio: metadata.width && metadata.height ? 
        (metadata.width / metadata.height).toFixed(2) : null
    };

  } catch (error) {
    console.error('Image processing error:', error);
    return {
      error: 'Failed to process image',
      errorDetails: error.message
    };
  }
}

/**
 * Process text files
 * @param {string} filePath - Path to text file
 * @returns {Promise<Object>} Text file metadata
 */
async function processTextFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    const metadata = {
      textLength: content.length,
      lineCount: content.split('\n').length,
      wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
      encoding: 'utf8' // Assuming UTF-8 for simplicity
    };

    // Content analysis
    if (content.length > 0) {
      metadata.contentAnalysis = analyzeTextContent(content);
    }

    return metadata;

  } catch (error) {
    console.error('Text file processing error:', error);
    return {
      error: 'Failed to process text file',
      errorDetails: error.message
    };
  }
}

/**
 * Process generic files
 * @param {string} filePath - Path to file
 * @returns {Promise<Object>} Generic file metadata
 */
async function processGenericFile(filePath) {
  try {
    const stats = fs.statSync(filePath);
    
    return {
      isReadable: fs.constants.R_OK,
      isExecutable: (stats.mode & parseInt('111', 8)) !== 0,
      permissions: '0' + (stats.mode & parseInt('777', 8)).toString(8)
    };

  } catch (error) {
    console.error('Generic file processing error:', error);
    return {
      error: 'Failed to process file',
      errorDetails: error.message
    };
  }
}

/**
 * Analyze text content for patterns and characteristics
 * @param {string} text - Text content to analyze
 * @returns {Object} Content analysis results
 */
function analyzeTextContent(text) {
  const analysis = {
    characterCount: text.length,
    wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
    sentenceCount: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
    paragraphCount: text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
  };

  // Language detection (simple heuristic)
  analysis.language = detectLanguage(text);

  // Content type detection
  analysis.contentType = detectContentType(text);

  // Extract potential entities
  analysis.entities = extractEntities(text);

  // Calculate readability metrics
  analysis.readability = calculateReadability(analysis);

  return analysis;
}

/**
 * Simple language detection
 * @param {string} text - Text to analyze
 * @returns {string} Detected language
 */
function detectLanguage(text) {
  // Very basic language detection
  const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  const frenchWords = ['le', 'la', 'les', 'et', 'ou', 'mais', 'dans', 'sur', 'à', 'pour', 'de', 'avec'];
  const spanishWords = ['el', 'la', 'los', 'las', 'y', 'o', 'pero', 'en', 'sobre', 'para', 'de', 'con'];

  const words = text.toLowerCase().split(/\s+/);
  
  const englishCount = words.filter(word => englishWords.includes(word)).length;
  const frenchCount = words.filter(word => frenchWords.includes(word)).length;
  const spanishCount = words.filter(word => spanishWords.includes(word)).length;

  if (englishCount > frenchCount && englishCount > spanishCount) return 'en';
  if (frenchCount > spanishCount) return 'fr';
  if (spanishCount > 0) return 'es';
  
  return 'unknown';
}

/**
 * Detect content type based on patterns
 * @param {string} text - Text to analyze
 * @returns {string} Content type
 */
function detectContentType(text) {
  const lowerText = text.toLowerCase();
  
  // Legal document patterns
  if (lowerText.includes('whereas') || lowerText.includes('hereby') || lowerText.includes('agreement')) {
    return 'legal';
  }
  
  // Financial document patterns
  if (lowerText.includes('invoice') || lowerText.includes('payment') || lowerText.includes('$')) {
    return 'financial';
  }
  
  // Technical document patterns
  if (lowerText.includes('function') || lowerText.includes('algorithm') || lowerText.includes('implementation')) {
    return 'technical';
  }
  
  // Medical document patterns
  if (lowerText.includes('patient') || lowerText.includes('diagnosis') || lowerText.includes('treatment')) {
    return 'medical';
  }
  
  return 'general';
}

/**
 * Extract potential entities from text
 * @param {string} text - Text to analyze
 * @returns {Object} Extracted entities
 */
function extractEntities(text) {
  const entities = {
    emails: [],
    phones: [],
    dates: [],
    numbers: [],
    urls: []
  };

  // Email pattern
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  entities.emails = text.match(emailRegex) || [];

  // Phone pattern (simple)
  const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
  entities.phones = text.match(phoneRegex) || [];

  // Date pattern (simple)
  const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g;
  entities.dates = text.match(dateRegex) || [];

  // URL pattern
  const urlRegex = /https?:\/\/[^\s]+/g;
  entities.urls = text.match(urlRegex) || [];

  // Numbers (currency, percentages, etc.)
  const numberRegex = /\$[\d,]+\.?\d*|\d+%|\b\d+\.\d+\b/g;
  entities.numbers = text.match(numberRegex) || [];

  return entities;
}

/**
 * Calculate basic readability metrics
 * @param {Object} analysis - Text analysis data
 * @returns {Object} Readability metrics
 */
function calculateReadability(analysis) {
  if (analysis.sentenceCount === 0 || analysis.wordCount === 0) {
    return { score: 0, level: 'unknown' };
  }

  // Simple readability score (Flesch-like)
  const avgWordsPerSentence = analysis.wordCount / analysis.sentenceCount;
  const avgCharsPerWord = analysis.characterCount / analysis.wordCount;
  
  // Simplified scoring
  let score = 100 - (avgWordsPerSentence * 1.5) - (avgCharsPerWord * 2);
  score = Math.max(0, Math.min(100, score));

  let level = 'unknown';
  if (score >= 80) level = 'very easy';
  else if (score >= 70) level = 'easy';
  else if (score >= 60) level = 'standard';
  else if (score >= 50) level = 'difficult';
  else level = 'very difficult';

  return {
    score: Math.round(score),
    level,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    avgCharsPerWord: Math.round(avgCharsPerWord * 10) / 10
  };
}

module.exports = {
  extractDocumentMetadata,
  processPDF,
  processWordDocument,
  processImage,
  processTextFile,
  analyzeTextContent
};
