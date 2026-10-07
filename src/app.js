const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok' }));
  }
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`<h1>Hello v3 from Jenkins + ArgoCD</h1>
<p>Version: ${process.env.APP_VERSION || 'dev'}</p>
<p>Pod: ${process.env.HOSTNAME}</p>`);
});

module.exports = server;
