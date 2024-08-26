import WAWebJS from "whatsapp-web.js";

enum ChatState {
  "start",
  "playing",
}
const validCoords = [1, 2, 3];

export default class Chat {
  private state = ChatState.start;
  private board: ("" | "X" | "O")[][] = [
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ];
  private client: WAWebJS.Client;

  public lastReply: Date = new Date();

  constructor(client: WAWebJS.Client) {
    this.client = client;
  }

  private async sendBoard(from: string) {
    await this.client.sendMessage(
      from,
      `
      ${this.board[0][0]} | ${this.board[0][1]} | ${this.board[0][2]}
      -------
      ${this.board[1][0]} | ${this.board[1][1]} | ${this.board[1][2]}
      -------
      ${this.board[2][0]} | ${this.board[2][1]} | ${this.board[2][2]}
      `
    );
  }

  private getResult() {
    // Check rows
    for (let i = 0; i < 3; i++) {
      if (
        this.board[i][0] !== "" &&
        this.board[i][0] === this.board[i][1] &&
        this.board[i][0] === this.board[i][2]
      ) {
        return this.board[i][0];
      }
    }
    // Check columns
    for (let j = 0; j < 3; j++) {
      if (
        this.board[0][j] !== "" &&
        this.board[0][j] === this.board[1][j] &&
        this.board[0][j] === this.board[2][j]
      ) {
        return this.board[0][j];
      }
    }
    // Check diagonals
    if (
      this.board[0][0] !== "" &&
      this.board[0][0] === this.board[1][1] &&
      this.board[0][0] === this.board[2][2]
    ) {
      return this.board[0][0];
    }
    if (
      this.board[0][2] !== "" &&
      this.board[0][2] === this.board[1][1] &&
      this.board[0][2] === this.board[2][0]
    ) {
      return this.board[0][2];
    }

    // Check for draw
    let draw = true;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (this.board[i][j] === "") {
          draw = false;
          break;
        }
      }
    }
    if (draw) {
      return "draw";
    }

    return "";
  }

  public async endGame(from: string, result: "X" | "O" | "draw") {
    if (result === "X") {
      await this.client.sendMessage(from, "Você venceu!");
    } else if (result === "O") {
      await this.client.sendMessage(from, "Eu venci!");
    } else {
      await this.client.sendMessage(from, "Empate!");
    }
  }

  public async reply(message: WAWebJS.Message) {
    this.lastReply = new Date();
    const { from, body } = message;
    if (this.state === ChatState.start) {
      await this.client.sendMessage(
        from,
        "Olá, vamos jogar uma partida de jogo da velha"
      );
      await this.sendBoard(from);
      await this.client.sendMessage(
        from,
        "Você será o jogador 'X'. Digite a linha e coluna que você quer jogar (números de 1 a 3) separadas por espaço(Exemplo: 1 2)"
      );
      this.state = ChatState.playing;
    } else if (this.state === ChatState.playing) {
      const errorMsg =
        "Coordenadas inválidas. Digite a linha e coluna que você quer jogar (números de 1 a 3) separadas por espaço(Exemplo: 1 2)";
      const coordsRegex = /^\d+ \d+$/;
      if (!coordsRegex.test(body)) {
        await this.client.sendMessage(from, errorMsg);
        return false;
      }
      const [line, column] = body.split(" ").map(Number);
      if (!validCoords.includes(line) || !validCoords.includes(column)) {
        await this.client.sendMessage(from, errorMsg);
        return false;
      }

      if (this.board[line - 1][column - 1] === "") {
        this.board[line - 1][column - 1] = "X";
        await this.sendBoard(from);

        let result: "" | "X" | "O" | "draw" = this.getResult();
        if (result !== "") {
          await this.endGame(from, result);
          return true;
        }

        await this.client.sendMessage(from, "Minha vez");
        let randomPosition = [
          Math.floor(Math.random() * 3),
          Math.floor(Math.random() * 3),
        ];
        while (this.board[randomPosition[0]][randomPosition[1]] !== "") {
          randomPosition = [
            Math.floor(Math.random() * 3),
            Math.floor(Math.random() * 3),
          ];
        }
        this.board[randomPosition[0]][randomPosition[1]] = "O";
        await this.sendBoard(from);

        result = this.getResult();
        if (result !== "") {
          await this.endGame(from, result);
          return true;
        }

        await this.client.sendMessage(from, "Sua vez");
      } else {
        await this.client.sendMessage(from, "Essa posição já está ocupada!");
      }
    }

    return false;
  }
}
