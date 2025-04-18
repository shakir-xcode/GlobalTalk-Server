const expressAsyncHandler = require("express-async-handler");
const Message = require("../modals/messageModel");
const User = require("../modals/userModel");
const Chat = require("../modals/chatModel");
const mongoose = require('mongoose');
const { G4F } = require("g4f");

const sendBotMessage = expressAsyncHandler(async (req, res) => {
    const { content, chatId, } = req.body;
    const botID = new mongoose.Types.ObjectId(process.env.BOT_ID);

    if (!content || !chatId) {
        console.log("Invalid data passed into request");
        return res.sendStatus(400);
    }


    let newMessage = {
        sender: botID,
        content: {
            [botID]: content,
        },
        chat: chatId,
    };


    try {
        let message = await Message.create(newMessage);
        message = await message.populate("sender", "name");
        message = await message.populate("chat");
        message = await message.populate("reciever");
        message = await User.populate(message, {
            path: "chat.users",
            select: "name email",
        });
        await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });
        res.json(message);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

const gptCallController = async (req, res) => {
    const g4f = new G4F();
    const messages = [
        { role: "user", content: req.body.query }
    ];
    g4f.chatCompletion(messages).then(data => {
        res.status(200).json({ message: data })
    })
        .catch(err => {
            res.status(400).json({ message: err })
        })

}



const chatbotQueryController = async (req, res) => {
const API_KEY = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
	
	const query = 'provide the response to the query in not more than 100 words: '+req.body.query;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: query
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const msgData = result.candidates[0].content.parts[0].text;
	console.log(msgData)
	res.status(200).json({ message: msgData })
  } catch (error) {
	console.log(error.message)
	res.status(400).json({ message: error })
  }
}


module.exports = { sendBotMessage, chatbotQueryController };
