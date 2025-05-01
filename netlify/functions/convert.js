const LibreOffice = require('libreoffice-convert');
const { promisify } = require('util');
const libreofficeConvert = promisify(LibreOffice.convert);

exports.handler = async (event) => {
  // Check for POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    
    if (!body.file) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No file provided' })
      };
    }

    const fileBuffer = Buffer.from(body.file, 'base64');
    
    // Validate file size (10MB limit)
    if (fileBuffer.length > 10 * 1024 * 1024) {
      return {
        statusCode: 413,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'File size exceeds 10MB limit' })
      };
    }

    // Convert DOCX to PDF
    const pdfBuffer = await libreofficeConvert(fileBuffer, '.pdf');
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        body: pdfBuffer.toString('base64')
      })
    };
  } catch (error) {
    console.error('Conversion error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Conversion failed',
        message: error.message 
      })
    };
  }
};
