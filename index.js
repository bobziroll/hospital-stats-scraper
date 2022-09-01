// @ts-nocheck
const puppeteer = require("puppeteer")
const { Cluster } = require("puppeteer-cluster")
const fs = require("fs/promises")
const {
    getHospitalUrls,
    getPrimaryData,
    getMeasuresData,
    getExtraData,
} = require("./utils/hospitalStats")
const { db, batchWriteAllDocs } = require("./utils/firebase")

async function main() {
    console.time()
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 100,
    })
    // const browser = await puppeteer.launch()
    // const browser = await puppeteer.launch({
    //     headless: false,
    //     defaultViewport: null,
    //     args: ["--window-size=800,600"],
    // })
    // const page = await browser.newPage()

    // Brings any console logs from a browser context out to the node context
    // page.on("console", async (msg) => {
    //     const msgArgs = msg.args()
    //     for (let i = 0; i < msgArgs.length; ++i) {
    //         console.log(await msgArgs[i].jsonValue())
    //     }
    // })

    const allUrls = await getHospitalUrls()
    const testUrls = allUrls.slice(0, 100)
    // This makes it easy to switch between the test array and the real array
    const urls = allUrls

    let jsonResults = []
    let errors = []

    for (let [i, url] of urls.entries()) {
        try {
            cluster.queue(url, async ({ page, data: url }) => {
                await page.goto(url)
                let mainInfo = await getPrimaryData(page)
                console.log(`#${i + 1} of ${urls.length} - ${mainInfo.name}`)
                let statsInfo = await getMeasuresData(page)
                let extraInfo = await getExtraData(page)

                let data = {
                    id: mainInfo.name.toLowerCase().split(" ").join("-"),
                    ...mainInfo,
                    ...extraInfo,
                    measures: {
                        ...statsInfo,
                    },
                }
                jsonResults.push(data)
            })
        } catch (e) {
            errors.push(e.message)
            console.error(e.message)
            continue
        }
    }
    await cluster.idle()
    console.log(jsonResults)

    await fs.writeFile("data.json", JSON.stringify(jsonResults)) // Not really needed anymore. Maybe as a backup?
    await cluster.close()
    await batchWriteAllDocs(db, jsonResults)
    console.error("Errors: ")
    console.error(errors)
    console.log("✅ Done 💪")
    console.timeEnd()
}

main()
