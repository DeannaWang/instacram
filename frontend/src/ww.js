/*
  Use Web Worker to notify new feed posts
*/

onmessage = getNew;

async function getNew (e) {
    let fetched = e.data.newest + 1;           // Fetch at least once
    let result = [];                           // Store new posts
    let p = 0;                                 // position to fetch feed
    let newest = e.data.newest;                // update newest

    // Keep fetching one post from feed if there may be more new posts
    while (fetched > e.data.newest) {
        newest = (new Date()).getTime();
        let res = await fetch(`${e.data.url}?p=${p}&n=1`, 
            {method: 'GET', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${e.data.token}`}})
        .then(res => res.json())
        .catch(err => console.warn(`API_ERROR: ${err.message}`));
        p++;
        if (res.posts === undefined || res.posts.length === 0) {
            break;
        }
        else {
            fetched = parseInt(res.posts[0].meta.published * 1000);
            if (parseInt(fetched) > parseInt(e.data.newest)) {
                result.push(res.posts[0]);
            }
            else {
                break;
            }
        }
    }

    // Notify
    postMessage({result: result, newest: newest});
    if (result.length > 0) {
        new Notification(`New information from Instacram for ${e.data.user}`);
    }
}
