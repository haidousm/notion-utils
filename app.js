/**
 * Renames all pages in a database to use the YYYY-MM-DD format.
 */
const { Client } = require("@notionhq/client");

const notion = new Client({
    auth: process.env.NOTION_CLIENT_TOKEN,
});

const getAllPages = async (databaseId) => {
    const pages = [];
    let cursor = undefined;
    while (true) {
        const response = await notion.databases.query({
            database_id: databaseId,
            start_cursor: cursor,
        });
        pages.push(...response.results);
        if (!response.has_more) {
            break;
        }
        cursor = response.next_cursor;
    }
    return pages;
};

const renamePage = async (pageId, newTitle) => {
    await notion.pages.update({
        page_id: pageId,
        properties: {
            Name: {
                title: [
                    {
                        type: "text",
                        text: {
                            content: newTitle,
                        },
                    },
                ],
            },
        },
    });
};

const main = async (databaseId) => {
    const pages = await getAllPages(databaseId);
    for (const page of pages) {
        const regex = /^(\d{2})-(\d{2})-(\d{2})/;
        const oldTitle = page.properties.Name.title[0].plain_text;
        if (!regex.test(oldTitle)) {
            console.log(`Invalid title: ${oldTitle}`);
            continue;
        }
        const [, month, day, year] = oldTitle.match(regex);
        if (!month || !day || !year) {
            console.log(`Invalid title: ${oldTitle}`);
            continue;
        }
        const newTitle = oldTitle.replace(regex, `20${year}-${month}-${day}`);
        console.log(newTitle);
        await renamePage(page.id, newTitle);
    }
};

if (require.main === module) {
    if (process.argv.length < 3) {
        console.log("Usage: node app.js <database_id>");
        process.exit(1);
    }
    const databaseId = process.argv[2];
    main(databaseId);
}
