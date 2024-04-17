const generateToken = require("../Config/generateToken");
const mongoose = require('mongoose');
const Chat = require("../modals/chatModel");
const UserModel = require("../modals/userModel");
const expressAsyncHandler = require("express-async-handler");
const chatbotUser = require('../Config/appData');

const createChatbotEntry = async (userId) => {
  const botId = new mongoose.Types.ObjectId(process.env.BOT_ID)
  const botChat = {
    chatName: 'chatbot',
    // isGroupChat: false,
    isChatbot: true,
    users: [userId, botId],
  }
  try {
    await Chat.create(botChat)
    console.log("Chatbot chat created");

  } catch (error) {
    console.log("Failed to initialize chatbot chat ", error);
  }

}

const createChatbotUser = async () => {
  const { name, languageName, languageType } = chatbotUser;
  const _id = new mongoose.Types.ObjectId(process.env.BOT_ID)

  try {
    const userExist = await UserModel.findOne({ _id });
    if (userExist)
      return;
    const chatbotUser = await UserModel.create({ _id, name, email: "", password: "", languageType, languageName });
  } catch (error) {
    console.error('failed to create chatbot user', error)
  }
}

// Login
const loginController = expressAsyncHandler(async (req, res) => {

  const { name, password } = req.body;

  const user = await UserModel.findOne({ name });

  if (user && (await user.matchPassword(password))) {
    const response = {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      languageType: user.ISOCode,
      languageName: user.languageName,
      token: generateToken(user._id),
    };
    res.json(response);
  } else {
    return res.status(401).json({ message: 'Invalid UserName or Password' });
  }
});

// Registration
const registerController = expressAsyncHandler(async (req, res) => {
  // console.log('Registration _________________________')
  const { name, email, password, userLanguage } = req.body;

  // check for all fields
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Invalid input' })
    // throw Error("All necessary input fields have not been filled");
  }

  // pre-existing user
  const userExist = await UserModel.findOne({ email });
  if (userExist) {
    return res.status(405).json({ message: 'User already Exists' });
    // throw new Error("User already Exists");
  }

  // userName already Taken
  const userNameExist = await UserModel.findOne({ name });
  if (userNameExist) {
    return res.status(406).json({ message: "UserName already taken" });
  }

  // create an entry in the db
  const user = await UserModel.create({ name, email, password, languageType: userLanguage.ISOCode || 'en', languageName: userLanguage.name || 'English' });
  if (user) {
    createChatbotEntry(user._id);
    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      languageType: user.languageType,
      languageName: user.languageName,
      token: generateToken(user._id),
    });
  } else {
    return res.status(400).json({ message: "Registration Error" });
  }
});

const fetchAllUsersController = expressAsyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
      $or: [
        { name: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ],
    }
    : {};

  const users = await UserModel.find(keyword).find({
    // _id: { $ne: req.user._id },
    $and: [
      { _id: { $ne: req.user._id }, },
      { name: { $ne: 'chatbot' }, }
    ]
  });
  res.json(users);
});

module.exports = {
  loginController,
  registerController,
  fetchAllUsersController,
  createChatbotUser,
};
