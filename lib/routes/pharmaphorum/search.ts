import { Route } from '@/types';
import ofetch from '@/utils/ofetch';
import { load } from 'cheerio';
import logger from '@/utils/logger';

export const route: Route = {
    path: '/search/:query',
    categories: ['traditional-media'],
    example: '/pharmaphorum/search/osteoarthritis',
    parameters: {
        query: 'Search query',
    },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: 'pharmaphorum search',
    maintainers: ['acottuli'],
    url: 'https://pharmaphorum.com/search',
    handler: async (ctx) => {
        const query = ctx.req.param('query');
        const baseUrl = 'https://pharmaphorum.com/search';

        const url = `${baseUrl}?search_api_fulltext=${encodeURIComponent(query)}&field_categories=All&field_categories_1=All&field_categories_3=All&sort_by=created&sort_order=DESC`;
        logger.info(`--> GET ${url}`);

        const response = await ofetch(url);
        const $ = load(response);
        const items = $('.search-api-body article')
            .toArray()
            .map((item) => {
                const title = $(item).find('.card-body').find('a').text().trim();
                const link = $(item).find('.card-body').find('a').attr('href');
                const description = $(item).find('.card-body').find('.field--search-api-excerpt').text().trim();
                const pubDate = new Date($(item).find('time').attr('datetime') || '1970-01-01');
                const category = $(item).find('.category-label').text().trim().split(',');

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
                    author: 'pharmaphorum',
                };
            });

        logger.info(`--> GET https://pharmaphorum.com/search query returned ${items.length} results`);

        return {
            title: 'pharmaphorum search',
            link: 'https://pharmaphorum.com/search',
            item: items,
        };
    },
};
