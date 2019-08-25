// change this when you integrate with the real API, or when u start using the dev server
import { hasToken, clearToken } from './auth.js';
export const API_URL = 'http://localhost:5000';
const user_url = '/user/';
const post_url = '/post/';

// For GET method and POST method
const getJSON = (path, options) => 
    fetch(path, options)
        .then(res => {
            if (res.status === 401 && hasToken()) {
                clearToken();
                location.replace(location.pathname);
                document.getElementById('search-bar').style.display='none';
                document.getElementById('nav').style.display='none';
            }
            return res.json()
        })
        .catch(err => console.warn(`API_ERROR: ${err.message}`));

// For other methods
const getStatus = (path, options) => 
    fetch(path, options)
        .then(res => res.status)
        .catch(err => console.warn(`API_ERROR: ${err.message}`));

/**
 * This is a sample class API which you may base your code on.
 * You don't have to do this as a class.
 */
export default class API {

    /**
     * Defaults to teh API URL
     * @param {string} url 
     */
    constructor(url = API_URL) {
        this.url = url;
    } 

    makeAPIGetRequest(path, token) {
        return getJSON(this.url + path, {
            method: 'GET', 
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }

    makeAPIUpdateRequest(method, path, token, body=null) {
        let options = {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        if (body !== null) {
            options.body = body;
        }
        return getStatus(this.url + path, options);
    }

    makeAPIPostRequest(path, token, body=null) {
        let options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        if (body !== null) {
            options.body = body;
        }
        return getJSON(this.url + path, options);
    }

    /**
     * @returns feed array in json format
     */
    getFeed(token, startPoint=0, num=10) {
        return this.makeAPIGetRequest(`/user/feed?p=${startPoint}&n=${num}`, token);
    }

    getUser(id, token) {
        return this.makeAPIGetRequest(user_url + `?id=${id}`, token);
    }

    getUserByName(username, token) {
        return this.makeAPIGetRequest(user_url + `?username=${username}`, token);
    }

    getPost(id, token) {
        return this.makeAPIGetRequest(post_url + `?id=${id}`, token);
    }

    followUser(username, token) {
        return this.makeAPIUpdateRequest('PUT', user_url + `follow?username=${username}`, token);
    }

    unfollowUser(username, token) {
        return this.makeAPIUpdateRequest('PUT', user_url + `unfollow?username=${username}`, token);
    }

    likePost(id, token) {
        return this.makeAPIUpdateRequest('PUT', post_url + `like?id=${id}`, token);
    }

    unlikePost(id, token) {
        return this.makeAPIUpdateRequest('PUT', post_url + `unlike?id=${id}`, token);
    }

    addComment(post_id, author, comment, token) {
        const published = Math.round((new Date()).getTime() / 100) / 10;
        const body = JSON.stringify({
            'author': author,
            'published': published,
            'comment': comment
        });
        const comment_url = `${post_url}comment?id=${post_id}`;
        return this.makeAPIUpdateRequest('PUT', comment_url, token, body);
    }

    addPost(description, img, token) {
        return this.makeAPIPostRequest(post_url, token, JSON.stringify({
            description_text: description,
            src: img
        }));
    }

    deletePost(id, token) {
        return this.makeAPIUpdateRequest('DELETE', post_url + `?id=${id}`, token);
    }

    editPost(id, description, img, token) {
        return this.makeAPIUpdateRequest('PUT', post_url + `?id=${id}`, token, JSON.stringify({
            description_text: description,
            src: img
        }));
    }

    /**
     * @returns auth'd user in json format
     */
    getMe(token) {
        return this.makeAPIGetRequest(user_url, token);
    }

    getUrl() {
        return this.url;
    }
}