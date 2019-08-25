/*
  Xiyan Wang, z5151289
  All features implemented (up to level 4)
  Used Web Worker for notification
  Used Service Worker for caching (offline service)
  URL fragmentation is implemented to display user pages (including profile page)
    - #username for user page
    - #         for feed page
    Note: this is different from the example showed in spec
  Which files contain my work: 
    - src/*
    - styles/*
    - index.html
    - sw.js
  Image of favicon.ico is from http://chittagongit.com/icon/camera-icon-flat-22.html
  Title font is from https://fonts.google.com/specimen/Cookie
  User avatar is from American TV Show Supernatural (Screenshot and photoshopped and uploaded by myself)
  Borrowed css code from www.w3schools.com and tobiasahlin.com which are specified in provided.css (end of file)
*/

import { createPostTile, createElement, removeElement } from './helpers.js';
import { hasToken, setToken, getToken, clearToken } from './auth.js';
import { showLoginForm, showAddPostForm, showEditPostForm, showEditProfileForm, createImgModal } from './modals.js';
import API from './api.js';

// Global constants and variables
export const api  = new API();              // API instance
export let users = [];                      // All users
export let myself = null;                   // Current user
let worker = new Worker('/src/ww.js');      // Web Worker for notification
let notify = false;                         // If permission for notification is granted
let newest = (new Date()).getTime();        // For notification
let new_posts = [];                         // New posts data
let pullFeedTimer = false;

window.onload = init;
window.onscroll = infiniteScroll;

// Check availability for notification and caching, display login modal if not logged in
function init () {
    // Apply for notification permission
    hideAll();
    Notification.requestPermission(permission => {
        if (permission === 'granted') {
            notify = true;
        }
        // Register Service Worker for caching
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('../sw.js')
            .then(function(reg){
                // Caching
                checkLogin();
            });
        }
        else {
            checkLogin();
        }
    });
}

// Check log in status
function checkLogin() {
    // Not logged in
    if (hasToken() === false) {
        hideAll();
        showLoginForm();
    }
    // Logged in
    else {
        showLoading();
        succeedLogin();
    }
}

// Render everything if login successfully
async function succeedLogin () {    
    // Check
    const username = location.hash.match(/^#(.*)$/);
    if (username && username[1].trim()) {
        await loadUserData(username[1].trim());
    }
    else {
        await loadFeedData();
    } 
}

// Load feed data
function loadFeedData () {
    // All-users data
    getUsers(users);
    // Current user data
    const me = api.getMe(getToken());
    // Feed
    me.then((u) => {
        if (u && 'id' in u) {
            myself = u;
            setHello();
            // User profile btn on nav bar
            document.getElementById('profile-btn').href = `#${myself.username}`;
            const feed = api.getFeed(getToken());
            feed.then(res => {
                res.posts.reduce((parent, post) => {
                    parent.appendChild(createPostTile(post, myself));
                    return parent;
                }, document.getElementById('large-feed'));
                showFeed();
                newest = (new Date()).getTime();
                if (notify) {
                    if (pullFeedTimer) {
                        window.clearInterval(pullFeed);
                        window.clearInterval(titleFlicker);
                    }
                    pullFeedTimer = window.setInterval(pullFeed, 5000);
                    window.setInterval(titleFlicker, 1000);
                    notify = false;
                }
            });
        }
    });
}

// Load user data
function loadUserData(username) {
    // All-users data
    getUsers(users);
    api.getMe(getToken()).then(me => {
        if (me && 'id' in me) {
            myself = me;
            setHello();
            if (username === me.username) {
                updateUserPage(me);
            }
            else {
                api.getUserByName(username, getToken()).then(u => {
                    if (u && 'id' in u) {
                        updateUserPage(u);
                    }
                });
            }
            if (notify) {
                if (pullFeedTimer) {
                    window.clearInterval(pullFeed);
                    window.clearInterval(titleFlicker);
                }
                pullFeedTimer = window.setInterval(pullFeed, 5000);
                window.setInterval(titleFlicker, 1000);
                notify = false;
            }
        }
    });
}

// Prepare data for searching users
function getUsers (users) {
    let id = users.length + 1;
    let user = api.getUser(id, getToken());
    return user.then((u) => {
        if (u !== undefined && 'id' in u) {
            users.push(u);
            getUsers(users);
        }
    })
}

// Load more data when scroll to the end
function infiniteScroll () {
    if (document.getElementById('large-feed').style.display === 'none') {
        return;
    }
    const scrollTop = document.documentElement.getBoundingClientRect().top;
    const clientHeight = document.documentElement.clientHeight;
    const heightWithoutMargin = document.getElementsByTagName("body")[0].scrollHeight;
    const feed = document.getElementById('large-feed');
    const topMargin = parseInt(window.getComputedStyle(feed).marginTop.match(/^(\d+)px$/)[1]);
    const fullHeight = heightWithoutMargin + topMargin;

    if (scrollTop === 0) {
        return;
    }

    // Add more content if scrolled to the bottom
    if (clientHeight - scrollTop === fullHeight || clientHeight - scrollTop === heightWithoutMargin) {
        const startPoint = document.getElementsByClassName('post').length;
        const feed = api.getFeed(getToken(), startPoint);
        feed.then(res => {
            res.posts.reduce((parent, post) => {
                parent.appendChild(createPostTile(post, myself));
                return parent;
            }, document.getElementById('large-feed'));
        });
    }
}

// Search bar on nav bar
document.getElementById('search-username').oninput = searchDropBox;

// Add post btn on nav bar
document.getElementById('add-post-btn').addEventListener('click', () => {
    showAddPostForm();
})

// Log out btn on nav bar
document.getElementById('logout-btn').addEventListener('click', () => {
    clearToken();
    checkLogin();
})

// Other click events
window.addEventListener('click', function(e) {

    // Drop box item
    if (/^drop-box-/.test(e.target.id)) {
        document.getElementById('search-username').value = e.target.innerHTML;
        searchUser();
    }
    else if (document.getElementById('search-drop-box')) {
        removeElement('search-drop-box');
        return;
    }
    else if (document.getElementById('following-drop-box')) {
        removeElement('following-drop-box');
        return;
    }

    // Go to index if 'Instacram' is clicked
    if (e.target.id === 'title' && hasToken()) {
        location.hash = '';
        return;
    }

    // Close modals
    if (e.target.classList.contains('popup')) {
        if (e.target.id !== 'login-form' && e.target.id != 'signup-form') {
            removeElement(e.target.id);
        }
        return;
    }
    else if (e.target.id === 'popup-close') {
        document.getElementById('main').removeChild(e.target.parentNode.parentNode.parentNode);
        return;
    }

    /*
      Post Tile
    */

    // Heart shaped like btn (post)
    if(/^like-\d+$/.test(e.target.id)) {
        const id = e.target.id.match(/^like-(\d+)$/)[1];
        if (e.target.innerHTML === 'favorite_border') {
            const res = api.likePost(id, getToken());
            res.then((s) => {
                if (s === 200) {
                    // Update like button
                    e.target.innerHTML = 'favorite';
                    e.target.style.color = '#ff0449';

                    // Update number of users liked this post
                    let like_str = document.getElementById(`likestr-${id}`);
                    const like_num = parseInt(like_str.innerHTML.match(/^(\d+) likes$/)[1]) + 1;
                    like_str.innerHTML = `${like_num} likes`;

                    // Update names of users likes this post
                    let likes_users = document.getElementById(`likes-users-${id}`);
                    if (likes_users.style.display !== 'none') {
                        let span = document.getElementById(`user-text-${id}`);
                        likes_users.insertBefore(createElement('a', myself.username, 
                            {class: 'user-btn', id: `user-btn-${id}-${myself.username}`, href: `#${myself.username}`}), span);
                    }

                    // Update statistics number on user page
                    if (document.getElementById('user-page').style.display !== 'none') {
                        const liked_str = document.getElementById('user-stat-liked');
                        const liked = parseInt(liked_str.innerHTML.match(/(\d+)/)[1]) + 1;
                        liked_str.innerHTML = `${liked}`.bold() +' likes received';
                    }
                }
            });
        }
        else {
            const res = api.unlikePost(id, getToken());
            res.then((s) => {
                if (s === 200) {
                    // Update like button
                    e.target.innerHTML = 'favorite_border';
                    e.target.style.color = 'black';

                    // Update number of users liked this post
                    let like_str = document.getElementById(`likestr-${id}`);
                    const like_num = parseInt(like_str.innerHTML.match(/^(\d+) likes$/)[1]) - 1;
                    like_str.innerHTML = `${like_num} likes`;

                    // Update names of users likes this post
                    let likes_users = document.getElementById(`likes-users-${id}`);
                    if (likes_users.style.display !== 'none') {
                        if (likes_users.childNodes.length === 2) {
                            likes_users.style.display = 'none';
                        }
                        else {
                            removeElement(`user-btn-${id}-${myself.username}`);
                        }
                    }

                    // Update statistics number on user page
                    if (document.getElementById('user-page').style.display !== 'none') {
                        const liked_str = document.getElementById('user-stat-liked');
                        const liked = parseInt(liked_str.innerHTML.match(/(\d+)/)[1]) - 1;
                        liked_str.innerHTML = `${liked}`.bold() +' likes received';
                    }
                }
            });
        }
        return;
    }

    // Add comment button (post)
    if (/^add-comment-btn-/.test(e.target.id)) {
        const id = e.target.id.match(/^add-comment-btn-(\d+)/)[1];
        document.getElementById(`comment-input-${id}`).focus();
        return;
    }

    // Show people who liked this post (post)
    if(/^likestr-\d+$/.test(e.target.id)) {
        const id = e.target.id.match(/^likestr-(\d+)$/)[1];
        let likes_div = document.getElementById(`likes-users-${id}`);
        if (likes_div.style.display === 'none') {
            const post = api.getPost(id, getToken());
            post.then((p) => {
                if ('id' in p) {
                    e.target.innerHTML = `${p.meta.likes.length} likes`;
                    likes_div.innerHTML = '';

                    const likes_users = users
                    .filter(u => p.meta.likes.includes(u.id))
                    .map(u => u.username);

                    if (likes_users.length > 0) {
                        for (let user of likes_users) {
                            likes_div.appendChild(createElement('a', user, {class: 'user-btn', id: `user-btn-${id}-${user}`, href: `#${user}`}));
                        }
                        likes_div.appendChild(createElement('span', 'liked this post', {class: 'user-text', id: `user-text-${id}`}));
                        likes_div.style.display = 'block';
                    }
                }
            })
        }
        else {
            likes_div.style.display = 'none';
        }
        return;
    }

    // Show comments (post)
    if(/^comments-btn-\d+$/.test(e.target.id)) {
        const id = e.target.id.match(/^comments-btn-(\d+)$/)[1];
        let comments = document.getElementById(`comments-${id}`);
        let new_comments = document.getElementById(`new-comments-${id}`);
        const comment_num = e.target.innerHTML.match(/(\d+)/)[1];
        if (comments.style.display === 'none' && parseInt(comment_num) !== new_comments.childElementCount) {
            const post = api.getPost(id, getToken());
            post.then((p) => {
                if ('id' in p) {
                    document.getElementById(`new-comments-${id}`).innerHTML = '';
                    e.target.innerHTML = `${p.comments.length} comments`;
                    comments.innerHTML = '';
                    for (let comment of p.comments.sort((c1, c2) => {return parseInt(c1.published) - parseInt(c2.published)})) {
                        let comment_div = createElement('div', null, {class: 'post-footer-text'});
                        comment_div.appendChild(createElement(
                            'a', 
                            comment.author, 
                            {class: 'user-btn', href: `#${comment.author}`}));
                        comment_div.appendChild(createElement(
                            'span', 
                            comment.comment, 
                            {class: "user-text"}));
                        comments.appendChild(comment_div);
                    }
                    if (p.comments.length > 0) {
                        document.getElementById(`new-comments-${id}`).innerHTML = '';
                        comments.style.display = 'block';
                    }
                }
            });
        }
        else {
            document.getElementById(`new-comments-${id}`).innerHTML = '';
            comments.style.display = 'none';
        }
        return;
    }

    // Zoom in post image
    if (e.target.classList.contains('post-image')) {
        createImgModal(e.target.src);
    }

    /*
      User Page
    */

    // Edit profile modal (user page)
    if (e.target.id === 'edit-profile-btn') {
        showEditProfileForm();
        document.getElementById('edit-profile-email').value = myself.email;
        document.getElementById('edit-profile-name').value = myself.name;
        return;
    }

    // Follow button (user page)
    if (e.target.id === 'follow-btn') {
        const username = location.hash.match(/^#(.*)$/)[1];
        if (e.target.innerHTML === 'follow') {
            const res = api.followUser(username, getToken());
            res.then((s) => {
                if (s === 200) {
                    e.target.innerHTML = 'following';
                    e.target.style.backgroundColor = '#bbbbbb';
                    e.target.style.color = 'black';
                    let follower_str = document.getElementById('user-stat-follower');
                    const follower_num = parseInt(follower_str.innerHTML.match(/(\d+)/)[0]) + 1;
                    follower_str.innerHTML = `${follower_num}`.bold() + ' follower';
                }
            });
        }
        else {
            const res = api.unfollowUser(username, getToken());
            res.then((s) => {
                if (s === 200) {
                    e.target.innerHTML = 'follow';
                    e.target.style.backgroundColor = '#2492f4';
                    e.target.style.color = 'white';
                    let follower_str = document.getElementById('user-stat-follower');
                    const follower_num = parseInt(follower_str.innerHTML.match(/(\d+)/)[0]) - 1;
                    follower_str.innerHTML = `${follower_num}`.bold() + ' follower';
                }
            });
        }
        return;
    }

    // Edit post (user page)
    if (/^edit-post-\d+$/.test(e.target.id)) {
        const id = e.target.id.match(/(\d+)/)[1];
        showEditPostForm(id);
        let img_div = document.getElementById('img-preview');
        const dataURL = document.getElementById(`post-img-${id}`).src;
        const img = createElement('img', null, { class: 'small-image', src: dataURL, id: 'tmp-img' });
        img_div.appendChild(img);
        document.getElementById('edit-post-description').value = 
            document.getElementById(`post-description-${id}`).innerHTML;
        return;
    }

    // Delete post (user page)
    if (/^delete-post-/.test(e.target.id)) {
        const id = e.target.id.match(/(\d+)/)[1];
        let del = confirm('Delete post?');
        if (del === true) {
            const res = api.deletePost(id, getToken());
            res.then(s => {
                if (s === 200) {
                    let likes_str = document.getElementById(`likestr-${id}`);
                    const likes_num = parseInt(likes_str.innerHTML.match(/(\d+)/)[1]);
                    let likes_received_str = document.getElementById('user-stat-liked');
                    const likes_total_num = parseInt(likes_received_str.innerHTML.match(/(\d+)/)[1]);
                    likes_received_str.innerHTML = `${likes_total_num - likes_num}`.bold() + ' likes received';
                    removeElement(`post-${id}`);
                    let posts_str = document.getElementById('user-stat-posts');
                    const posts_num = parseInt(posts_str.innerHTML.match(/(\d+)/)[1]) - 1;
                    posts_str.innerHTML = `${posts_num}`.bold() + ' posts';
                }
            });
        }
        return;
    }

    // Show Follow list (user page)
    if (e.target.id === 'user-stat-following') {
        if (parseInt(e.target.innerHTML.match(/(\d+)/)[1]) === 0) {
            return;
        }

        const left = e.target.getBoundingClientRect().left;
        const top = e.target.getBoundingClientRect().bottom + 5;
        const offset = parseInt((e.target.getBoundingClientRect().width - e.target.style.width) / 2);
        let drop_box = createElement('div', null, {
            id: 'following-drop-box', 
            class: 'drop-box', 
            style: `left: ${left - offset}px; top: ${top}px;`});
        const username = location.hash.match(/^#(.*)$/)[1];
        const user = api.getUserByName(username, getToken());
        user.then(u => {
            // Succeed
            if ('id' in u) {
                if (u.following.length === 0) {
                    return;
                }
                for (let id of u.following) {
                    api.getUser(id, getToken()).then(followed => {
                        // Succeed
                        if ('id' in followed) {
                            drop_box.appendChild(createElement(
                            'div', 
                            followed.username, 
                            {class: 'drop-box-item', id: `drop-box-${followed.username}`}));
                        }
                    });
                }
            }
        });
        document.getElementById('main').appendChild(drop_box);
        return;
    }

    /*
      Notification
    */

    // Load new data (notificatoin)
    if (e.target.id === 'load-new-data-btn') {
        document.getElementById('load-new-data-btn').style.display='none';
        while (new_posts.length > 0) {
            const post = new_posts.pop();
            let feed_div = document.getElementById('large-feed');
            if (feed_div.childNodes.length === 0) {
                feed_div.appendChild(createPostTile(post, myself));
            }
            else {
                const first_child = feed_div.childNodes[0];
                feed_div.insertBefore(createPostTile(post, myself), first_child);
            }
        }
        removeElement('load-new-data-btn');
        return;
    }

    // Clear search user input
    if (/^search-username$/.test(e.target.id)) {
        e.target.value = '';
        return;
    }
});

// Keypress event
window.addEventListener('keypress', function(e) {
    if (e.keyCode === 13) {

        // Add a comment
        if(/^comment-input-\d+$/.test(e.target.id)) {
            const id = e.target.id.match(/^comment-input-(\d+)$/)[1];
            const res = api.addComment(id, myself.username, e.target.value, getToken());
            res.then((s) => {
                if (s === 200) {
                    let comments_btn = document.getElementById(`comments-btn-${id}`);
                    const comment_num = parseInt(comments_btn.innerHTML.match(/^(\d+) comments$/)[1]) + 1;
                    comments_btn.innerHTML = `${comment_num} comments`;
                    let new_comments = document.getElementById(`new-comments-${id}`);
                    new_comments.style.display = 'block';
                    let new_comments_div = createElement('div', null, {class: 'post-footer-text'});
                    new_comments_div.appendChild(createElement(
                        'a',
                        myself.username,
                        {class: 'user-btn', href: `#${myself.username}`}
                    ));
                    new_comments_div.appendChild(createElement('span', 
                        e.target.value, 
                        {class: 'post-footer-text'}));
                    new_comments.appendChild(new_comments_div);
                    e.target.value = '';
                }
            })
            return;
        }
    
        // Search user
        if (/^search-username$/.test(e.target.id)) {
            searchUser();
            return;
        }
    }
});

/*
  User Page
*/

// URL fragment based routing
window.addEventListener('hashchange', function() {
    if (location.hash === '') {
        checkLogin();
        return;
    }
    showLoading();
    const username = location.hash.match(/^#(.*)$/)[1];
    const user = api.getUserByName(username, getToken());
    user.then((u) => {
        if ('id' in u) {
            document.getElementById('large-feed').innerHTML = '';
            updateUserPage(u);
        }
    });
});

// Build user page
async function updateUserPage (u) {
    const user_page = document.getElementById('user-page');
    user_page.innerHTML = '';
    user_page.appendChild(createElement('div', null, {class: 'user-header', id: 'user-header'}));
    updateUserHeader(u);
    let user_posts = createElement('div', null, {class: 'user-posts', id: 'user-posts'});
    let liked = 0;
    let count = 0;
    for (let id of u.posts.sort((p1, p2) => {return parseInt(p2) - parseInt(p1)})) {
        let post = await api.getPost(id, getToken());
        if ('id' in post) {
            user_posts.appendChild(createPostTile(post, myself));
            liked += post.meta.likes.length;
            count += 1;
            if (count === u.posts.length) {
                let user_stat = document.getElementsByClassName('user-stat')[0];
                user_stat.appendChild(createElement(
                    'span', 
                    `${liked}`.bold() +' likes received', 
                    {class: 'user-stat-item', id: 'user-stat-liked'}));
            }
        }
    }
    user_page.appendChild(user_posts);
    showUser();
}

// Build header of user page
async function updateUserHeader (u) {
    let user_header = document.getElementById('user-header');
    let user_header_info = createElement('span', null, {class: 'user-header-info'});

    user_header.appendChild(createElement('img', null, {
        src: 'https://image.ibb.co/fh5Cvq/IMG-0965.jpg',
        class: 'user-header-avatar'
    }));

    let user_title = createElement('div', null, {class: 'user-title', id:'user-header-info'});
    user_title.appendChild(createElement('span', u.username, {class: 'user-username'}));
    if (u.username === myself.username) {
        myself = u;
        user_title.appendChild(createElement(
            'i', 
            'edit', 
            {class: 'material-icons', id: 'edit-profile-btn'}))
    }
    else {
        let follow_btn = createElement(
            'div', 
            null, 
            {class: 'follow-btn', id: 'follow-btn'});
        const me = await api.getMe(getToken());
        if (me && 'id' in me) {
            myself = me;
        }
        if (myself.following.includes(u.id)) {
            follow_btn.innerHTML = 'following';
            follow_btn.style.backgroundColor = '#bbbbbb';
            follow_btn.style.color = 'black';
        }
        else {
            follow_btn.innerHTML = 'follow';
            follow_btn.style.backgroundColor = '#2492f4';
            follow_btn.style.color = 'white';
        }
        user_title.appendChild(follow_btn);
    }
    user_header_info.appendChild(user_title);

    let user_stat = createElement('div', null, {class: 'user-stat'});
    user_stat.appendChild(createElement(
        'span', 
        `${u.posts.length}`.bold() +' posts', 
        {class: 'user-stat-item', id: 'user-stat-posts'}));
    user_stat.appendChild(createElement(
        'span', 
        `${u.followed_num}`.bold() + ' follower', 
        {class: 'user-stat-item', id: 'user-stat-follower'}));

    // Following list can only be accessed from profile page
    if (u.username === myself.username) {
        user_stat.appendChild(createElement(
        'span', 
        `${u.following.length}`.bold() + ' following', 
        {class: 'user-stat-item', id: 'user-stat-following'}));
    }
    else {
        user_stat.appendChild(createElement(
            'span', 
            `${u.following.length}`.bold() + ' following', 
            {class: 'user-stat-item'}));
    }
    user_header_info.appendChild(user_stat);

    if (u.name !== '') {
        user_header_info.appendChild(createElement('div', u.name.bold(), {class: 'user-info', id: 'user-profile-name'}));
    }

    if (u.email !== '') {
        user_header_info.appendChild(createElement('div', u.email.bold(), {class: 'user-info', id: 'user-profile-email'}));
    }

    user_header.appendChild(user_header_info);

    return user_header;
}

/*
  Search User
*/

// Search bar drop box
function searchDropBox (e) {
    const prefix = document.getElementById('search-username').value;
    if (prefix === '') {
        if (document.getElementById('search-drop-box')) {
            removeElement('search-drop-box');
        }
        return;
    }
    let matcher = new RegExp(`^${prefix}`, 'i');
    const matched_users = users.filter(u => matcher.test(u.username)).sort((u1, u2) => {
        if (u1.follower_num !== u2.follower_num) {
            return u2.follower_num - u1.follower_num;
        }
        if (u1.posts.length !== u2.posts.length) {
            return u2.posts.length - u1.posts.length;
        }
        return u1.username.localeCompare(u2.username);
    }).map(u => u.username);
    showDropBox('search-drop-box', matched_users);
}

// Create drop box
function showDropBox(id, matched_users) {
    let drop_box = document.getElementById('search-drop-box');
    if (!drop_box) {
        const left = parseInt(document.getElementById('search-username').getBoundingClientRect().left) - 2;
        drop_box = createElement('div', null, {
            id: id, 
            class: 'drop-box', 
            style: `left: ${left}px;`});
        document.getElementById('main').appendChild(drop_box);
    }
    else {
        drop_box.innerHTML = '';
    }
    
    for (let username of matched_users) {
        drop_box.appendChild(createElement(
            'div', 
            username, 
            {class: 'drop-box-item', id: `drop-box-${username}`}));
    }
    if (matched_users.length === 0) {
        drop_box.appendChild(createElement('div', 'No results found.', {
            style: 'padding: 10px; font-size: 14px; color: lightgray'
        }));
    }
}

// Search user
function searchUser () {
    const username = document.getElementById('search-username').value;
    if (users.filter(u => username === u.username).length !== 0) {
        location.hash = `#${username}`;
    }
    if (document.getElementById('search-drop-box')) {
        removeElement('search-drop-box');
    }
    if (document.getElementById('following-drop-box')) {
        removeElement('following-drop-box');
    }
}

/*
  Web Worker
*/

// Pull data from feed (every 5 seconds)
function pullFeed () {
    worker.postMessage({url: `${api.getUrl()}/user/feed`, newest: newest, token: getToken(), user: myself.username});
}

// Title effect for new post notification (toggle every second)
function titleFlicker () {
    if (new_posts.length > 0) {
        if (/^(\d+)/.test(document.title)) {
            document.title = 'Instacram';
        }
        else {
            document.title = `${new_posts.length} new info`;
        }
    }
    else{
        document.title = 'Instacram';
    }
}

// New posts data arrive
worker.onmessage = (e) => {
    // Update 'newest' timestamp and record new posts data
    newest = e.data.newest;
    if (e.data.result.length === 0) {
        return;
    }
    new_posts = new_posts.concat(e.data.result).sort((p1, p2) => {
        return parseInt(p2.id) - parseInt(p1.id);
    });

    // Show load new post button
    if(!document.getElementById('load-new-data-btn') 
        && document.getElementById('large-feed').style.display !== 'none') {
        document.getElementById('main').appendChild(createElement('div', 'Load new posts', {id: 'load-new-data-btn'}));
    }
}

// Set Hello string
function setHello() {
    let hellos = document.getElementsByClassName('hello');
    for (let i = 0; i < hellos.length; i++) {
        let e = hellos[i];
        e.innerHTML = `Hello, ${myself.username}`;
        e.addEventListener('selectstart', (e) => { e.preventDefault();});
    }
}

function hideHello(hide) {
    let hellos = document.getElementsByClassName('hello');
    for (let i = 0; i < hellos.length; i++) {
        let e = hellos[i];
        if (hide) {
            e.style.display = 'none';
        }
        else {
            e.style.display = 'block';
        }
    }
}

// Switch page functions
function showFeed() {
    document.getElementById('user-page').innerHTML='';
    document.getElementById('loading').style.display='none';
    document.getElementById('user-page').style.display='none';
    document.getElementById('large-feed').style.display='block';
    document.getElementById('search-bar').style.display='block';
    document.getElementById('nav').style.display='block';
    if (new_posts.length > 0) {
        new_posts = [];
    }
    hideHello(false);
}

function showUser() {
    document.getElementById('large-feed').innerHTML='';
    document.getElementById('loading').style.display='none';
    document.getElementById('user-page').style.display='block';
    document.getElementById('large-feed').style.display='none';
    document.getElementById('search-bar').style.display='block';
    document.getElementById('nav').style.display='block';
    if (document.getElementById('load-new-data-btn')) {
        removeElement('load-new-data-btn');
    }
    hideHello(false);
}

function showLoading() {
    document.getElementById('large-feed').innerHTML='';
    document.getElementById('user-page').innerHTML='';
    document.getElementById('loading').style.display='block';
    document.getElementById('user-page').style.display='none';
    document.getElementById('large-feed').style.display='none';
    document.getElementById('search-bar').style.display='block';
    document.getElementById('nav').style.display='block';
    if (document.getElementById('load-new-data-btn')) {
        removeElement('load-new-data-btn');
    }
    hideHello(false);
}

function hideAll() {
    document.getElementById('large-feed').innerHTML='';
    document.getElementById('user-page').innerHTML='';
    document.getElementById('loading').style.display='none';
    document.getElementById('user-page').style.display='none';
    document.getElementById('large-feed').style.display='none';
    document.getElementById('large-feed').style.display='none';
    document.getElementById('search-bar').style.display='none';
    document.getElementById('nav').style.display='none';
    if (document.getElementById('load-new-data-btn')) {
        removeElement('load-new-data-btn');
        new_posts = [];
    }
    hideHello(true);
}
