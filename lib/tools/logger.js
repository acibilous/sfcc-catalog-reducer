function formatConsoleDate (date) {
    const fdp = el => ((el < 10) ? '0' + el: el)
    let
        hour = date.getHours(),
        minutes = date.getMinutes(),
        seconds = date.getSeconds(),
        milliseconds = ('00' + date.getMilliseconds()).slice(-3);

    return `[${fdp(hour)}:${fdp(minutes)}:${fdp(seconds)}.${milliseconds}]:`
}

module.exports = {
    log: (...args) => {
        console.log(formatConsoleDate(new Date()), ...args);
    }
}