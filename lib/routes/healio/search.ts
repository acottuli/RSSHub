import { Route } from '@/types';
import { load } from 'cheerio';
import logger from '@/utils/logger';
import puppeteer from '@/utils/puppeteer';

export const route: Route = {
    path: '/search/:query/:contenttype?',
    categories: ['traditional-media'],
    example: '/healio/search/osteoarthritis/News',
    parameters: {
        query: 'Search query',
        contenttype: 'Type of content. Default: News. Allowed values: News, Clinical Guidance, ...', // case insensitive
    },
    features: {
        requireConfig: false,
        requirePuppeteer: true,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: 'Healio search',
    maintainers: ['acottuli'],
    url: 'https://www.healio.com/search',
    handler: async (ctx) => {
        const query = ctx.req.param('query');
        const contenttype = ctx.req.param('contenttype') || 'News';
        const baseUrl = 'https://www.healio.com/search';

        // Launch a headless browser using Puppeteer
        const browser = await puppeteer();
        const page = await browser.newPage();

        const url = `${baseUrl}#q=${encodeURIComponent(query)}&sort=%40posteddate%20descending&numberOfResults=100&f:contenttype=[${encodeURIComponent(contenttype)}]`;
        logger.info(`--> GET ${url}`);

        // Go to the page and wait for the search results to load
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Wait for article descriptions to load
        await page.waitForSelector('.card-text');

        // After the page has loaded, get the rendered HTML content
        const response = await page.content();

        // Close the browser
        await browser.close();

        const $ = load(response);
        const items = $('.coveo-result-list-container .coveo-result-frame .article-listing-card')
            .toArray()
            .map((item) => {
                // Example: 'December 29, 2024'
                const pubDateString = $(item).find('.date').text().trim() || '1970-01-01';

                const title = $(item).find('.card-title').find('a').text().trim();
                const link = $(item).find('.card-title').find('a').attr('href');
                const description = $(item).find('.card-body').find('.card-text').text().trim();
                const pubDate = new Date(pubDateString + ' UTC'); // Assume date string is in UTC
                const category = $(item).find('.area').text().split(',');

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
                    author: 'Healio',
                };
            });

        logger.info(`--> GET https://www.healio.com/search query returned ${items.length} results`);

        return {
            title: 'Healio search',
            link: 'https://www.healio.com/search',
            item: items,
        };
    },
};
