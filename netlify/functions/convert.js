const LibreOffice = require('libreoffice-convert');
const fs = require('fs');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const fileBuffer = Buffer.from(body.file, 'base64');
    
    const pdfBuffer = await new Promise((resolve, reject) => {
      LibreOffice.convert(fileBuffer, '.pdf', undefined, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=converted.pdf'
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Conversion failed' })
    };
  }
};
