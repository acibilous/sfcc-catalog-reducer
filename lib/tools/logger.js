import { exec } from 'child_process';

export const beep = () => { 
    exec(`rundll32 user32.dll,MessageBeep`);
}

const color = {
    gray: (message) => `\u001b[90m${message}\x1b[0m`,
}

function formatConsoleDate (date) {
    const fdp = el => ((el < 10) ? '0' + el : el);

    const hour = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    const message = `[${fdp(hour)}:${fdp(minutes)}:${fdp(seconds)}]`;

    return color.gray(message);
}

export const log = (...args) => {
    console.log(formatConsoleDate(new Date()), ...args);
}
