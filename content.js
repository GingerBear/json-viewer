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

  setTimeout(initNavClick, 10);
  setTimeout(initCollapseClick, 10);
  setTimeout(initHashChange, 10);
  initFormButton();

  function initNavClick() {
    nav.onclick = function(e) {
      e.preventDefault();
      if (e.target.hash) {
        window.location.replace(e.target.hash);
      }
    };
  }

  function initCollapseClick() {
    document.body.addEventListener('click', function(e) {
      var target = e.target;
      if(target.classList.contains('collapse-open')) {
        target.classList.remove('collapse-open');
        target.classList.add('collapse-close');
      } else if (target.classList.contains('collapse-close')) {
        target.classList.remove('collapse-close');
        target.classList.add('collapse-open');
      }
    });
  }

  function initHashChange() {
    window.onhashchange = handleHashChange;
    handleHashChange();

    function handleHashChange() {
      var hash = window.location.hash;
      if (!hash) return;
      var focus = document.querySelector('[id="' + hash.replace('#', '') + '"]');
      if (focus) {
        document.querySelectorAll('.focus').forEach(function(node) {
          node.classList.remove('focus');
        });
        focus.parentNode.classList.add('focus');
        if (document.body.scrollHeight - focus.parentNode.offsetTop > 200) {
          window.scroll(0, window.scrollY - 150);
        }
      }
    }
  }

  function format(path, json, level) {
    if (json instanceof Array) {
      return formatArray(path, json, level);
    } else if (json && typeof json === 'object') {
      return formatObject(path, json, level);
    } else {
      return formatValue(path, json, level);
    }
  }

  function formatArray(path, json, level) {
    var child = {};
    var formated = '<ul class="array level-' + level + '">';
    var last = false;
    var marker = '';
    for (var i = 0; i < json.length; i++) {
      if (level <= 2) {
        var hrefId = path +'-'+ i + '-' + level;
        if (level === 0) {
          hrefId = i + '-' + level;
        }
        topHashLinks.push('<li class="level-' + level + '"><a class="" href="#' + hrefId + '">' + path + '[' + i + ']</a></li>');
        marker = '<span id="' + hrefId + '"></span>';
      }

      child = format(level === 0 ? i : path + '-' + i, json[i], level + 1);
      last = (i === json.length - 1);

      formated += '<li class="array-item type-' + child.type + ' ' + (last ? 'last' : '') + ' ' + (child.empty ? 'empty' : '') + '">' + marker + child.val + '</li>';
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

  function formatObject(path, json, level) {
    var child = {};
    var last = false;
    var i = 0;
    var size = objSize(json);
    var formated = '<ul class="object level-' + level + '">';
    var marker = '';

    for (var key in json) {
      if (level <= 2) {
        var hrefId = path +'-'+ key;
        if (level === 0) {
          hrefId = key;
        }
        topHashLinks.push('<li class="level-' + level + '"><a class="" href="#' + hrefId + '">' + key + '</a></li>');
        marker = '<span id="' + hrefId + '"></span>';
      }

      last = (i === size - 1);
      child = format(level === 0 ? key : path + '-' + key, json[key], level + 1);

      if (path === 'forms') {
        key = makeFormButton(key, json[key]);
      }


      formated += '<li class="object-item">';
      formated += marker;

      if (child.type !== 'value' && !child.empty) {
        formated += '<span class="object-key collapse-open">' + key + ':</span>';
      } else {
        formated += '<span class="object-key">' + key + ':</span>';
      }
      formated += '<span class="object-value type-' + child.type + ' ' + (last ? 'last' : '') + ' ' + (child.empty ? 'empty' : '') + '">' + child.val + '</span></li>';
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

  function formatValue(path, json, level) {
    if (typeof json === 'string' && (json.indexOf('http') === 0 || json.indexOf('/') === 0)) {
      json = '<a href="' + json + '">' + json + '</a>';
    }
    var value = typeof json === 'string' ? '"' + json + '"' : json ;
    return {
      type: 'value',
      val: '<span class="value level-' + level + '"><span class="value value-type-' + typeof json + '">' + value + '</span></span>'
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
    document.body.addEventListener('click', function(e) {
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
    });
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