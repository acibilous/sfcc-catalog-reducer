import { exec } from 'child_process';
import { getHeapUsedMB } from './ram.js';

export const beep = () => {
    // eslint-disable-next-line spellcheck/spell-checker
    exec(`rundll32 user32.dll,MessageBeep`);
}

export const color = {
    gray: (message) => `\u001b[90m${message}\x1b[0m`,
    cyan: (message) => `\x1b[38;5;38m${message}\x1b[0m`,
    green: (message) => `\u001b[32m${message}\x1b[0m`,
}

export const logUsedRAM = () => console.log(`Used approximately ${color.cyan(getHeapUsedMB().toString() + ' MB')} of RAM`);

/**
 * @param {number} el 
 */
const formatSecs = el => ((el < 10) ? '0' + el : el);

/**
 * @param {Date} date 
 */
function formatConsoleDate(date) {
    const hour = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    const message = `[${formatSecs(hour)}:${formatSecs(minutes)}:${formatSecs(seconds)}]`;

    return color.gray(message);
}

/**
 * @param {number} number 
 * @param {number} fixed 
 */
export const formatToFixed = (number, fixed) => {
    var re = new RegExp('^-?\\d+(?:.\\d{0,' + (fixed || -1) + '})?');
    return number.toString().match(re)[0];
}

export const log = (...args) => {
    console.log(formatConsoleDate(new Date()), ...args);
}
