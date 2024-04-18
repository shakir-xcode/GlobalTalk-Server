const express = require("express");
const dotenv = require("dotenv");
const path = require('path');
const { default: mongoose } = require("mongoose");
const { createServer } = require('node:http');
const { Server } = require("socket.io");
const cors = require("cors");
const userRoutes = require("./Routes/userRoutes");
const chatRoutes = require("./Routes/chatRoutes");
const messageRoutes = require("./Routes/messageRoutes");
const { createChatbotUser } = require("./Controllers/userController");

const app = express();
const server = createServer(app);

app.use(
	cors({
		origin: "*",
	})
);
dotenv.config();

app.use(express.json());

const pathTemp = path.join(__dirname, 'uploads')  //serving static files'

app.use(express.static(pathTemp));

const connectDb = async () => {
	try {
		const connect = await mongoose.connect(process.env.MONGO_URI);
		console.log("connected to Database");
		createChatbotUser()
	} catch (err) {
		console.log("Server is NOT connected to Database", err.message);
	}
};
connectDb();

app.get("/", (req, res) => {
	res.send("server running ");
});

app.use("/user", userRoutes);
app.use("/chat", chatRoutes);
app.use("/message", messageRoutes);

const io = new Server(server, {
	cors: {
		origin: "*",
	},
	pingTimeout: 60000,
})

let ROOM_ID;
io.on("connection", (socket) => {
	socket.on("setup", (user) => {
		socket.join(user.data._id);
		socket.emit("connected");
	});

	socket.on("join chat", (room) => {
		ROOM_ID = room;
		socket.join(room);
	});

	socket.on("new message", (newMessageStatus) => {
		let chat = newMessageStatus.chat;
		if (!chat.users) return console.log("chat.users not defined");

		chat.users.forEach(user => {
			if (!(user._id === newMessageStatus.sender._id)) {
				socket.in(user._id).emit("message received", newMessageStatus);
			}
		})
	})

	// -------------- For webRTC -----------------
	socket.on("user:call", ({ offer, CALL_TYPE }) => {
		socket.to(ROOM_ID).emit("incomming:call", { offer, callType: CALL_TYPE });

	});

	socket.on("call:accepted", ({ ans }) => {
		socket.to(ROOM_ID).emit("call:accepted", { ans });
	});

	socket.on("peer:nego:needed", ({ offer }) => {
		socket.to(ROOM_ID).emit("peer:nego:needed", { offer });
	});

	socket.on("peer:nego:done", ({ ans }) => {
		socket.to(ROOM_ID).emit("peer:nego:final", { ans });
	});

	socket.on("end:call", () => {
		socket.to(ROOM_ID).emit("end:call")
	})

	socket.on("screen:received", () => {
		socket.to(ROOM_ID).emit("screen:received")
	})
})

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
	console.log(`Server is Running, ${PORT} ...`)
});

