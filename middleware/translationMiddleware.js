const asyncHandler = require("express-async-handler");
const { translate } = require('@vitalets/google-translate-api');
const { sendMessage } = require("../Controllers/messageControllers");


const translationGuy = asyncHandler(async (req, res, next) => {
    const { content, senderLanguageType, receiverLanguageType, isGroupChat } = req.body;

    if (isGroupChat || (senderLanguageType === receiverLanguageType)) {
        const message = {
            originalMessage: content,
            translatedMessage: content,
            code: 200
        }
        req.message = message;
        return next();
    }

    try {
        const { text } = await translate(content, { to: receiverLanguageType });
        const message = {
            originalMessage: content,
            translatedMessage: text,
            code: 200
        }
        req.message = message;
        next();

    } catch (error) {
        const message = {
            originalMessage: content,
            translatedMessage: content,
            code: 400
        }
        req.message = message;
        next();
    }
})

module.exports = { translationGuy };