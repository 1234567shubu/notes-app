
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const accessTokenTTL = 30 * 1000; // 30 seconds in milliseconds

const generateAccessToken = (user) =>{
    return  jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: accessTokenTTL, algorithm: 'HS256' });
    
}

const generateRandomRefreshToken = () => {
    return crypto.randomBytes(40).toString('hex');
};

const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};
module.exports = {
    generateAccessToken,
    generateRandomRefreshToken,
    hashToken
};