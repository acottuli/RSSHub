import { Route } from '@/types';
import ofetch from '@/utils/ofetch'; // Unified request library used
import { load } from 'cheerio'; // A HTML parser with an API similar to jQuery

export const route: Route = {
    path: '/news-archive',
    categories: ['traditional-media'],
    example: '/novartis/news-archive',
    parameters: {},
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: 'Novartis news archive',
    maintainers: ['acottuli'],
    url: 'https://www.novartis.com/news/news-archive',
    handler: async () => {
        const baseUrl = 'https://www.novartis.com/news/news-archive';
        const response = await ofetch(baseUrl);
        const $ = load(response);

        const items = $('.view-news-archive .each-item a')
            .toArray()
            .map((item) => {
                const title = $(item).find('.views-field-title').text();
                const link = $(item).attr('href') ?? '';
                const description = $(item).find('.views-field-body').text().trim() || $(item).find('.views-field-field-story-intro-text').text().trim();
                const pubDate = $(item).find('.datetime').attr('datetime');
                const category = $(item).find('.views-field-type').text().trim().split(',');

                return {
                    title,
                    link,
                    description,
                    pubDate,
                    category,
                    author: 'Novartis',
                };
            });

        return {
            title: 'Novartis news archive',
            link: 'https://www.novartis.com/news/news-archive',
            item: items,
        };
    },
};
