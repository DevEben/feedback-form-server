require('./dbconfig/dbConfig')
const express = require('express');
const cors = require('cors');
const feedbackRouter = require('./router/feedbackRouter');
const adminRouter = require('./router/userRouter');
require('dotenv').config();

const app = express();

app.use(express.json());

const corsOptions = {
    origin: "*",
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"]
};

// Middleware for CORS
app.use(cors(corsOptions));

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    return res.send(`Welcome to E.Tech Suggestion/Feedback API!`)
});

app.use("/api", adminRouter);
app.use('/api', feedbackRouter);


app.listen(port, () => {
    console.log(`Server is running on port ${port}...`);
});
