import { Route } from '@/types';
import { load } from 'cheerio'; // A HTML parser with an API similar to jQuery
import logger from '@/utils/logger';
import puppeteer from '@/utils/puppeteer';

function toTitleCase(str: string) {
    return str.replaceAll(/\w\S*/g, (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase());
}

export const route: Route = {
    path: '/search/:query/:contenttype?',
    categories: ['traditional-media'],
    example: '/medscape/search/osteoarthritis/News',
    parameters: {
        query: 'Search query',
        contenttype: 'Type of content. Allowed values: News, Perspectives, Journal Articles, Clinical Summary, Blog, Article, ...',
    },
    features: {
        requireConfig: false,
        requirePuppeteer: true,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: 'Medscape search',
    maintainers: ['acottuli'],
    url: 'https://search.medscape.com/search',
    handler: async (ctx) => {
        const query = ctx.req.param('query');
        // Medscape's default behaviour is to wrap
        // the user's search query in double quotes
        const wrappedQuery = `"${query.trim()}"`;
        const contenttype = ctx.req.param('contenttype');
        const params = new URLSearchParams({
            q: wrappedQuery,
            sort: 'pubdate',
        });
        if (contenttype) {
            // contenttype must be an exact match, e.g.
            // "Journal Article" not "journal article",
            // for the search to return any results
            params.set('contenttype', toTitleCase(contenttype));
        }

        const baseUrl = 'https://search.medscape.com/search/';

        // Launch a headless browser using Puppeteer
        const browser = await puppeteer();
        const page = await browser.newPage();

        const url = `${baseUrl}?${params.toString()}`;
        logger.info(`--> GET ${url}`);

        // Go to the page and wait for the search results to load
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // After the page has loaded, get the rendered HTML content
        const response = await page.content();

        // Close the browser
        await browser.close();

        const $ = load(response);
        const items = $('#allSearchResults')
            .find('.searchResult')
            .toArray()
            .map((item) => {
                // Example: 'News, Perspectives, Dec 2, 2024' -> ['News', 'Perspectives', 'Dec 2', '2024']
                const searchResultSources = $(item).find('.searchResultSources').text().trim().split(',');
                // Example: ['News', 'Perspectives', 'Dec 2', '2024'] -> 'Dec 2,2024'
                const pubDateString = searchResultSources.slice(-2).join(',');

                const title = $(item).find('a').text();
                const link = $(item).find('a').attr('href');
                const description = $(item).find('.searchResultTeaser').text();
                const pubDate = new Date(pubDateString + ' UTC'); // Assume date string is in UTC
                // Example: ['News', 'Perspectives', 'Dec 2', '2024'] -> ['News', 'Perspectives']
                const category = searchResultSources.slice(0, -2);

                logger.debug(
                    JSON.stringify(
                        {
                            title,
                            link,
                            description,
                            pubDate,
                            category,
                        },
                        null,
                        2
                    )
                );

                return {
                    title,
                    link,
                    description,
                    pubDate,
                    category,
                    author: 'Medscape',
                };
            });

        logger.info(`--> GET https://search.medscape.com/search/ query returned ${items.length} results`);

        return {
            title: 'Medscape search',
            link: 'https://search.medscape.com/search',
            item: items,
        };
    },
};
