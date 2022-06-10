import { exec } from 'child_process';
import { getHeapUsedMB } from './ram.js';

export const beep = () => { 
    exec(`rundll32 user32.dll,MessageBeep`);
}

export const color = {
    gray: (message) => `\u001b[90m${message}\x1b[0m`,
    cyan: (message) => `\x1b[38;5;38m${message}\x1b[0m`,
    green: (message) => `\u001b[32m${message}\x1b[0m`,
}

export const logUsedRAM = () => console.log(`Used approximately ${color.cyan(getHeapUsedMB().toString() + ' MB')} of RAM`);

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
