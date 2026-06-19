module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ status: 'ok', ts: new Date().toISOString(), env: process.env.NODE_ENV || 'development' });
};
