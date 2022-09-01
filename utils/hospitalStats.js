// @ts-nocheck
const axios = require("axios")

async function getHospitalCount() {
    let totalCount = (
        await axios.get(
            "https://ratings.leapfroggroup.org/rest/leapfrog/procedure/search/count?category=678"
        )
    ).data.resultCount
    return totalCount
}

async function getHospitalUrls() {
    let totalCount = await getHospitalCount()

    // The API sends a max of 100 results
    let increment = 100

    let promises = []
    for (let i = 0; i < totalCount; i += increment) {
        promises.push(
            axios.get(
                `https://ratings.leapfroggroup.org/rest/search/results?procedure=678&by=procedure&sort=facility&showdeclined=0&from=${i}&size=${increment}`
            )
        )
    }
    let markupResults = (await Promise.all(promises))
        .map((response) => response.data.markup)
        .join("\n") // Puts all 17 arrays into a single string
        .split("\n") // Splits them again into many arrays but without the \n
        .filter((str) => str.match(/(https?:\/\/[^ ]*)/)) // Get rid of any strings that don't have a URL in them
        .map((str) => str.match(/(https?:\/\/[^ ]*)/)[0]) // Grab only the URL portion of each string in the array
        .map((str) => str.trim()) // There's tons of whitespace from the markup, so this strips it out
        // Add on the query that automatically expands the maternity care stats and puts it at the top of the list
        .map(
            (str) =>
                str +
                "#return:procedure=678&by=procedure&sort=facility&showdeclined=0"
        )
    return markupResults
}

async function getPrimaryData(page) {
    return await page.$eval(".details-col", (el) => {
        function titleCase(str) {
            // console.log(str)
            return str
                .replace(/\s+/g, " ") // Remove any multiple spaces in the string
                .trim()
                .split(" ")
                .map((str) => {
                    return str[0].toUpperCase() + str.substring(1).toLowerCase()
                })
                .join(" ")
        }
        let info = {}
        info.name = el.querySelector("h1")?.textContent || null
        let addressInfo = el
            .querySelector(".facility-address")
            ?.textContent.split("\n")
            .map((str) => str.trim())
            .filter((str) => !!str)

        if (addressInfo[1].split(", ").length > 2) {
            throw new Error(`Skipping ${info.name} due to irregular address`)
        }
        let address = addressInfo.reduce((prev, curr, i) => {
            if (i === 0) {
                prev.street = titleCase(curr)
            } else {
                let split = curr.split(", ")
                prev.city = titleCase(split[0])
                let stateZip = split[1].split(" ")
                let zip = stateZip[stateZip.length - 1]
                stateZip.pop()
                let state = stateZip.join(" ")
                prev.state = titleCase(state)
                prev.zip = zip
            }
            return prev
        }, {})
        info.address = address
        info.surveySubmitDate = el.querySelector(
            ".suvey-submitted-date-value"
        ).textContent
        return info
    })
}

async function getMeasuresData(page) {
    return await page.$eval("table.measures-table", (el) => {
        let info = {}
        let rows = Array.from(el.querySelectorAll("tr"))
        rows.shift() // Remove the header row
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i]
            let procedureName = row.querySelector(".name")?.textContent
            if (!row.className) {
                info[procedureName] = null
                continue
            }
            if (row.classList.contains("with-more-info")) {
                let infoRow = rows[i + 1]
                if (infoRow.classList.contains("more-info-row")) {
                    if (procedureName === "High-Risk Deliveries") {
                        let stat =
                            infoRow.querySelector(
                                "div.more-info-panel-body > table > tbody > tr > td:nth-child(1)"
                            )?.textContent || null
                        info[procedureName] = stat
                        i += 3 // Skip next 3 unrelated table rows
                        continue
                    }
                    let stat =
                        infoRow.querySelector(
                            "div.more-info-panel-body > p > strong"
                        )?.textContent || null
                    info[procedureName] = stat
                }
                i++ // Skips the more-info-row because we already snagged the data from it above
            }
        }
        return info
    })
}

async function getExtraData(page) {
    return await page.$eval("#MapDemographicsHolder", (el) => {
        let info = {}
        info.websiteUrl = el.querySelector(
            "div > table > tbody > tr:nth-child(2) > td:nth-child(2) > a"
        ).href
        info.mapUrl = el.querySelector(
            "div > table > tbody > tr:nth-child(1) > td:nth-child(2) > a"
        ).href

        return info
    })
}

module.exports = {
    getHospitalCount,
    getHospitalUrls,
    getPrimaryData,
    getMeasuresData,
    getExtraData,
}
