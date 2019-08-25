/*
  Use Service Worker to cache data
*/

const CACHE = 'instacram-cache';

this.addEventListener("fetch", function(e) {
    e.respondWith(
        caches.match(e.request).then(response => {

            let fetchRequest = e.request.clone();

            return fetch(fetchRequest).then(fetchResponse => {
                if (!fetchResponse || fetchResponse.status !== 200) {
                    return fetchResponse;
                }

                let responseToCache = fetchResponse.clone();
                caches.open(CACHE).then(cache => {
                    if (e.request.method === 'GET') {
                        cache.put(e.request, responseToCache);
                    }
                });

                return fetchResponse;
            })
            .catch(err => {
                return response;
            });
        })
    );
});