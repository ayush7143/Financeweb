require('dotenv').config();

module.exports = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },
  mongo: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/financeweb'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '24h'
  },
  port: process.env.PORT || 5000
}; 