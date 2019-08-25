/*
  Tool functions used:
    - createElement
    - deleteElement
    - createPostTile
    - uploadImage
*/

/* returns an empty array of size max */
export const range = (max) => Array(max).fill(null);

/* returns a randomInteger */
export const randomInteger = (max = 1) => Math.floor(Math.random()*max);

/* returns a randomHexString */
const randomHex = () => randomInteger(256).toString(16);

/* returns a randomColor */
export const randomColor = () => '#'+range(3).map(randomHex).join('');

/**
 * You don't have to use this but it may or may not simplify element creation
 * 
 * @param {string}  tag     The HTML element desired
 * @param {any}     data    Any textContent, data associated with the element
 * @param {object}  options Any further HTML attributes specified
 */
export function createElement(tag, data, options = {}) {
    const el = document.createElement(tag);
    el.innerHTML = data;
   
    // Sets the attributes in the options object to the element
    return Object.entries(options).reduce(
        (element, [field, value]) => {
            element.setAttribute(field, value);
            return element;
        }, el);
}

// Remove Element by id
export function removeElement(element_id) {
    const element = document.getElementById(element_id);
    element.parentNode.removeChild(element);
}

/**
 * Given a post, return a tile with the relevant data
 * @param   {object}        post 
 * @param   {object}        myself
 * @returns {HTMLElement}
 */
export function createPostTile(post, myself) {
    const section = createElement('section', null, { class: 'post', id: `post-${post.id}` });

    // Author (click and go to user page of author)
    let author_link = createElement('a', null, {class: 'author-btn', href: `#${post.meta.author}`});
    author_link.appendChild(createElement('img', null, { 
        class: 'post-title-img', 
        src: 'https://image.ibb.co/fh5Cvq/IMG-0965.jpg' 
    }));
    author_link.appendChild(createElement('div', post.meta.author, { class: 'post-title', id: `post-title-${post.id}` }));
    section.appendChild(author_link);

    // Image
    const post_img = createElement('img', null, 
        { src: "data:*/*;base64," + post.src, id: `post-img-${post.id}`, class: 'post-image' });
    section.appendChild(post_img);
    post_img.addEventListener('contextmenu', (e) => {e.preventDefault();});

    // Post footer
    let footer = createElement('div', null, { class: 'post-footer' });

    // Icon buttons
    const icon_btn_div = createElement('div', null);
    // Heart shaped like button
    let like_img = 'favorite_border';
    if (post.meta.likes.includes(myself.id)) {
        like_img = 'favorite';
    }
    let like_btn = createElement('i', like_img, 
        { class: "material-icons", id: `like-${post.id}`, style: 'margin-right: 8px' });
    if (like_img === 'favorite') {
        like_btn.style.color = '#ff0449';
    }
    icon_btn_div.appendChild(like_btn);
    // Add comment button
    icon_btn_div.appendChild(createElement('i', 'chat_bubble_outline', 
        { class: "material-icons", id: `add-comment-btn-${post.id}`, style: 'margin-right: 8px'}));
    footer.appendChild(icon_btn_div);

    // Show number of users who liked this post
    let like_str_div = createElement('div', null);
    const like_str = createElement('div', `${post.meta.likes.length} likes`, { 
        id: `likestr-${post.id}`, 
        class: "post-footer-btn" 
    });
    like_str_div.appendChild(like_str);
    footer.appendChild(like_str_div);

    // Field for names of users who liked this post, hidden by default
    let like_users = createElement('div', null, {class: 'post-footer-text', id: `likes-users-${post.id}`});
    like_users.style.display = 'none';
    footer.appendChild(like_users);

    // Edit button and delete button
    if (myself.username === post.meta.author) {
        let post_oper_div = createElement('div', null, {class: 'post-operate', style: 'margin-top: 5px;'});
        post_oper_div.appendChild(createElement('span', 'Edit', 
            {class: 'post-footer-btn', id: `edit-post-${post.id}`, style: 'margin-top: 5px;'}));
        post_oper_div.appendChild(createElement('span', 'Delete', 
            {class: 'post-footer-btn', id: `delete-post-${post.id}`, style: 'margin-top: 5px;'}));
        footer.appendChild(post_oper_div);
    }

    // Description
    let description_div = createElement('div', null, {class: 'post-footer-text', style: 'margin-top: 12px'});
    description_div.appendChild(createElement(
        'a',
        post.meta.author,
        {class: 'user-btn', href: `#${post.meta.author}`}
    ));
    description_div.appendChild(createElement(
        'span', 
        post.meta.description_text,
        {class: "user-text", id: `post-description-${post.id}`}));
    footer.appendChild(description_div);

    // Show number of comments
    let comment_btn_div = createElement('div', null);
    comment_btn_div.appendChild(createElement('div', `${post.comments.length} comments`, {
        class: "post-footer-btn", 
        id: `comments-btn-${post.id}`,
        style: 'color: #b1b1b1'
    }));
    footer.appendChild(comment_btn_div);

    // Field for comments, hidden by default
    let comments = createElement('div', null, {id: `comments-${post.id}`, class: 'post-comments'});
    comments.style.display = 'none';
    footer.appendChild(comments);

    // New comment field, showing if new comment is made despite of whether other comments are showing
    footer.appendChild(createElement('div', null, {id: `new-comments-${post.id}`, class: 'post-comments'}));

    // Published time
    footer.appendChild(createElement(
        'div', 
        new Date(post.meta.published * 1000).toLocaleString(), 
        {class: 'timestamp'}));

    // Split line
    footer.appendChild(createElement('hr', null));

    // Comment input field
    let comment_input = createElement('input', null, 
        {id: `comment-input-${post.id}`, class: 'comment-input', placeholder: 'Add a comment...', padding: '2px'});
    footer.appendChild(comment_input);

    section.appendChild(footer);

    return section;
}

// Given an input element of type=file, grab the data uploaded for use
export function uploadImage(event) {
    const [ file ] = event.target.files;

    const validFileTypes = [ 'image/jpeg', 'image/png', 'image/jpg' ]
    const valid = validFileTypes.find(type => type === file.type);

    // bad data, let's walk away
    if (!valid)
        return false;
    
    // if we get here we have a valid image
    const reader = new FileReader();

    reader.onload = (e) => {
        // do something with the data result
        const dataURL = e.target.result;
        let img_div = document.getElementById('img-preview');
        img_div.innerHTML = '';
        const img = createElement('img', null, { class: 'small-image', src: dataURL, id: 'tmp-img' });
        img_div.appendChild(img);
    };

    // this returns a base64 image
    reader.readAsDataURL(file);
}

/* 
    Reminder about localStorage
    window.localStorage.setItem('AUTH_KEY', someKey);
    window.localStorage.getItem('AUTH_KEY');
    localStorage.clear()
*/
export function checkStore(key) {
    if (window.localStorage)
        return window.localStorage.getItem(key)
    else
        return null

}