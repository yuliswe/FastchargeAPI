import { createInterface } from "readline";

export const print = (message: string) => {
  process.stdout.write(message);
};

export const println = (message: string) => {
  print(message + "\n");
};

export const readline = (prompt: string) =>
  new Promise<string>((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(prompt, (answer) => {
      resolve(answer);
      rl.close();
    });
  });
