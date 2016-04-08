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
  var formModal = document.createElement('div');

  text.style.display = 'none';

  viewer.setAttribute('id', 'viewer');
  document.body.appendChild(viewer);

  nav.setAttribute('id', 'nav');
  document.body.appendChild(nav);

  formModal.setAttribute('id', 'form');
  document.body.appendChild(formModal);

  viewer.innerHTML = formated.val;
  if (topHashLinks.length) {
    nav.innerHTML = topHashLinks.join('');
  }

  setTimeout(initScrollHover, 10);
  initFormButton();

  function initScrollHover() {
    var lastPosition = null;
    var topPin = [180, 0];
    var bottomPin = [180, window.screen.height];
    var navLinks = Array.prototype.slice.call(nav.querySelectorAll('a'));

    nav.onmousemove = function(e) {
      if (!lastPosition) {
        lastPosition = {x: e.x, y: e.y};
        goTo(e.target.hash)
        return;
      }

      if (checkShouldMove(e, lastPosition)) {
        goTo(e.target.hash)
      }

      lastPosition = {x: e.x, y: e.y};
    };

    function goTo(hash) {
      if(hash && window.location.hash !== hash) {
        window.location.replace(hash);
      }
    }

    function checkShouldMove(currentPos, lastPos) {
      var shouldMove = false;

      if (currentPos.x < lastPos.x) {
        shouldMove = true;
      }

      if ((currentPos.y < lastPos.y && ((currentPos.y - topPin[1]) / (topPin[0] - currentPos.x)) > ((lastPos.y - topPin[1]) / (topPin[0] - lastPos.x)))
        || (currentPos.y > lastPos.y && ((bottomPin[1] - currentPos.y) / (bottomPin[0] - currentPos.x)) > ((bottomPin[1] - lastPos.y) / (bottomPin[0] - lastPos.x)))) {
          shouldMove = false;
      } else {
        shouldMove = true;
      }

      return shouldMove;
    }

    var linkPositions = navLinks.map(function(l) {
      return {
        link: l,
        targetY: document.querySelector(l.getAttribute('href')) ? document.querySelector(l.getAttribute('href')).offsetTop : 0
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
      if (level <= 2) {
        var hrefId = 'arr-' + parentKey +'-'+ i + '-' + level;
        topHashLinks.push('<li class="level-' + level + '"><a class="" href="#' + hrefId + '">Array[' + i + ']</a></li>');
        formated += '<span id="' + hrefId + '"></span>';
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
      if (level <= 2) {
        var hrefId = 'obj-' + parentKey +'-'+ key;
        topHashLinks.push('<li class="level-' + level + '"><a class="" href="#' + hrefId + '">' + key + '</a></li>');
        formated += '<span id="' + hrefId + '"></span>';
      }

      last = (i === size - 1);
      child = format(key, json[key], level + 1);

      if (parentKey === 'forms') {
        key = makeFormButton(key, json[key]);
      }

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

  function makeFormButton(key, values) {
    var button = document.createElement('button');
    button.classList.add('form-button');
    button.dataset.form = btoa(JSON.stringify(values));
    button.textContent = key;
    return button.outerHTML;
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

  function newImgNode(src) {
    var img = document.createElement('img');
    img.src = src;
    return img;
  }

  function initFormButton() {
    document.body.onclick = function(e) {
      if(e.target.classList.contains('form-button')) {
        var button = e.target;
        var dataForm = button.dataset.form;
        var title = button.innerText;

        try {
          dataForm = JSON.parse(atob(dataForm));
        } catch (e) {
          return ;
        }

        var formHTML = makeForm(title, dataForm);
        formModal.innerHTML = formHTML;
      }

      if(e.target.classList.contains('close-form')) {
        e.preventDefault();
        e.target.parentNode.remove();
      }

      if(e.target.classList.contains('form-submit')) {
        e.preventDefault();
        var form = document.querySelector('#form form');
        var req = new XMLHttpRequest();
        var data = '';

        for (var i = 0; i < form.elements.length; i++) {
          if (form.elements.item(i).name) {
            data += encodeURIComponent(form.elements.item(i).name)
              + '=' + encodeURIComponent(form.elements.item(i).value) + '&';
          }
        }

        req.open(form.getAttribute('method'), form.action);
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        req.onreadystatechange = function() {
          if (req.readyState == 4) {
            var div = document.createElement('div');
            div.classList.add('form-result');
            div.textContent = req.status + ': ' + req.responseText;
            form.appendChild(div);
          }
        };
        req.send(data);
      }
    }
  }

  function makeForm(title, data) {
    var form = '<form method="' + data.method + '" action="' + data.action + '" target="_blank">';
    form += '<a class="close-form" href="#">&times;</a>';
    form += '<h2>' + title + '</h2>';
    for (var key in data.inputs) {
      form += '<div><label>' + key + '</label><input type="text" name="' + key + '" value="' + data.inputs[key] + '"></div>';
    }
    for (var key in data.prompt) {
      form += '<div><label>' + key + '</label><input type="text" name="' + key + '" value=""></div>';
    }

    form += '<button class="form-submit" >Submit</button>';
    form += '</form>';
    return form;
  }
}