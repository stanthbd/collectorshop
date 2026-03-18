const http = require('http');
const querystring = require('querystring');

const query = `
sum(count_over_time({container=~".*catalog-service.*"} | json | msg="Article created and entering moderation" [2h]))
-
sum(count_over_time({container=~".*catalog-service.*"} | json | msg="Moderation result processed" [2h]))
`;

const qs = querystring.stringify({ query: query });

http.get(`http://localhost:3100/loki/api/v1/query?${qs}`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(JSON.stringify(JSON.parse(data), null, 2));
    });
}).on('error', (err) => console.log('Error:', err.message));
