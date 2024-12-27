import { Route } from '@/types';
import ofetch from '@/utils/ofetch'; // Unified request library used
import { load } from 'cheerio'; // A HTML parser with an API similar to jQuery

export const route: Route = {
    path: '/quarterly-results',
    categories: ['traditional-media'],
    example: '/novartis/quarterly-results',
    parameters: {},
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: 'Novartis quarterly financial results',
    maintainers: ['acottuli'],
    url: 'https://www.novartis.com/investors/financial-data/quarterly-results',
    handler: async () => {
        const baseUrl = 'https://www.novartis.com/investors/financial-data/quarterly-results';
        const response = await ofetch(baseUrl);
        const $ = load(response);

        // We use a Cheerio selector to select all PDF links.
        const items = $('a[href$=".pdf"]')
            .toArray()
            .map((item) => {
                const link = $(item).attr('href') ?? ''; // Ensure link is never undefined
                const title = link.split('/').pop() ?? ''; // Use the filename as the title

                return {
                    title,
                    link,
                    description: link,
                    pubDate: '2024-01-01',
                    // category: ,
                    // author: ,
                };
            });

        return {
            title: 'Novartis quarterly financial results',
            link: 'https://www.novartis.com/investors/financial-data/quarterly-results',
            item: items,
        };
    },
};
