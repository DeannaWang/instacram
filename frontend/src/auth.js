/*
  Handle log in and sign up
*/

import { API_URL } from './api.js';
import { removeElement } from './helpers.js';

const api_login = '/auth/login';
const api_signup = '/auth/signup';

export function getToken () {
    return localStorage.getItem("token");
}

export function setToken (token) {
    localStorage.setItem("token", token);
}

export function clearToken () {
    localStorage.removeItem("token");
}

export function hasToken () {
    return localStorage.getItem("token") !== null && localStorage.getItem("token") !== '';
}

export function submitSignup() {
    const email = document.getElementById("signup-email").value;
    const name = document.getElementById("signup-name").value;
    const username = document.getElementById("signup-username").value;
    const password = document.getElementById("signup-password").value;
    const repassword = document.getElementById("signup-repassword").value;
    if (password !== repassword) {
        alert('Those passwords didn\'t match. Try again.');
        return;
    }

    if (username === '') {
        alert('Uername should not be empty.');
        return;
    }

    if (email !== '' && !(/^[^@]+@[^@]+$/.test(email))) {
        alert('Invalid email format.');
        return;
    }

    const signup_url = API_URL + api_signup;
    fetch(signup_url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            username: username,
            password: password,
            email: email,
            name: name
        })
    })
    .then((response) => {
        if (response.status === 400) {
            alert('Invalid input! ');
            return {'token': ''};
        }
        else if (response.status === 409) {
            alert('Username already exists! ');
            return {'token': ''};
        }
        else {
            return response.json();
        }
    }).then(function(data){
        let token = `${data.token}`;
        setToken(token);
        if (token !== '') {
            location.replace(location.pathname);
            removeElement('signup-form');
        }
    })
}

export function submitLogin() {
    const login_url = API_URL + api_login;
    fetch(login_url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            username: document.getElementById("login-username").value,
            password: document.getElementById("login-password").value
        })
    })
    .then((response) => {
        if (response.status === 400) {
            alert('Input should not be empty! ');
            return {'token': ''};
        }
        else if (response.status === 401) {
            alert('Log in failed! ');
            return {'token': ''};
        }
        else {
            return response.json();
        }
    }).then(function(data){
        let token = `${data.token}`;
        setToken(token);
        if (token !== '') {
            location.replace(location.pathname);
            removeElement('login-form');
        }
    })
}