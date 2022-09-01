// @ts-nocheck
function chunk(arr, size) {
    const chunkedArr = []
    for (let i = 0; i < arr.length; i += size) {
        chunkedArr.push(arr.slice(i, i + size))
    }
    return chunkedArr
}

function titleCase(str) {
    return str
        .split(" ")
        .map((str) => {
            return str[0].toUpperCase() + str.substring(1).toLowerCase()
        })
        .join(" ")
}

module.exports = {
    titleCase,
    chunk,
}
