const crypto = require('crypto');

const algorithm = 'aes-256-cbc'; 
const secretKey = process.env.AES_KEY;
const ivLength = 16; 

const encrypt = (text) => {
    const iv = crypto.randomBytes(ivLength); 
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return `${iv.toString('hex')}_${encrypted.toString('hex')}`; 
};

// Decrypt function
const decrypt = (encryptedText) => {
    const [iv, encrypted] = encryptedText.split('_');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), Buffer.from(iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, 'hex')), decipher.final()]);
    return decrypted.toString();
};

module.exports = {
    encrypt,
    decrypt
};