function formatConsoleDate (date) {
    const fdp = el => ((el < 10) ? '0' + el : el);

    const hour = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const milliseconds = ('00' + date.getMilliseconds()).slice(-3);

    return `[${fdp(hour)}:${fdp(minutes)}:${fdp(seconds)}.${milliseconds}]:`;
}

module.exports = {
    log: (...args) => {
        console.log(formatConsoleDate(new Date()), ...args);
    }
};
