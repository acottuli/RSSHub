import { Route } from '@/types';
import ofetch from '@/utils/ofetch';
import { load } from 'cheerio';
import logger from '@/utils/logger';

export const route: Route = {
    path: '/announcements/:ticker',
    categories: ['traditional-media'],
    example: '/hotcopper/announcements/par',
    parameters: {
        ticker: 'ASX ticker code',
    },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: 'HotCopper ASX announcements',
    maintainers: ['acottuli'],
    url: 'https://hotcopper.com.au',
    handler: async (ctx) => {
        const ticker = ctx.req.param('ticker');
        const baseUrl = 'https://hotcopper.com.au';

        const url = `${baseUrl}/asx/${ticker}/announcements/`;
        logger.info(`--> GET ${url}`);

        const response = await ofetch(url);
        const $ = load(response);
        const items = $('.hc-announcement-list table.is-hidden-desktop tr.title-tr')
            .toArray()
            .map((item) => {
                const priceSensitive = $(item).next().find('.price-sensitive-td span').text().trim() || '';

                const title = $(item).find('strong').text().trim();
                const link = $(item).next().find('a[rel="nofollow"]').attr('href');
                const description = `${priceSensitive} - Discussion: ${baseUrl}${$(item).find('td > a').attr('href')}`;
                const pubDateString = $(item).next().find('.stats-td:first').text().trim();
                // Assume date string (i.e. '30/12/24') is in AEST and the year is 20XX
                const pubDate = new Date(`20${pubDateString.split('/')[2]}-${pubDateString.split('/')[1]}-${pubDateString.split('/')[0]} UTC+10:00`);
                const category = priceSensitive.split(',');
                const author = ticker.toUpperCase();

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

        logger.info(`--> GET https://hotcopper.com.au/asx/${ticker}/announcements/ returned ${items.length} results`);

        return {
            title: 'HotCopper ASX announcements',
            link: 'https://hotcopper.com.au',
            item: items,
        };
    },
};
