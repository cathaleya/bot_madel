// Helper HTTP Request (JSON API with Auto 301/302 Redirect & SSL Handling)
function sendPostRequest(endpoint, payload, currentBaseUrl = BASE_URL) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, currentBaseUrl);
    const postData = JSON.stringify(payload);

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      rejectUnauthorized: false
    };

    const req = (url.protocol === 'https:' ? https : http).request(options, (res) => {
      // Handle 301 / 302 Redirect (e.g. HTTP to HTTPS)
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        const redirectUrl = res.headers.location;
        const targetBase = redirectUrl.startsWith('http') ? redirectUrl : `${url.protocol}//${url.host}${redirectUrl}`;
        return sendPostRequest(endpoint, payload, targetBase).then(resolve).catch(reject);
      }

      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}
