const express = require('express');

const router = express.Router();

const { addFeedback, getAllFeedback, getAFeedback, deleteFeedback } = require('../controller/feedbackController');


//Endpoint to add feedback to the database
router.post('/feedback', addFeedback);

//Endpoint to view all feedbacks in the database
router.get('/feedback', getAllFeedback);

//Endpoint to view a feedback from the database
router.get('/feedback/:id', getAFeedback);

//Endpoint to delete feedback from the database
router.delete('/feedback/:id', deleteFeedback);


module.exports = router;