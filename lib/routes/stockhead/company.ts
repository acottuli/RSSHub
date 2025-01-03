import { Route } from '@/types';
import ofetch from '@/utils/ofetch';
import { load } from 'cheerio';
import logger from '@/utils/logger';

export const route: Route = {
    path: '/company/:companyId',
    categories: ['traditional-media'],
    example: '/stockhead/company/wildcat-resources-wc8',
    parameters: {
        companyId: 'Stockhead company name and ticker',
    },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: 'Stockhead company related stories',
    maintainers: ['acottuli'],
    url: 'https://stockhead.com.au',
    handler: async (ctx) => {
        const companyId = ctx.req.param('companyId');
        const baseUrl = 'https://stockhead.com.au';

        const url = `${baseUrl}/company/${companyId}/`;
        logger.info(`--> GET ${url}`);

        const response = await ofetch(url);
        const $ = load(response);
        const items = $('.boxes > article')
            .toArray()
            .map((item) => {
                const categoryStr = $(item).find('.category-tag').text().trim();

                const title = $(item).find('.entry-title > a').text().trim();
                const link = $(item).find('.entry-title > a').attr('href');
                const description = `${categoryStr} - ${title}`;
                const pubDate = new Date($(item).find('.entry-date').attr('datetime') || '1970-01-01');
                const category = categoryStr.split(',');
                const author = $(item).find('.author > a').text().trim();

                logger.debug(
                    JSON.stringify(
                        {
                            title,
                            link,
                            description,
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
            title: 'Stockhead company related stories',
            link: 'https://stockhead.com.au',
            item: items,
        };
    },
};
