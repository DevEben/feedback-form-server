const Feedback = require('../model/feedbackModel');


const addFeedback = async (req, res) => {
    try {
        const { emoji, feedbackCategory, message } = req.body;
        if (!emoji || !feedbackCategory || !message) {
            return res.status(400).json({
                message: "Please fill out all fields below"
            })
        }

        const feedback = await new Feedback({
            emoji, feedbackCategory, message
        })

        if (!feedback) {
            return res.status(400).json({
                message: "Unable to add feedback!"
            });
        }

        await feedback.save();
        return res.status(200).json({
            message: "Feedback sent successfully! We will work on this, Thanks!"
        });

    } catch (error) {
        return res.status(500).json({
            Error: 'Internal Server Error: ' + error.message,
        })
    }
};


const getAllFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.find().sort({createdAt: -1});
        if (!feedback) {
            return res.status(404).json({
                message: "Feedbacks not found"
            })
        }

        return res.status(200).json({
            message: "Feedback successfully fetched", 
            data: feedback
        });

    } catch (error) {
        return res.status(500).json({
            Error: 'Internal Server Error: ' + error.message,
        })
    }
};


const getAFeedback = async (req, res) => {
    try {
        const id = req.params.id;
        const feedback = await Feedback.findById(id);
        if (!feedback) {
            return res.status(404).json({
                message: "Feedbacks not found"
            })
        }

        return res.status(200).json({
            message: "Feedback successfully fetched", 
            data: feedback
        });

    } catch (error) {
        return res.status(500).json({
            Error: 'Internal Server Error: ' + error.message,
        })
    }
};


const deleteFeedback = async (req, res) => {
    try {
        const id = req.params.id;
        const feedback = await Feedback.findById(id);
        if (!feedback) {
            return res.status(404).json({
                message: "Feedbacks not found"
            })
        }

        const deleteFeedback = await Feedback.findByIdAndDelete(id);
        if (!deleteFeedback) { 
            return res.status(400).json({
                message: "Unable to delete feedback!"
            })
        };

        return res.status(200).json({
            message: "Feedback successfully deleted", 
        });

    } catch (error) {
        return res.status(500).json({
            Error: 'Internal Server Error: ' + error.message,
        })
    }
};



module.exports = {
    addFeedback,
    getAllFeedback,
    getAFeedback,
    deleteFeedback
}