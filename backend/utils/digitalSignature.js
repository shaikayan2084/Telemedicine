const crypto = require('crypto');

const generateDigitalSignature = (data) => {
  const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  const hmac = crypto.createHmac('sha256', process.env.JWT_SECRET || 'default-secret')
    .update(hash)
    .digest('hex');
  return { hash, signature: hmac, algorithm: 'HS256', timestamp: new Date().toISOString() };
};

const verifyDigitalSignature = (data, signature) => {
  const hmac = crypto.createHmac('sha256', process.env.JWT_SECRET || 'default-secret')
    .update(crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'))
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hmac));
};

module.exports = { generateDigitalSignature, verifyDigitalSignature };