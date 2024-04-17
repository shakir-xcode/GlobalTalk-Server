
const downloadController = (req, res, next) => {
    const filename = req.params.filename;
    // return res.send('FILENAME IS ' + filename)
    const filePath = 'D:/Dev/New folder/LiveChatApp_PB - Copy/live-chat-server/uploads/images/' + filename;
    // Set the headers for the response
    res.setHeader('Content-Disposition', 'attachment; filename=your-file.txt');
    res.setHeader('Content-Type', 'text/plain');

    // Send the file as the response
    res.sendFile(filePath);
}

module.exports.downloadController = downloadController;