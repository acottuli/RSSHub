import { Route } from '@/types';
import ofetch from '@/utils/ofetch';
import { load } from 'cheerio';
import logger from '@/utils/logger';

function toBuggyEncoding(str: string) {
    // Note: GlobeNewswire encodes commas and periods incorrectly.
    // For example, the organization filter
    //    "Biosplice Therapeutics, Inc."
    // is encoded as
    //    "Biosplice%20Therapeutics%CE%B4%20Inc%C2%A7"
    const customCharMap = {
        ',': '%CE%B4', // encode a comma in org name as '%CE%B4'
        '.': '%C2%A7', // encode a period in org name as '%C2%A7'
    };

    return str
        .split('')
        .map((char) =>
            // If there's a custom mapping for a character, use it,
            // otherwise fall back to encodeURIComponent
             customCharMap[char] ?? encodeURIComponent(char)
        )
        .join('');
}

export const route: Route = {
    path: '/search/:org/:keyword?',
    categories: ['traditional-media'],
    example: '/globenewswire/search/all/lorecivivint',
    parameters: {
        org: 'Organization name used to filter search results',
        keyword: 'Keyword used to filter search results',
    },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: 'GlobeNewswire search',
    maintainers: ['acottuli'],
    url: 'https://www.globenewswire.com/en/search',
    handler: async (ctx) => {
        const org = ctx.req.param('org');
        const orgEnc = toBuggyEncoding(org);
        const keyword = ctx.req.param('keyword');
        const keywordEnc = keyword === undefined ? undefined : toBuggyEncoding(keyword);
        const baseUrl = 'https://www.globenewswire.com/en/search';

        const url =
            org === 'all'
                ? keyword
                    ? `${baseUrl}/keyword/${keywordEnc}?page=1&pageSize=50`
                    : `${baseUrl}?page=1&pageSize=50`
                : keyword
                  ? `${baseUrl}/organization/${orgEnc}/keyword/${keywordEnc}?page=1&pageSize=50`
                  : `${baseUrl}/organization/${orgEnc}?page=1&pageSize=50`;
        logger.info(`--> GET ${url}`);

        const response = await ofetch(url);
        const $ = load(response);
        const items = $('[data-section="article-details"]')
            .toArray()
            .map((item) => {
                const title = $(item).find('[data-section="article-url"]').text().trim();
                const link = $(item).find('[data-section="article-url"]').attr('href');
                const description = $(item).find('[data-section="article-summary"]').text().trim();
                const pubDateString = $(item).find('[data-section="article-published-date"]').text().trim();
                const pubDate = new Date(pubDateString.slice(0, pubDateString.lastIndexOf(' ')) + ' UTC-05:00'); // Assume date is in EST
                const author = $(item).find('[data-section="organization-name"]').text().trim();

                logger.debug(
                    JSON.stringify(
                        {
                            title,
                            link,
                            description,
                            pubDate,
                            // category,
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
                    // category,
                    author,
                };
            });

        logger.info(`--> GET https://www.globenewswire.com/en/search/ query returned ${items.length} results`);

        return {
            title: 'GlobeNewswire search',
            link: 'https://www.globenewswire.com/en/search',
            item: items,
        };
    },
};
