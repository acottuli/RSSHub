import { Route } from '@/types';
import ofetch from '@/utils/ofetch'; // Unified request library used
import { load } from 'cheerio'; // A HTML parser with an API similar to jQuery
import { parseDate } from '@/utils/parse-date';

export const route: Route = {
    path: '/press',
    categories: ['traditional-media'],
    example: '/grunenthal/press',
    parameters: {},
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: 'Grünenthal Press Releases',
    maintainers: ['acottuli'],
    url: 'https://www.grunenthal.com/en/press-room/press-releases',
    handler: async () => {
        const baseUrl = 'https://www.grunenthal.com/en/press-room/press-releases';
        const response = await ofetch(baseUrl);
        const $ = load(response);

        // We use a Cheerio selector to select all elements with the class name 'pressReleaseListItem'.
        const items = $('.pressReleaseListItem')
            // We use the `toArray()` method to retrieve all the DOM elements selected as an array.
            .toArray()
            // We use the `map()` method to traverse the array and parse the data we need from each element.
            .map((item) => {
                const nonEmptyParagraphs = $(item)
                    .find('p')
                    .filter(function () {
                        return $(this).text().trim().length > 0;
                    });

                // console.log(nonEmptyParagraphs.text());

                return {
                    title: $(item).find('h2').text(),
                    link: $(item).find('a').first().attr('href'),
                    description: nonEmptyParagraphs.last().text(),
                    pubDate: parseDate($(item).find('p:nth-of-type(1)').text()),
                    // category: ,
                    // author: ,
                };
            });

        return {
            title: `Grünenthal Press Releases`,
            link: `https://www.grunenthal.com/en/press-room/press-releases`,
            item: items,
        };
    },
};
