import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import Chat from "./classes/chat.class";

let chats: { [number: string]: Chat } = {};

// 1 minute
const timeoutTime = 1000 * 60;
function deleteTimeoutChats() {
  const now = new Date();
  for (const number in chats) {
    if (chats[number].lastReply.getTime() + timeoutTime < now.getTime()) {
      client.sendMessage(number, "Estou encerrando a sessão");
      delete chats[number];
    }
  }
}
setInterval(deleteTimeoutChats, timeoutTime / 10);

const client = new Client({
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
  authStrategy: new LocalAuth(),
});

client.on("authenticated", () => {
  console.log("Client is authenticated");
  chats = {};
});

client.on("ready", () => {
  console.log("Client is ready!");
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("message", async (message) => {
  const chat = await message.getChat();
  // ignore group messages
  if (chat.isGroup) return;

  // console.log(message);
  const { from, body } = message;
  if (body === "!start") {
    chats[from] = new Chat(client);
  }

  if (!!chats[from]) {
    const gameEnded = await chats[from].reply(message);
    if (gameEnded) {
      delete chats[from];
    }
  }

  /*
  if (body === "!start" || !!chats[from]) {
    if (!chats[from]) {
      chats[from] = new Chat(client);
    }

    const gameEnded = chats[from].reply(message);
    if (gameEnded) {
      delete chats[from];
    }
  }*/
});

client.initialize();
