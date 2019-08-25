/*
  Deal with modals: 
    - Login form modal
    - Signup form modal
    - Add post form modal
    - Edit post form modal
    - Edit profile form modal
    - Zoom in image modal
*/

import { submitLogin, submitSignup, getToken } from './auth.js';
import { createElement, removeElement, uploadImage, createPostTile } from './helpers.js';
import { api, myself } from './main.js';

// Show Login From
export function showLoginForm() {
    const options = {
        title: 'Welcome',
        id: 'login-form',
        inputs: [
            {
                name: 'username',
                id: 'login-username',
                type: 'text'
            },
            {
                name: 'password',
                id: 'login-password',
                type: 'password'
            }
        ],
        btns: [
            {
                id: 'login-submit-btn',
                name: 'Log In',
                onclick: submitLogin
            },
            {
                id: 'login-signup-btn',
                name: 'Sign Up',
                onclick: () => {
                    removeElement('login-form');
                    showSignupForm();
                }
            }
        ]
    };

    // Press Enter key to submit
    let login_form = createModal(options);
    login_form.addEventListener('keypress', (e) => {
        if (e.keyCode === 13) {
            submitLogin();
        }
    });
}

// Show Signup Form
function showSignupForm() {
    const options = {
        title: 'Join Instacram',
        id: 'signup-form',
        inputs: [
            {
                name: 'email',
                id: 'signup-email',
                type: 'email'
            },
            {
                name: 'name',
                id: 'signup-name',
                type: 'text'
            },
            {
                name: 'username',
                id: 'signup-username',
                type: 'text'
            },
            {
                name: 'password',
                id: 'signup-password',
                type: 'password'
            },
            {
                name: 'repeat password',
                id: 'signup-repassword',
                type: 'password'
            }
        ],
        btns: [
            {
                id: 'signup-submit-btn',
                name: 'Sign Up',
                onclick: submitSignup
            },
            {
                id: 'signup-login-btn',
                name: 'Log In',
                onclick: () => {
                    removeElement('signup-form');
                    showLoginForm();
                }
            }
        ]
    };

    // Press Enter key to submit
    let signup_form = createModal(options);
    signup_form.addEventListener('keypress', (e) => {
        if (e.keyCode === 13) {
            submitSignup();
        }
    });
}

// Show Add Post From
export function showAddPostForm() {
    const options = {
        title: 'Add a New Post',
        id: 'add-post-form',
        inputs: [
            {
                name: 'description',
                id: 'add-post-description',
                type: 'text'
            },
            {
                name: '',
                id: 'add-post-file-selector',
                type: 'file'
            }
        ],
        btns: [
            {
                id: 'add-post-submit-btn',
                name: 'Submit',
                onclick: submitPost
            }
        ],
        divs: [
            {
                id: 'img-preview'
            }
        ]
    };

    // Press Enter key to submit
    let add_post_form = createModal(options);
    add_post_form.addEventListener('keypress', (e) => {
        if (e.keyCode === 13) {
            submitPost();
        }
    });

    // Upload and preview image
    document.getElementById('add-post-file-selector').addEventListener ('change', (e) => {uploadImage(e)});
}

// Show Edit Post Form
export function showEditPostForm(id) {
    const options = {
        title: 'Edit Post',
        id: 'edit-post-form',
        inputs: [
            {
                name: 'description',
                id: 'edit-post-description',
                type: 'text'
            },
            {
                name: '',
                id: 'edit-post-file-selector',
                type: 'file'
            }
        ],
        btns: [
            {
                id: 'edit-post-submit-btn',
                name: 'Submit',
                onclick: editPost
            }
        ],
        divs: [
            {
                id: 'img-preview'
            }
        ]
    };
    let edit_post_form = createModal(options);

    // Assign post_id value
    edit_post_form.appendChild(createElement('div', id, {
        id: 'edit-post-id',
        style: 'display:none;'
    }));

    // Press Enter key to submit
    edit_post_form.addEventListener('keypress', (e) => {
        if (e.keyCode === 13) {
            editPost();
        }
    });

    // Upload and preview image
    document.getElementById('edit-post-file-selector').addEventListener ('change', (e) => {uploadImage(e)});
}

// Show Edit Profile Form
export function showEditProfileForm() {
    const options = {
        title: 'Edit Profile',
        id: 'edit-profile-form',
        inputs: [
            {
                name: 'email',
                id: 'edit-profile-email',
                type: 'email'
            },
            {
                name: 'name',
                id: 'edit-profile-name',
                type: 'text'
            },
            {
                name: 'password',
                id: 'edit-profile-password',
                type: 'password'
            },
            {
                name: 'repeat password',
                id: 'edit-profile-repassword',
                type: 'password'
            }
        ],
        btns: [
            {
                id: 'edit-profile-password-btn',
                name: 'Password',
                onclick: () => {
                    let edit_profile_password_btn = document.getElementById('edit-profile-password-btn');
                    if (edit_profile_password_btn.value === 'Password') {
                        document.getElementById('edit-profile-password').style.display = 'inline';
                        document.getElementById('edit-profile-repassword').style.display = 'inline';
                        edit_profile_password_btn.value = 'No Password';
                    }
                    else {
                        document.getElementById('edit-profile-password').style.display = 'none';
                        document.getElementById('edit-profile-repassword').style.display = 'none';
                        edit_profile_password_btn.value = 'Password'
                    }
                }
            },
            {
                id: 'edit-profile-submit-btn',
                name: 'Submit',
                onclick: submitProfile
            }
        ]
    };
    let edit_profile_form = createModal(options);

    // Hide password fields
    document.getElementById('edit-profile-password').style.display = 'none';
    document.getElementById('edit-profile-repassword').style.display = 'none';

    // Press Enter key to submit
    edit_profile_form.addEventListener('keypress', (e) => {
        if (e.keyCode === 13) {
            submitProfile();
        }
    });
}

// Create modal with options
function createModal(options) {
    let popup = createElement('div', null, {class: 'popup', id: options.id});
    let popup_content = createElement('div', null, {class: 'popup-content'});

    // Title and close button
    const popup_title_div = createElement('div', null, {class: 'popup-title-div'});
    popup_title_div.appendChild(createElement('div', options.title, {class: 'popup-title'}));
    if (options.id !== 'login-form' && options.id !== 'signup-form') {
        const close_btn = createElement('i', 'close', {class: 'material-icons', id: 'popup-close'});
        popup_title_div.appendChild(close_btn);
    }
    popup_content.appendChild(popup_title_div);

    // Input fields
    for (let input of options.inputs) {
        appendLine(popup_content, [createElement('input', null, {
            class: 'form-input',
            type: input.type,
            id: input.id,
            placeholder: input.name
        })]);
    }

    // Optional fields
    if ('divs' in options) {
        for (let div of options.divs) {
            popup_content.appendChild(createElement('div', null, {id: div.id}));
        }
    }

    // Buttons
    let btns = [];
    for (let btn of options.btns) {
        let button = createElement('input', null, {
            class: 'popup-btn',
            type: 'button',
            id: btn.id,
            value: btn.name
        });
        button.addEventListener('click', btn.onclick);
        btns.push(button);
    }
    appendLine(popup_content, btns);
    
    popup.appendChild(popup_content);
    document.getElementById('main').appendChild(popup);
    return popup;
}

// Zoom in image
export function createImgModal(src) {
    let popup = createElement('div', null, {class: 'popup', id: 'popup-img-box'});
    const img = createElement('img', null, {class: 'popup-img', src: src});
    img.addEventListener('contextmenu', (e) => {e.preventDefault();});
    popup.appendChild(img);
    document.getElementById('main').appendChild(popup);
}

// Wrap input element in a p-tag element and append to parent
function appendLine(parent, elements) {
    let p = createElement('p', null);
    for (let e of elements) {
        p.appendChild(e);
    }
    parent.appendChild(p);
}

// Add a new post
function submitPost () {
    // Get input data
    const description = document.getElementById("add-post-description");
    const img = document.getElementById("tmp-img");

    // Check input data
    if (description.value === '' || img === null) {
        alert('Invalid input!');
        return;
    }
    const img_src = img.src.match(/^data:[^/]*\/[^/]*;base64,(.*)$/)[1];
    if (img_src === false) {
        alert('Invalid image file!');
        return;
    }

    // Submit
    api.addPost(description.value, img_src, getToken())
    .then(res => {
        if (res && 'post_id' in res) {
            removeElement('add-post-form');
            if (document.getElementById('user-page').style.display !== 'none') {
                // Update profile page
                const username = location.hash.match(/^#(.*)$/)[1];
                if (username === myself.username) {
                    // Insert the new post to user page
                    const post = {
                        id: res.post_id,
                        meta: {
                            "author": myself.username,
                            "description_text": description.value,
                            "published": (new Date()).getTime() / 1000,
                            "likes": []
                        },
                        thumbnail: "",
                        src: img_src,
                        comments: []
                    };

                    let posts_div = document.getElementById('user-posts');
                    if (posts_div.childNodes.length === 0) {
                        posts_div.appendChild(createPostTile(post, myself));
                    }
                    else {
                        const first_child = posts_div.childNodes[0];
                        posts_div.insertBefore(createPostTile(post, myself), first_child);
                    }

                    // Update post number info
                    let posts_str = document.getElementById('user-stat-posts');
                    const posts_num = parseInt(posts_str.innerHTML.match(/(\d+)/)[1]) + 1;
                    posts_str.innerHTML = `${posts_num}`.bold() + ' posts';
                }
            }
        }
        else {
            alert('Invalid input!');
        }
    });
}

// Edit post
function editPost () {
    // Get input data
    const description = document.getElementById("edit-post-description");
    const img = document.getElementById("tmp-img");

    // Check input data
    if (description.value === '' || img === null) {
        alert('Invalid input!');
        return;
    }
    const img_src = img.src.match(/^data:[^/]*\/[^/]*;base64,(.*)$/)[1];
    if (img_src === false) {
        alert('Invalid image file! ');
        return;
    }

    // Submit
    const id = document.getElementById('edit-post-id').innerHTML;
    api.editPost(id, description.value, img_src, getToken())
    .then(s => {
        // Success
        if (s === 200) {
            if (document.getElementById('user-page').style.display !== 'none') {
                document.getElementById(`post-img-${id}`).src = document.getElementById('tmp-img').src;
                document.getElementById(`post-description-${id}`).innerHTML = 
                    document.getElementById('edit-post-description').value;
            }
            removeElement('edit-post-form');
        }
        // Fail
        else {
            alert('Invalid input!');
        }
    });
}

// Edit profile
function submitProfile () {
    // Get input data
    const email = document.getElementById('edit-profile-email').value;
    const name = document.getElementById('edit-profile-name').value;
    const password = document.getElementById('edit-profile-password').value;
    const repassword = document.getElementById('edit-profile-repassword').value;

    let body = {};

    // Check password
    if (document.getElementById('edit-profile-password-btn').value === 'No Password' && 
        password !== repassword) {
        alert('Those passwords didn\'t match. Try again.');
        return;
    }
    else if (document.getElementById('edit-profile-password-btn').value === 'No Password' && 
        password === '') {
        alert('Password should not be empty.');
        return;
    }
    else if (document.getElementById('edit-profile-password-btn').value === 'No Password') {
        body.password = password;
    }

    // Check email
    if (email !== '' && !(/^[^@]+@[^@]+$/.test(email))) {
        alert('Invalid email format.');
        return;
    }

    if (name !== myself.name) {
        body.name = name;
    }

    if (email !== myself.email) {
        body.email = email;
    }

    // Submit
    if (Object.keys(body).length > 0) {
        const res = api.makeAPIUpdateRequest('PUT', '/user/', getToken(), JSON.stringify(body));
        res.then((s) => {
            // Succeed
            if (s === 200) {
                document.getElementById('user-profile-name').innerHTML = name.bold();
                document.getElementById('user-profile-email').innerHTML = email.bold();
                removeElement('edit-profile-form');
                myself.name = name;
                myself.email = email;
            }
            // Fail
            else {
                alert('Update failed.');
                return;
            }
        });
    }
    // Nothing to update
    else {
        removeElement('edit-profile-form');
    }
}