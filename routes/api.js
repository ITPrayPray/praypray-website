import express from 'express';
const router = express.Router();

router.get('/temples', (req, res) => {
  const search = req.query.search || '';
  res.json({ message: `Searching for temples with query: ${search}` });
});

export default router;
