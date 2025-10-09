// Test the complete analysis endpoint
import http from 'http';
import fs from 'fs';

const testCompleteEndpoint = () => {
  // Create a dummy audio file for testing
  const dummyAudioBuffer = Buffer.from('dummy audio content');

  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const body = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="audio"; filename="test.wav"',
    'Content-Type: audio/wav',
    '',
    'dummy audio content',
    `--${boundary}`,
    'Content-Disposition: form-data; name="sourceLanguage"',
    '',
    'en',
    `--${boundary}`,
    'Content-Disposition: form-data; name="sessionId"',
    '',
    '1',
    `--${boundary}--`
  ].join('\r\n');

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/analysis/complete',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const req = http.request(options, (res) => {
    console.log('Status:', res.statusCode);
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('Response:', parsed);
      } catch (e) {
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Request failed:', e.message);
  });

  req.write(body);
  req.end();
};

testCompleteEndpoint();
