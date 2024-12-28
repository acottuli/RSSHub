import { Route } from '@/types';
import ofetch from '@/utils/ofetch';
import { load } from 'cheerio';
import logger from '@/utils/logger';

export const route: Route = {
    path: '/news/:org',
    categories: ['traditional-media'],
    example: '/prnewswire/news/abbvie',
    parameters: {
        org: 'Organization name',
    },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: 'PR Newswire search',
    maintainers: ['acottuli'],
    url: 'https://www.prnewswire.com/news',
    handler: async (ctx) => {
        const org = ctx.req.param('org');
        const baseUrl = 'https://www.prnewswire.com/news';

        const url = `${baseUrl}/${encodeURIComponent(org)}/?pagesize=100&page=1`;
        logger.info(`--> GET ${url}`);

        const response = await ofetch(url);
        const $ = load(response);
        const items = $('.newsCards')
            .toArray()
            .map((item) => {
                const title = $(item).find('h3').contents().not('small').text().trim();
                const link = $(item).find('a').attr('href');
                const description = $(item).find('p.remove-outline').text().trim();
                const pubDateString = $(item).find('h3 small').text().trim();
                const pubDate = new Date(pubDateString.slice(0, pubDateString.lastIndexOf(' ')) + ' UTC-05:00'); // Assume date is in EST
                const category = $(item).find('a').attr('aria-label')?.split(',');
                const author = org;

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

        logger.info(`--> GET ${baseUrl}/${org}/?pagesize=100&page=1 returned ${items.length} results`);

        return {
            title: 'PR Newswire search',
            link: 'https://www.prnewswire.com/news',
            item: items,
        };
    },
};
