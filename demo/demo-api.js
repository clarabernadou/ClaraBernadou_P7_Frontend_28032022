/*
 * Mode démo de Groupomania.
 * L’API Node/Express/MySQL du projet (http://localhost:8080/api) est simulée
 * dans le navigateur : utilisateurs, publications et commentaires sont gardés
 * dans le localStorage du visiteur, à partir de quelques données de départ.
 */
(function () {
  'use strict';

  var API_URL = /^https?:\/\/localhost:8080\/api\/(.*)$/;
  var STORE_KEY = 'groupomania_demo_store_v1';
  var BANNER_KEY = 'groupomania_demo_banner';
  var ROOT = new URL('./', document.currentScript.src).href;
  var RESPONSE_DELAY = 150;
  var DEMO_PASSWORD = 'Demo1234';
  var STATUS_TEXT = { 200: 'OK', 400: 'Bad Request', 401: 'Unauthorized', 404: 'Not Found', 500: 'Internal Server Error' };

  var nativeFetch = window.fetch.bind(window);
  var nativeOpen = XMLHttpRequest.prototype.open;
  var nativeSend = XMLHttpRequest.prototype.send;
  var nativeSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
  var store = null;

  /* ---------- Outils ---------- */

  function readStore() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function saveStore() {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch (error) {
      /* Stockage plein ou bloqué : les données restent en mémoire pour la session. */
    }
  }

  function sha256(text) {
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buffer) {
        return Array.prototype.map.call(new Uint8Array(buffer), function (byte) {
          return ('0' + byte.toString(16)).slice(-2);
        }).join('');
      });
    }
    return Promise.resolve('plain:' + text);
  }

  /* Image générée pour les publications de départ (aucune image externe). */
  function postArt(label) {
    var palettes = [['#c0392b', '#f5b7b1'], ['#1f6f8b', '#a8d8ea'], ['#2e7d32', '#c8e6c9'], ['#6a1b9a', '#e1bee7'], ['#e67e22', '#fad7a0']];
    var seed = 0;
    for (var i = 0; i < label.length; i++) {
      seed += label.charCodeAt(i);
    }
    var colors = palettes[seed % palettes.length];
    var canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 375;
    var context = canvas.getContext('2d');
    var gradient = context.createLinearGradient(0, 0, 600, 375);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 600, 375);
    context.fillStyle = 'rgba(255, 255, 255, 0.25)';
    context.beginPath();
    context.arc(470, 110, 85, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(130, 290, 120, 0, Math.PI * 2);
    context.fill();
    return canvas.toDataURL('image/png');
  }

  /* Réduit la photo envoyée par le visiteur pour tenir dans le localStorage. */
  function fileToImage(file) {
    return new Promise(function (resolve) {
      if (!file) {
        resolve(null);
        return;
      }
      var reader = new FileReader();
      reader.onerror = function () { resolve(null); };
      reader.onload = function () {
        var image = new Image();
        image.onerror = function () { resolve(null); };
        image.onload = function () {
          var ratio = Math.min(1, 600 / Math.max(image.width, image.height));
          var canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * ratio));
          canvas.height = Math.max(1, Math.round(image.height * ratio));
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function readBody(body) {
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      var fields = {};
      var file = null;
      body.forEach(function (value, key) {
        if (key === 'image' && value instanceof File) {
          file = value;
        } else if (typeof value === 'string') {
          fields[key] = value;
        }
      });
      return { data: fields, file: file };
    }
    if (typeof body === 'string') {
      try { return { data: JSON.parse(body), file: null }; } catch (error) { /* corps invalide */ }
    }
    return { data: {}, file: null };
  }

  function reply(status, payload) {
    return { status: status, payload: payload };
  }

  function nextId(list) {
    return list.reduce(function (max, item) { return Math.max(max, Number(item.id) || 0); }, 0) + 1;
  }

  /* ---------- Données de départ ---------- */

  function ensureStore() {
    if (store) {
      return Promise.resolve(store);
    }
    store = readStore();
    if (store) {
      return Promise.resolve(store);
    }
    var accounts = [
      { id: 1, username: 'Demo', email: 'demo@groupomania.fr' },
      { id: 2, username: 'Camille', email: 'camille@groupomania.fr' },
      { id: 3, username: 'Julien', email: 'julien@groupomania.fr' }
    ];
    return Promise.all(accounts.map(function (account) {
      return sha256(account.email + ':' + DEMO_PASSWORD).then(function (hash) {
        return { id: account.id, username: account.username, email: account.email, hash: hash };
      });
    })).then(function (users) {
      var now = new Date().toISOString();
      store = {
        users: users,
        publications: [
          {
            id: 1, userId: 2, username: 'Camille', createdAt: now, imageUrl: postArt('bienvenue'),
            description: 'Bienvenue sur le réseau social interne de Groupomania ! Partagez ici vos idées et vos actualités.',
            comments: [{ id: 1, username: 'Julien', descriptionComment: 'Merci Camille, très bonne initiative !', publicationId: 1 }]
          },
          {
            id: 2, userId: 3, username: 'Julien', createdAt: now, imageUrl: postArt('reunion'),
            description: 'Rappel : la réunion d’équipe de jeudi est déplacée à 10 h.',
            comments: []
          },
          {
            id: 3, userId: 1, username: 'Demo', createdAt: now, imageUrl: postArt('demo'),
            description: 'Premier message de la démo : essayez de publier, de commenter et de supprimer un message.',
            comments: []
          }
        ]
      };
      saveStore();
      return store;
    });
  }

  /* ---------- Routes de l’API ---------- */

  function userFromToken(headers) {
    var match = /^Bearer demo\.(.+)$/.exec(headers.authorization || '');
    var id = match ? match[1] : null;
    return store.users.filter(function (user) { return String(user.id) === id; })[0] || null;
  }

  function signin(data) {
    var email = String(data.email || '').trim().toLowerCase();
    return sha256(email + ':' + String(data.password || '')).then(function (hash) {
      var user = store.users.filter(function (item) { return item.email === email; })[0];
      if (!user) {
        return reply(404, { message: 'User Not found.' });
      }
      if (user.hash !== hash) {
        return reply(401, { accessToken: null, message: 'Invalid Password!' });
      }
      return reply(200, { id: user.id, username: user.username, email: user.email, roles: ['ROLE_USER'], token: 'demo.' + user.id });
    });
  }

  function signup(data) {
    var email = String(data.email || '').trim().toLowerCase();
    if (!data.username || !email || !data.password) {
      return Promise.resolve(reply(400, { message: 'Username, email and password are required.' }));
    }
    if (String(data.password).length < 8) {
      return Promise.resolve(reply(400, { message: 'Password must contain at least 8 characters.' }));
    }
    if (store.users.some(function (item) { return item.email === email; })) {
      return Promise.resolve(reply(400, { message: 'Failed! Email is already in use!' }));
    }
    return sha256(email + ':' + String(data.password)).then(function (hash) {
      store.users.push({ id: nextId(store.users), username: data.username, email: email, hash: hash });
      saveStore();
      return reply(200, { message: 'User registered successfully!' });
    });
  }

  function findPublication(id) {
    return store.publications.filter(function (item) { return String(item.id) === String(id); })[0] || null;
  }

  function createPublication(user, body) {
    var request = readBody(body);
    return fileToImage(request.file).then(function (image) {
      var publication = {
        id: nextId(store.publications),
        userId: Number(request.data.userId) || user.id,
        username: request.data.username || user.username,
        description: request.data.description || '',
        imageUrl: image || postArt(String(request.data.description || 'nouveau')),
        createdAt: new Date().toISOString(),
        comments: []
      };
      store.publications.push(publication);
      saveStore();
      return reply(200, publication);
    });
  }

  function createComment(publicationId, body) {
    var data = readBody(body).data;
    var publication = findPublication(data.publicationId || publicationId);
    if (!publication) {
      return reply(404, { message: 'Publication not found.' });
    }
    var all = [];
    store.publications.forEach(function (item) { all = all.concat(item.comments); });
    var comment = {
      id: nextId(all),
      username: data.username,
      descriptionComment: data.descriptionComment,
      publicationId: publication.id
    };
    publication.comments.push(comment);
    saveStore();
    return reply(200, comment);
  }

  function route(method, path, headers, body) {
    var parts = path.split('?')[0].replace(/\/+$/, '').split('/');
    return ensureStore().then(function () {
      if (parts[0] === 'auth' && parts[1] === 'signin' && method === 'POST') {
        return signin(readBody(body).data);
      }
      if (parts[0] === 'auth' && parts[1] === 'signup' && method === 'POST') {
        return signup(readBody(body).data);
      }
      var user = userFromToken(headers);
      if (!user) {
        return reply(401, { message: 'Unauthorized!' });
      }
      if (parts[0] === 'auth') {
        if (parts[1] === 'signout') {
          return reply(200, { message: 'You have been signed out.' });
        }
        var target = store.users.filter(function (item) { return String(item.id) === parts[3] || String(item.id) === parts[2]; })[0];
        if (parts[1] === 'profile' && parts[2] === 'update' && method === 'PUT' && target) {
          var update = readBody(body).data;
          target.username = update.username || target.username;
          target.email = String(update.email || target.email).toLowerCase();
          saveStore();
          return reply(200, { message: 'Profile updated successfully!' });
        }
        if (parts[1] === 'profile' && parts[2] === 'delete' && method === 'DELETE' && target) {
          store.users.splice(store.users.indexOf(target), 1);
          saveStore();
          return reply(200, { message: 'User deleted successfully!' });
        }
        if (parts[1] === 'profile' && method === 'GET' && target) {
          return reply(200, { id: target.id, username: target.username, email: target.email });
        }
        return reply(404, { message: 'Not found.' });
      }
      if (parts[0] === 'publications' && method === 'GET') {
        return reply(200, store.publications);
      }
      if (parts[0] === 'publication' && parts[1] === 'create' && method === 'POST') {
        return createPublication(user, body);
      }
      if (parts[0] === 'publication' && parts[1] === 'delete' && method === 'DELETE') {
        var publication = findPublication(parts[2]);
        if (!publication) {
          return reply(404, { message: 'Publication not found.' });
        }
        store.publications.splice(store.publications.indexOf(publication), 1);
        saveStore();
        return reply(200, { message: 'Publication deleted successfully!' });
      }
      if (parts[1] === 'comments' && method === 'POST') {
        return createComment(parts[0], body);
      }
      if (parts[1] === 'comments' && parts[2] === 'delete' && method === 'DELETE') {
        var owner = findPublication(parts[0]);
        var index = owner ? owner.comments.map(function (item) { return String(item.id); }).indexOf(parts[3]) : -1;
        if (index < 0) {
          return reply(404, { message: 'Comment not found.' });
        }
        owner.comments.splice(index, 1);
        saveStore();
        return reply(200, { message: 'Comment deleted successfully!' });
      }
      return reply(404, { message: 'Not found.' });
    });
  }

  /* ---------- Interception de fetch ---------- */

  function jsonResponse(result) {
    return new Response(JSON.stringify(result.payload), { status: result.status, headers: { 'Content-Type': 'application/json' } });
  }

  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || String(input);
    var match = API_URL.exec(url);
    if (!match) {
      return nativeFetch(input, init);
    }
    var method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    var headers = {};
    new Headers((init && init.headers) || {}).forEach(function (value, key) { headers[key.toLowerCase()] = value; });
    return route(method, match[1], headers, init && init.body)
      .catch(function () { return reply(500, { message: 'Demo API failure' }); })
      .then(jsonResponse);
  };

  /* ---------- Interception de XMLHttpRequest (axios) ---------- */

  function finish(xhr, url, result) {
    var text = JSON.stringify(result.payload);
    var fields = {
      readyState: 4,
      status: result.status,
      statusText: STATUS_TEXT[result.status] || '',
      responseURL: url,
      responseText: text,
      response: xhr.responseType === 'json' ? JSON.parse(text) : text
    };
    Object.keys(fields).forEach(function (key) {
      Object.defineProperty(xhr, key, { value: fields[key], configurable: true });
    });
    xhr.getAllResponseHeaders = function () { return 'content-type: application/json; charset=utf-8\r\n'; };
    xhr.getResponseHeader = function (name) { return /^content-type$/i.test(name) ? 'application/json; charset=utf-8' : null; };
    xhr.dispatchEvent(new Event('readystatechange'));
    xhr.dispatchEvent(new ProgressEvent('load'));
    xhr.dispatchEvent(new ProgressEvent('loadend'));
  }

  XMLHttpRequest.prototype.open = function (method, url) {
    var match = API_URL.exec(String(url));
    this.__demo = match ? { method: String(method).toUpperCase(), url: String(url), path: match[1], headers: {} } : null;
    if (this.__demo) {
      return nativeOpen.call(this, method, window.location.href);
    }
    return nativeOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    if (this.__demo) {
      this.__demo.headers[String(name).toLowerCase()] = String(value);
    }
    return nativeSetRequestHeader.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
    var demo = this.__demo;
    if (!demo) {
      return nativeSend.apply(this, arguments);
    }
    var xhr = this;
    route(demo.method, demo.path, demo.headers, body)
      .catch(function () { return reply(500, { message: 'Demo API failure' }); })
      .then(function (result) {
        window.setTimeout(function () { finish(xhr, demo.url, result); }, RESPONSE_DELAY);
      });
  };

  /* ---------- Bandeau d’information ---------- */

  function showBanner() {
    try {
      if (window.sessionStorage.getItem(BANNER_KEY) === 'closed') {
        return;
      }
    } catch (error) { /* sessionStorage indisponible */ }
    var banner = document.createElement('div');
    banner.setAttribute('role', 'note');
    banner.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:99999;max-width:330px;padding:10px 12px;' +
      'border-radius:10px;background:#1f2933;color:#fff;font:13px/1.45 Arial,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.35)';
    banner.innerHTML = '<strong>Mode démo</strong> : l’API est simulée dans votre navigateur ' +
      '(les données restent sur votre appareil).<br>Compte test : <code style="color:#ffd1b0">demo@groupomania.fr</code> / ' +
      '<code style="color:#ffd1b0">' + DEMO_PASSWORD + '</code><br>' +
      '<a href="#" data-reset style="color:#ffb27a">Réinitialiser la démo</a> · <a href="#" data-close style="color:#ffb27a">Fermer</a>';
    banner.querySelector('[data-close]').addEventListener('click', function (event) {
      event.preventDefault();
      try { window.sessionStorage.setItem(BANNER_KEY, 'closed'); } catch (error) { /* ignoré */ }
      banner.remove();
    });
    banner.querySelector('[data-reset]').addEventListener('click', function (event) {
      event.preventDefault();
      try {
        window.localStorage.removeItem(STORE_KEY);
        ['token', 'username', 'email', 'userId'].forEach(function (key) { window.localStorage.removeItem(key); });
      } catch (error) { /* ignoré */ }
      window.location.href = ROOT;
    });
    document.body.appendChild(banner);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    showBanner();
  }
})();
