const expressAsyncHandler = require("express-async-handler");
const Message = require("../modals/messageModel");
const User = require("../modals/userModel");
const Chat = require("../modals/chatModel");
const mongoose = require('mongoose');
const { G4F } = require("g4f");

const sendBotMessage = expressAsyncHandler(async (req, res) => {
    const { content, chatId, } = req.body;
    console.log(chatId)

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
    // console.log('QUERY is = ', req.body.query)
    const messages = [
        { role: "user", content: req.body.query }
    ];
    g4f.chatCompletion(messages).then(data => {
        console.log(data)
        res.status(200).json({ message: data })
    })
        .catch(err => {
            res.status(400).json({ message: err })
        })

}

module.exports = { sendBotMessage, gptCallController };
