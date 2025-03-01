import express from 'express';
const router = express.Router();

router.get('/listings', (req, res) => {
  const search = req.query.search || '';
  res.json({ message: `Searching for listings with query: ${search}` });
});

export default router;
