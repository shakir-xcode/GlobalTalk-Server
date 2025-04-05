const express = require("express");
const upload = require('../middleware/upload');

const {
  allMessages,
  sendMessage,
  mediaMessage,
} = require("../Controllers/messageControllers");
const { sendBotMessage } = require('../Controllers/botMessageController');
const { chatbotQueryController } = require('../Controllers/botMessageController');
const { protect } = require("../middleware/authMiddleware");
const { downloadController } = require("../middleware/downloader");
const { translationGuy } = require("../middleware/translationMiddleware");


const router = express.Router();

router.route("/:chatId").get(protect, allMessages);
router.route("/botMessage").post(sendBotMessage);
router.route("/").post(protect, translationGuy, sendMessage);
router.route("/uploads").post(protect, upload.single('file'), mediaMessage);
router.route("/download/:filename").get(downloadController);
router.route("/gptCall").post(chatbotQueryController);


module.exports = router;
