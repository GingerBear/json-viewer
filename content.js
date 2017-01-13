init();

function init() {

    var text = document.querySelector('pre');
    var bodyChildren = document.body.childNodes;
    var isContinue = bodyChildren.length === 1 && (text ? bodyChildren[0] === text : true);
    if (!isContinue) return;

    var json;

    if (!text && typeof bodyChildren[0] === 'object') {
        text = document.body;
    }

    try {
        json = JSON.parse(text.innerHTML);
        text.remove();
    } catch (e) {
        return;
    }

    loadCSS();
    // injectCSS();

    var topHashLinks = [];
    var formated = format('', json, 0);
    var viewer = document.createElement('div');
    var nav = document.createElement('div');
    var formModal = document.createElement('div');
    var diggerInput = document.createElement('input');

    diggerInput.setAttribute('id', 'diggerInput');
    diggerInput.setAttribute('type', 'text');
    document.body.appendChild(diggerInput);

    viewer.setAttribute('id', 'viewer');
    document.body.appendChild(viewer);

    formModal.setAttribute('id', 'form');
    document.body.appendChild(formModal);

    nav.setAttribute('id', 'nav');
    document.body.appendChild(nav);

    viewer.innerHTML = formated.val;

    if (topHashLinks.length) {
        nav.innerHTML = topHashLinks.join('');
    }

    setTimeout(initNavClick, 10);
    setTimeout(initCollapseClick, 10);
    setTimeout(initHashChange, 10);
    setTimeout(initDigger, 10);
    initFormButton();

    function initNavClick() {
        nav.onclick = function (e) {
            e.preventDefault();
            if (e.target.hash) {
                window.location.replace(e.target.hash);
            }
        };
    }

    function initCollapseClick() {
        document.body.addEventListener('click', function (e) {
            var target = e.target;
            if (target.classList.contains('collapse-open')) {
                target.classList.remove('collapse-open');
                target.classList.add('collapse-close');
            } else if (target.classList.contains('collapse-close')) {
                target.classList.remove('collapse-close');
                target.classList.add('collapse-open');
            } else if (target.classList.contains('collapse-dots')) {
                var closed = target.parentNode && target.parentNode.previousSibling;
                if (closed && closed.classList.contains('collapse-close')) {
                    closed.classList.remove('collapse-close');
                    closed.classList.add('collapse-open');
                }
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
                document.querySelectorAll('.focus').forEach(function (node) {
                    node.classList.remove('focus');
                });
                focus.parentNode.classList.add('focus');
            }
        }
    }

    // todo;
    function initDigger() {
        diggerInput.addEventListener('keyup', function (e) {
            var path = e.target.value;

            if (!path) {
                viewer.innerHTML = format('', json, 0).val;
                return;
            }

            console.log(path)
            var newJson = eval(`
                try {
                    json.${path}
                } catch(e) {}
            `);

            viewer.innerHTML = format('', newJson, 0).val;
        });
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
                var hrefId = path + '-' + i + '-' + level;
                if (level === 0) {
                    hrefId = i + '-' + level;
                }
                topHashLinks.push('<li class="level-' + level + '"><a class="" href="#' + hrefId + '">' + path + '[' + i + ']</a></li>');
                marker = '<span id="' + hrefId + '"></span>';
            }

            child = format(level === 0 ? i : path + '-' + i, json[i], level + 1);
            last = (i === json.length - 1);

            formated += '<li class="array-item type-' + child.type + ' ' + ' ' + (child.empty ? 'empty' : '') + '">' +
                getSpace(level + 1) +
                (child.type === 'array' ? '[' : (child.type === 'object' ? '{' : '')) +
                marker + child.val +
                ((child.type === 'value') ? '' : getSpace(level + 1)) +
                (child.type === 'array' ? ']' : (child.type === 'object' ? '}' : '')) +
                (last ? '' : ',') +
                '</li>';
        }
        formated += '</ul>';

        if (json.length === 0) {
            formated = '';
        }

        if (level === 0) {
            formated = '<div class="object-value type-array last">' +
                '[' +
                formated +
                ']' +
                '</div>';
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
                var hrefId = path + '-' + key;
                if (level === 0) {
                    hrefId = key;
                }
                topHashLinks.push('<li class="level-' + level + '"><a class="" href="#' + hrefId + '">' + key + '</a></li>');
                marker = '<span id="' + hrefId + '"></span>';
            }

            fist = (i === 0);
            last = (i === size - 1);
            child = format(level === 0 ? key : path + '-' + key, json[key], level + 1);

            if (path === 'forms') {
                key = makeFormButton(key, json[key]);
            }


            formated += '<li class="object-item">';
            formated += marker;

            if (child.type !== 'value' && !child.empty) {
                formated += getSpace(level + 1) + '<span class="object-key collapse-open">' + key + ':&nbsp;</span>';
            } else {
                formated += getSpace(level + 1) + '<span class="object-key">' + key + ':&nbsp;</span>';
            }
            formated += '<span class="object-value type-' + child.type + ' ' + (last ? 'last' : '') + ' ' + (child.empty ? 'empty' : '') + '">' +
                (child.type === 'array' ? '[' : (child.type === 'object' ? '{' : '')) +
                '<span class="collapse-dots">...</span>' +
                child.val +
                (child.type === 'array' ? (child.empty ? ']' : getSpace(level + 1) + ']') : (child.type === 'object' ? getSpace(level + 1) + '}' : '')) +
                (last ? '' : ',') +
                '</span></li>';
            i++
        }
        formated += '</ul>';

        if (objSize(json) === 0) {
            formated = '';
        }

        if (level === 0) {
            formated = '<div class="object-value type-object last">' +
                '{' +
                formated +
                '}' +
                '</div>';
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
        var value = typeof json === 'string' ? '"' + json + '"' : json;
        return {
            type: 'value',
            val: '<span class="value level-' + level + ' value-type-' + typeof json + '">' + value + '</span>'
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

    function initFormButton() {
        document.body.addEventListener('click', function (e) {
            if (e.target.classList.contains('form-button')) {
                var button = e.target;
                var dataForm = button.dataset.form;
                var title = button.innerText;

                try {
                    dataForm = JSON.parse(atob(dataForm));
                } catch (e) {
                    return;
                }

                var formHTML = makeForm(title, dataForm);
                formModal.innerHTML = formHTML;
            }

            if (e.target.classList.contains('close-form')) {
                e.preventDefault();
                e.target.parentNode.remove();
            }

            if (e.target.classList.contains('form-submit')) {
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
                req.onreadystatechange = function () {
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

    function getSpace(num) {
        var a = '';
        for (var i = 0; i < num; i++) {
            a += '&nbsp;&nbsp;'
        }
        return '<span class="space">' + a + '</span>';
    }


    function loadCSS() {
        var style = document.createElement('link');
        style.rel = "stylesheet";
        style.type = "text/css";
        style.href = chrome.extension.getURL("content.css");
        document.head.appendChild(style);
    }

    function injectCSS() {
        var css = `h2,span{font-size:12px;color:#333}.object-key,.object-value.type-value{display:inline-block}#form form,#history span,#nav{position:fixed}#form form,#nav{overflow:scroll}*{margin:0;padding:0;font-family:monospace;box-sizing:border-box}body{padding:10px}ul{list-style:none}.focus{background:#eee}.object-key{font-weight:700;vertical-align:top}.collapse-close,.collapse-open{cursor:pointer}.collapse-open+*>ul{display:block}.collapse-close+*>ul,.collapse-dots{display:none}.collapse-close+* .collapse-dots{display:inline;cursor:pointer}.collapse-close+* .space{display:none}.collapse-close:before,.collapse-open:before{color:#bbb;border:1px solid #ddd;display:inline-block;padding:0 1px;margin-right:2px;line-height:10px;margin-left:-12px}.collapse-open:before{content:'-'}.collapse-close:before{content:'+'}.object-value.type-value .value{display:inline-block}.value{margin-left:0}.value-type-boolean,.value-type-number{color:brown}.value-type-string{color:green}#viewer{margin-left:180px;min-width:800px}#nav .level-0,#nav .level-1,#nav .level-2{margin-left:0;display:block}#nav{left:0;top:10px;background:rgba(256,256,256,.8);padding:0 5px 20px;border-right:1px solid #eee;width:180px;height:100%}#nav a{color:#333;display:block;padding:2px 5px;text-decoration:none}#nav a:hover{background:#f5f5f5}#nav a.active{background:#eee}#history span{width:5px;height:5px;background:red}#nav .level-0{padding-left:0;margin-top:3px;font-weight:700}#nav .level-0:first-of-type{margin-top:0}#nav .level-1{padding-left:10px}#nav .level-2{padding-left:15px;font-size:10px}#nav .level-2 a{color:#999}#nav .level-2 a:before{content:'-';margin-right:3px;color:#999}button{padding:5px;border-radius:3px;background:#fff}#form form{top:200px;left:220px;width:500px;padding:15px;box-shadow:0 4px 15px 0 rgba(0,0,0,.5);background:#fff;max-height:800px}#form h2{margin-bottom:15px}#form label{margin-right:10px;min-width:120px;display:inline-block}#form input{margin-bottom:5px;padding:5px}#form .close-form{font-size:3rem;float:right;color:#ccc;text-decoration:none;line-height:35px;margin-right:-15px;margin-top:-8px;padding:0 10px}#form .form-result{padding:5px;margin-top:10px;background:#eee;max-height:100px;overflow:scroll}`;

        var head = document.head || document.getElementsByTagName('head')[0];
        var style = document.createElement('style');
        style.appendChild(document.createTextNode(css));

        head.appendChild(style);
    }

}