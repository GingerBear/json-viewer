init();

function init() {
  var text = document.querySelector('pre');
  if (!(document.body.childNodes.length === 1 && document.body.childNodes[0] === text)) {
    return;
  }

  var json;
  try {
    json = JSON.parse(text.innerHTML);
  } catch(e) {
    return;
  }

  appendCSS();

  var topHashLinks = [];
  var formated = format('', json, 0);
  var viewer = document.createElement('div');
  var nav = document.createElement('div');
  text.style.display = 'none';

  viewer.setAttribute('id', 'viewer');
  document.body.appendChild(viewer);

  nav.setAttribute('id', 'nav');
  document.body.appendChild(nav);

  viewer.innerHTML = formated.val;
  if (topHashLinks.length) {
    nav.innerHTML = topHashLinks.join('');
  }

  setTimeout(initScrollHover, 10);
  function initScrollHover() {
    var navLinks = Array.prototype.slice.call(nav.querySelectorAll('a'));
    navLinks.forEach(function(l) {
      l.onmouseenter = function(e) {
        window.location.replace(e.target.hash);
      }
    });

    var linkPositions = navLinks.map(function(l) {
      return {
        link: l,
        targetY: document.querySelector(l.getAttribute('href')).offsetTop
      }
    });

    window.onscroll = function() {
      window.requestAnimationFrame(function() {
        var active = null;
        for (var i = 0; i < linkPositions.length; i++) {
          if (linkPositions[i].targetY - 10 > window.scrollY) {
            linkPositions[i].link.classList.remove('active');
          } else {
            linkPositions[i].link.classList.remove('active');
            active = linkPositions[i];
          }
        }
        active && active.link.classList.add('active');
      });
    }
  }

  function format(parentKey, json, level) {
    if (json instanceof Array) {
      return formatArray(parentKey, json, level);
    } else if (json && typeof json === 'object') {
      return formatObject(parentKey, json, level);
    } else {
      return formatValue(parentKey, json, level);
    }
  }

  function formatArray(parentKey, json, level) {
    var child = {};
    var formated = '<ul class="array level-' + level + '">';
    var last = false;
    for (var i = 0; i < json.length; i++) {
      if (level <= 1) {
        topHashLinks.push('<li class="level-' + level + '"><a class="" href="#' + parentKey +'-'+ i + '">Array #' + i + '</a></li>');
        formated += '<span id="' + parentKey +'-'+ i + '"></span>';
      }

      child = format(i, json[i], level + 1);
      last = (i === json.length - 1);

      formated += '<li class="array-item type-' + child.type + ' ' + (last ? 'last' : '') + ' ' + (child.empty ? 'empty' : '') + '">' + child.val + '</li>';
    }
    formated += '</ul>';

    if (json.length === 0) {
      formated = '';
    }

    if (level === 0) {
      formated = '<div class="object-value type-array last">' + formated + '</div>';
    }

    return {
      empty: json.length === 0,
      type: 'array',
      val: formated
    }
  }

  function formatObject(parentKey, json, level) {
    var child = {};
    var last = false;
    var i = 0;
    var size = objSize(json);
    var formated = '<ul class="object level-' + level + '">';

    for (var key in json) {
      if (level <= 1) {
        topHashLinks.push('<li class="level-' + level + '"><a class="" href="#' + parentKey +'-'+ key + '">' + key + '</a></li>');
        formated += '<span id="' + parentKey +'-'+ key + '"></span>';
      }

      last = (i === size - 1);
      child = format(key, json[key], level + 1);

      formated += '<li class="object-item"><h2 class="object-key">' + key + ':</h2>';
      formated += '<div class="object-value type-' + child.type + ' ' + (last ? 'last' : '') + ' ' + (child.empty ? 'empty' : '') + '">' + child.val + '</div></li>';
      i++
    }
    formated += '</ul>';

    if (objSize(json) === 0) {
      formated = '';
    }

    if (level === 0) {
      formated = '<div class="object-value type-object last">' + formated + '</div>';
    }

    return {
      empty: objSize(json) === 0,
      type: 'object',
      val: formated
    }
  }

  function formatValue(parentKey, json, level) {
    if (typeof json === 'string' && (json.indexOf('http') === 0 || json.indexOf('/') === 0)) {
      json = '<a href="' + json + '">' + json + '</a>';
    }
    return {
      type: 'value',
      val: '<div class="value level-' + level + '""><span class="value value-type-' + typeof json + '">' + json + '</span></div>'
    }
  }

  function objSize(obj) {
    var size = 0,
      key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) size++;
    }
    return size;
  }

  function appendCSS() {
    var style = document.createElement('link');
    style.rel = "stylesheet";
	  style.type = "text/css";
    style.href = chrome.extension.getURL("content.css");
    document.head.appendChild(style);
  }
}