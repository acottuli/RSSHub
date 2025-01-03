import { Route } from '@/types';
import { load } from 'cheerio';
import logger from '@/utils/logger';
import puppeteer from '@/utils/puppeteer';

export const route: Route = {
    path: '/company/:companyId',
    categories: ['traditional-media'],
    example: '/ausbiz/company/1',
    parameters: {
        companyId: 'ausbiz company ID',
    },
    features: {
        requireConfig: false,
        requirePuppeteer: true,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: 'ausbiz company videos',
    maintainers: ['acottuli'],
    url: 'https://ausbiz.com.au',
    handler: async (ctx) => {
        const companyId = ctx.req.param('companyId');
        const baseUrl = 'https://ausbiz.com.au';

        // Launch a headless browser using Puppeteer
        const browser = await puppeteer();
        const page = await browser.newPage();

        const url = `${baseUrl}/company/${companyId}`;
        logger.info(`--> GET ${url}`);

        // Go to the page and wait for the list of videos to appear
        await page.goto(url);
        await page.waitForSelector('.tier-listing');
        await page.waitForNetworkIdle();

        // After the page has loaded, get the rendered HTML content
        const response = await page.content();

        // Close the browser
        await browser.close();

        const $ = load(response);
        const items = $('.tier-listing .row > div')
            .toArray()
            .map((item) => {
                const title = $(item).find('.vodInfo > a').text().trim();
                const link = $(item).find('.vodInfo > a').attr('href');
                const description = $(item).find('.vod_com_time > li a').text().trim();
                const pubDateString = $(item).find('.vod_com_time > li:nth-of-type(2)').text().trim(); // '3 Jan 2025'
                const pubDate = new Date(`${pubDateString} UTC+10:00`); // Assume date string is in AEST
                const category = $(item).find('.vod_com_time > li a').text().trim().split(',');
                const author = 'ausbiz';

                logger.debug(
                    JSON.stringify(
                        {
                            title,
                            link,
                            description,
                            pubDateString,
                            pubDate,
                            category,
                            author,
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
                    author,
                };
            });

        logger.info(`--> GET ${url} returned ${items.length} results`);

        return {
            title: 'ausbiz company videos',
            link: 'https://ausbiz.com.au',
            item: items,
        };
    },
};
