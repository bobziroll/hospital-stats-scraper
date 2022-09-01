// @ts-nocheck
const puppeteer = require("puppeteer")
const fs = require("fs/promises")
const {
    getHospitalUrls,
    getPrimaryData,
    getMeasuresData,
    getExtraData,
} = require("./utils")

async function main() {
    console.time()
    const browser = await puppeteer.launch()
    // const browser = await puppeteer.launch({
    //     headless: false,
    //     defaultViewport: null,
    //     args: ["--window-size=800,600"],
    // })
    const allUrls = await getHospitalUrls()
    // const testArr = allUrls.slice(0, 10)
    const page = await browser.newPage()

    let jsonResults = []
    for (let [i, url] of allUrls.entries()) {
        await page.goto(url)
        let mainInfo = await getPrimaryData(page)
        console.log(`#${i + 1} of ${allUrls.length} - ${mainInfo.name}`)
        let statsInfo = await getMeasuresData(page)
        let extraInfo = await getExtraData(page)

        let data = {
            id: i,
            ...mainInfo,
            ...extraInfo,
            measures: {
                ...statsInfo,
            },
        }
        jsonResults.push(data)
    }
    console.log(jsonResults)
    await fs.writeFile("data.json", JSON.stringify(jsonResults))
    console.timeEnd()
    await browser.close()
}

main()
