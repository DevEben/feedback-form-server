const AdminModel = require("../model/adminModel");
const { validateUser, validateUserLogin, } = require("../middleware/validator");
const bcrypt = require("bcrypt");
const sendMail = require("../utils/email");
const jwt = require('jsonwebtoken');
const { generateDynamicEmail } = require("../utils/emailText");
const { resetFunc } = require('../utils/forgot');
const resetHTML = require('../utils/resetHTML');
require('dotenv').config();



//Function to register a new user
const signUp = async (req, res) => {
    try {
        const { error } = validateUser(req.body);
        if (error) {
            return res.status(500).json({
                message: error.details[0].message
            })
        } else {
            const toTitleCase = (inputText) => {
                let word = inputText.toLowerCase()
                let firstWord = word.charAt(0).toUpperCase()

                return firstWord + (word.slice(1))
            }
            const newCode = "1221"
            const userData = {
                username: req.body.username,
                email: req.body.email,
                password: req.body.password,
                code: req.body.code,
            }

            const emailExists = await AdminModel.findOne({ email: userData.email });
            if (emailExists) {
                return res.status(200).json({
                    message: 'Email already exists',
                })
            }

            if (userData.code !== newCode) {
                return res.status(400).json({
                    message: "Invalid admin code!",
                });
            }
            const salt = bcrypt.genSaltSync(12)
            const hashpassword = bcrypt.hashSync(userData.password, salt);

            const user = await new AdminModel({
                username: toTitleCase(userData.username),
                email: userData.email,
                password: hashpassword,
                code: newCode
            });
            if (!user) {
                return res.status(404).json({
                    message: 'User not found',
                })
            }
            const token = jwt.sign({
                username: user.username,
                email: user.email,
            }, process.env.SECRET, { expiresIn: "300s" });

            user.token = token;
            const subject = 'Email Verification'
            const link = `${req.protocol}://${req.get('host')}/api/verify/${user.id}/${user.token}`

            const html = generateDynamicEmail(user.username, link)
            sendMail({
                email: user.email,
                html,
                subject
            })
            await user.save()

            return res.status(200).json({
                message: 'User profile created successfully \nPlease check your mail to verify your account',
                data: user,
            })

        }
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error: " + error.message,
        })
    }
};



//Function to verify a new user with a link
const verify = async (req, res) => {
    try {
        const id = req.params.id;
        const token = req.params.token;
        const user = await AdminModel.findById(id);

        // Verify the token
        jwt.verify(token, process.env.SECRET);

        // Update the user if verification is successful
        const updatedUser = await AdminModel.findByIdAndUpdate(id, { isVerified: true }, { new: true });
        res.status(200).send("<h4>You have been successfully verified. Kindly visit the login page.</h4> <script>setTimeout(() => { window.location.href = '/api/v1/login'; }, 5000);</script>");
        return;

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            // Handle token expiration
            const id = req.params.id;
            const updatedUser = await AdminModel.findById(id);
            //const { firstName, lastName, email } = updatedUser;
            const newtoken = jwt.sign({ email: updatedUser.email, username: updatedUser.username }, process.env.SECRET, { expiresIn: "300s" });
            updatedUser.token = newtoken;
            updatedUser.save();

            const link = `${req.protocol}://${req.get('host')}/api/v1/verify/${id}/${updatedUser.token}`;
            sendMail({
                email: updatedUser.email,
                html: generateDynamicEmail(updatedUser.username, link),
                subject: "RE-VERIFY YOUR ACCOUNT"
            });
            res.status(401).send("<h4>This link is expired. Kindly check your email for another email to verify.</h4><script>setTimeout(() => { window.location.href = '/api/v1/login'; }, 5000);</script>");
            return;
        } else {
            return res.status(500).json({
                message: "Internal server error: " + error.message,
            });
        }
    }
};


//Function to login a verified user
const logIn = async (req, res) => {
    try {
        const { error } = validateUserLogin(req.body);
        if (error) {
            return res.status(500).json({
                message: error.details[0].message
            })
        } else {
            const { email, password } = req.body;
            const checkEmail = await AdminModel.findOne({ email: email.toLowerCase() });
            if (!checkEmail) {
                return res.status(404).json({
                    message: 'User not registered'
                });
            }
            const checkPassword = bcrypt.compareSync(password, checkEmail.password);
            if (!checkPassword) {
                return res.status(404).json({
                    message: "Password is incorrect"
                })
            }
            const token = jwt.sign({
                userId: checkEmail._id,
            }, process.env.SECRET, { expiresIn: "5h" });

            checkEmail.token = token;
            await checkEmail.save();

            if (checkEmail.isVerified === true) {
                return res.status(200).json({
                    message: "Login Successfully! Welcome " + checkEmail.username,
                    token: token
                })
            } else {
                return res.status(400).json({
                    message: "Sorry user not verified yet. Check your mail to verify your account!"
                })
            }
        }

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error: " + error.message,
        });
    }
};


//Function for the user incase password is forgotten
const forgotPassword = async (req, res) => {
    try {
        const checkUser = await AdminModel.findOne({ email: req.body.email });
        if (!checkUser) {
            return res.status(404).json({
                message: 'Email does not exist'
            });
        }
        else {
            const subject = 'Kindly reset your password'
            const link = `${req.protocol}://${req.get('host')}/api/v1/reset/${checkUser.id}`
            const html = resetFunc(checkUser.firstName, link)
            sendMail({
                email: checkUser.email,
                html,
                subject
            })
            return res.status(200).json({
                message: "Kindly check your email to reset your password",
            })
        }
    } catch (error) {
        return res.status(500).json({
            message: 'Internal Server Error: ' + error.message,
        })
    }
};

//Funtion to send the reset Password page to the server
const resetPasswordPage = async (req, res) => {
    try {
        const userId = req.params.userId;
        const resetPage = resetHTML(userId);

        // Send the HTML page as a response to the user
        res.send(resetPage);
    } catch (error) {
        return res.status(500).json({
            message: 'Internal Server Error: ' + error.message,
        });
    }
};



//Function to reset the user password
const resetPassword = async (req, res) => {
    try {
        const userId = req.params.userId;
        const password = req.body.password;

        if (!password) {
            return res.status(400).json({
                message: "Password cannot be empty",
            });
        }

        const salt = bcrypt.genSaltSync(12);
        const hashPassword = bcrypt.hashSync(password, salt);

        const reset = await AdminModel.findByIdAndUpdate(userId, { password: hashPassword }, { new: true });
        return res.status(200).json({
            message: "Password reset successfully",
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Internal Server Error: ' + error.message,
        })
    }
};



//Function to signOut a user
const signOut = async (req, res) => {
    try {
        const userId = req.user.userId
        const newUser = await AdminModel.findById(userId)
        if (!newUser) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        newUser.token = null;
        await newUser.save();
        return res.status(201).json({
            message: `user has been signed out successfully`
        })
    }
    catch (error) {
        return res.status(500).json({
            message: 'Internal Server Error: ' + error.message,
        })
    }
}




module.exports = {
    signUp,
    verify,
    logIn,
    forgotPassword,
    resetPasswordPage,
    resetPassword,
    signOut,
}