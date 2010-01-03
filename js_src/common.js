/*!
 * Rocon: library that creates rounded corners
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://code.google.com/p/rocon/
 */

/**
 * Общие методы и свойства для rocon
 * @author Sergey Chikuyonok (sc@design.ru)
 * @copyright Art.Lebedev Studio (http://www.artlebedev.ru)
 * @include "worker.js"
 */

var re_rule = /\.rc(\d+)\b/,
	re_class = /\brc(\d+(?:\-\d+){0,3})(\-.+?)?\b/,
	re_shape_flag = /\brc-shape\b/,

	/** Базовый класс для создаваемых элементов */
	base_class = 'rocon',
	
	/** Префиск для создаваемых CSS-правил */
	rule_prefix = base_class + '__',
	
	/** Результат, возвращаемый в объект <code>rocon</code> */
	result = {
		/**
		 * Добавление/обновление уголков для динамически созданных элементов.
		 * Может принимать неограниченное количество элементов либо массивов
		 * элементов, у которых нужно обновить уголки  
		 */
		update: function(){},
		
		process: function(context) {
			processRoundedElements(context);
		}
	},

	/** @type {CSSStyleSheet} Таблица стилей для уголков */
	corners_ss = null,
	
	css_text = '',
	
	/** Список функций, которые нужно выполнить при загрузке DOM-дерева */
	dom_ready_list = [],
	
	/** Загрузился ли DOM? */
	is_ready = false,
	
	/** Привязано ли событие, ожидающее загрузку DOM? */
	readyBound = false,

	userAgent = navigator.userAgent.toLowerCase(),
	
	/** Тип и версия браузера пользователя. Взято с jQuery */
	browser = {
		version: (userAgent.match( /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/ ) || [])[1],
		safari: /webkit/.test( userAgent ),
		opera: /opera/.test( userAgent ),
		msie: /msie/.test( userAgent ) && !/opera/.test( userAgent ),
		mozilla: /mozilla/.test( userAgent ) && !/(compatible|webkit)/.test( userAgent )
	};

/**
 * Выполняет все функции, добавленные на событие onDomContentLoaded.
 * Взято с jQuery
 */
function fireReady() {
	//Make sure that the DOM is not already loaded
	if (!is_ready) {
		// Remember that the DOM is ready
		is_ready = true;

		// If there are functions bound, to execute
		if ( dom_ready_list.length ) {
			walkArray(dom_ready_list, function(){
				this.call(document);
			}, true);

			// Reset the list of functions
			dom_ready_list = null;
		}
	}
}

/**
 * Добавляет слушателя на событие onDomContentLoaded
 * @type {Function} fn Слушатель
 */
function addDomReady(fn) {
	dom_ready_list.push(fn);
}

/**
 * Проверка на наступление события onDomContentLoaded. 
 * Взято с jQuery
 */
function bindReady(){
	if ( readyBound ) return;
	readyBound = true;

	// Mozilla, Opera and webkit nightlies currently support this event
	if ( document.addEventListener ) {
		// Use the handy event callback
		document.addEventListener( "DOMContentLoaded", function(){
			document.removeEventListener( "DOMContentLoaded", arguments.callee, false );
			fireReady();
		}, false );

	// If IE event model is used
	} else if ( document.attachEvent ) {
		// ensure firing before onload,
		// maybe late but safe also for iframes
		document.attachEvent("onreadystatechange", function(){
			if ( document.readyState === "complete" ) {
				document.detachEvent( "onreadystatechange", arguments.callee );
				fireReady();
			}
		});

		// If IE and not an iframe
		// continually check to see if the document is ready
		if ( document.documentElement.doScroll && !window.frameElement ) (function(){
			if ( is_ready ) return;

			try {
				// If IE is used, use the trick by Diego Perini
				// http://javascript.nwbox.com/IEContentLoaded/
				document.documentElement.doScroll("left");
			} catch( error ) {
				setTimeout( arguments.callee, 0 );
				return;
			}

			// and execute any waiting functions
			fireReady();
		})();
	}
}

/**
 * Вспомогательная функция, которая пробегается по всем элементам массива
 * <code>ar</code> и выполняет на каждом элементе его элементе функцию
 * <code>fn</code>. <code>this</code> внутри этой функции указывает на 
 * элемент массива
 * @param {Array} ar Массив, по которому нужно пробежаться
 * @param {Function} fn Функция, которую нужно выполнить на каждом элементе массива
 * @param {Boolean} forward Перебирать значения от начала массива (п умолчанию: с конца)
 */
function walkArray(ar, fn, forward) {
	if (forward) {
		for (var i = 0, len = ar.length; i < len; i++)
			if (fn.call(ar[i], i, ar[i]) === false)
				break;
	} else {
		for (var i = ar.length - 1; i >= 0; i--)
			if (fn.call(ar[i], i, ar[i]) === false)
				break;
	}
}

/**
 * Преобразует один массив элементов в другой с помощью функции callback.
 * Взято в jQuery
 * @param {Array} elems
 * @param {Function} callback
 * @return {Array}
 */
function mapArray(elems, callback) {
	var ret = [];

	// Go through the array, translating each of the items to their
	// new value (or values).
	for ( var i = 0, length = elems.length; i < length; i++ ) {
		var value = callback( elems[ i ], i );

		if ( value != null )
			ret[ ret.length ] = value;
	}

	return ret.concat.apply( [], ret );
}

// TODO Добавить исключение при правильной работе border-radius

/**
 * Преобразует цвет из RGB-предствления в hex
 * @param {String} color
 * @return {String}
 */
function convertColorToHex(color) {
	var result;
	function s(num) {
		var n = parseInt(num, 10).toString(16);
		return (n.length == 1) ? n + n : n;
	}
	
	function p(num) {
		return s(Math.round(num * 2.55));
	}
	
	if (result = /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/.exec(color))
		return '#' + s(result[1]) + s(result[2]) + s(result[3]);

	// Look for rgb(num%,num%,num%)
	if (result = /rgb\(\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*\)/.exec(color))
		return '#' + p(result[1]) + p(result[2]) + p(result[3]); 

	// Look for #a0b1c2
	if (result = /#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})/i.exec(color))
		return '#' + result[1] + result[2] + result[3];
		
	if (result = /#([a-f0-9])([a-f0-9])([a-f0-9])/i.exec(color))
		return '#' + result[1] + result[1] + result[2] + result[2] + result[3] + result[3];
	
	s = null;
	p = null;
		
	return color;
}

/**
 * Создает HTML-элемент <code>name</code> с классом <code>class_name</code>
 * @param {String} name Название элемента
 * @param {String} class_name Класс элемента
 * @return {Element}
 */
function createElement(name, class_name) {
	var elem = document.createElement(name);
	if (class_name) {
		elem.className = class_name;
	}
	return elem;
}

/**
 * Простая проверка наличия определенного класса у элемента
 * @param {HTMLElement} elem
 * @param {String} class_name
 * @return {Boolean}
 */
function hasClass(elem, class_name) {
	var re = new RegExp('\\b' + class_name + '\\b');
	return elem.nodeType == 1 && re.test(elem.className || '');
}

/**
 * Add new class to the element
 * @param {String} class_name New class
 * @param {HTMLElement} elem Element to add class
 */
function addClass(class_name, elem) {
	elem.className += ' ' + class_name;
}

var toCamelCase = (function(){
	var cache = {},
		camel = function(str, p1){return p1.toUpperCase();},
		re = /\-(\w)/g;
		
	return function(name) {
		if (!cache[name])
			cache[name] = name.replace(re, camel);
		
		return cache[name];
	}
})();

/**
 * Возвращает значение CSS-свойства <b>name</b> элемента <b>elem</b>
 * @author John Resig (http://ejohn.org)
 * @param {Element} elem Элемент, у которого нужно получить значение CSS-свойства
 * @param {String|Array} name Название CSS-свойства
 * @return {String|Object}
 */
function getStyle(elem, name) {
	var cs, result = {}, n, name_camel, is_array = name instanceof Array;
	
	
	var _name = is_array ? name : [name];
	for (var i = 0; i < _name.length; i++) {
		n = _name[i];
		name_camel = toCamelCase(n);
		
		// If the property exists in style[], then it's been set
		// recently (and is current)
		if (elem.style[name_camel]) {
			result[n] = result[name_camel] = elem.style[name_camel];
		}
		//Otherwise, try to use IE's method
		else if (browser.msie) {
			result[name_camel] = elem.currentStyle[name_camel];
		}
		// Or the W3C's method, if it exists
		else if (document.defaultView && document.defaultView.getComputedStyle) {
			if (!cs)
				cs = document.defaultView.getComputedStyle(elem, "");
			result[n] = result[name_camel] = cs && cs.getPropertyValue(n);
		}
	}
	
//	walkArray(name instanceof Array ? name : [name], function(i, n){
//		
//	});
	
	return is_array ? result : result[toCamelCase(name)];
		
}

/**
 * Разворачивает краткую запись четырехзначного свойства в полную:<br>
 * 	— a      -&gt; a,a,a,a<br>
 *	— a_b    -&gt; a,b,a,b<br>
 *	— a_b_с  -&gt; a,b,с,b<br>
 * 
 * @param {String} prop Значение, которое нужно раскрыть
 * @return {Array} Массив с 4 значениями
 */
function expandProperty(prop) {
	var chunks = (prop || '').split(/[\-_]+/);
		
	switch (chunks.length) {
		case 1:
			return [chunks[0], chunks[0], chunks[0], chunks[0]];
		case 2:
			return [chunks[0], chunks[1], chunks[0], chunks[1]];
		case 3:
			return [chunks[0], chunks[1], chunks[2], chunks[1]];
		case 4:
			return chunks;
	}
	
	return null;
}

/**
 * Возвращает цвет фона элемента
 * @type {Function}
 * @param {Element} elem Элемент, для которого нужно достать цвет фона
 * @return {String} 
 */
var getBg = (function() {

	var session_elems = [], 
		default_color = '#ffffff';
	
	/**
	 * Основной цикл с использованием кэширования
	 */
	function mainLoopCache(elem) {
		var c;
		do {
			if (elem.nodeType != 1)
				break;
			
			if (elem.rocon_bg) { // цвет был найден ранее
				return elem.rocon_bg;
			} else { // цвет еще не найден
				session_elems.push(elem);
				c = getStyle(elem, 'background-color');
				if (c != 'transparent')
					return convertColorToHex(c);
			}
				
		} while (elem = elem.parentNode);
		
		return default_color;
	}
	
	/**
	 * Основной цикл без кэширования
	 */
	function mainLoopNoCache(elem) {
		var c;
		do {
			if (elem.nodeType != 1)
				break;
				
			c = getStyle(elem, 'background-color');
			if (c != 'transparent')
				return convertColorToHex(c);
				
		} while (elem = elem.parentNode);
		
		return default_color;
	}
	
	return function(elem){
		var cl = /* String */elem.className, 
			bg = null;
		
		if (getBg.use_cache) {
			session_elems = [];
			bg = mainLoopCache(elem);
			// закэшируем цвет фона у всех элементов, по которым проходились
			walkArray(session_elems, function(){
				this.rocon_bg = bg;
				getBg.processed_elems.push(this);
			});
			
			session_elems = null;
		} else {
			bg = mainLoopNoCache(elem);
		}
		
		return bg;
	}
})();

getBg.use_cache = true;
getBg.processed_elems = [];

var css_rules_cache = [];

/**
 * Добавляет CSS-правило в стиль
 * @param {String} selector CSS-селектор, для которого нужно добавить правила
 * @param {String} rules CSS-правила
 */
var addRule = (function(){
	
	return function(selector, rules){
		css_rules_cache[css_rules_cache.length] = selector + ' {' + rules + '}';
	}
	
	
	if (browser.msie)
		return function(selector, rules){ css_text += selector + '{' + rules + '}'; }
	else
		return function(selector, rules){ corners_ss.insertRule(selector + ' {' + rules + '}', corners_ss.cssRules.length); }
})();


/**
 * Создает новую таблицу стилей на странице, куда будут добавляться правила
 * для описания скругленных уголков
 * @return {CSSStyleSheet}
 */
function createStylesheet() {
	if (!corners_ss) {
		if (document.createStyleSheet) {
			corners_ss = document.createStyleSheet();
		} else {
			var style = createElement('style');
			style.rel = 'rocon';
			document.getElementsByTagName('head')[0].appendChild(style);
			
			/*
			 * Просто получить самый последний стиль не получится: иногда стили
			 * добавляются внутрь <body> (так делает счетчик Яндекса, например),
			 * в этом случае мы не можем быть уверены, что только что 
			 * добавленная таблица стилей — последняя. Поэтому пробегаетмся 
			 * по всем таблицам в поисках нашей  
			 */ 
			walkArray(document.styleSheets, function(){
				if (this.ownerNode.rel == 'rocon') {
					corners_ss = this;
					return false;
				}
			});
		}
	}
	
	return corners_ss;
}

function applyCSS() {
	if (css_rules_cache.length) {
		var style = createElement('style');
		document.getElementsByTagName('head')[0].appendChild(style);
		
		var sheet = style.sheet;
//		document.body.style.display = 'none';
		
		for (var j = 0; j < css_rules_cache.length; j++) {
			sheet.insertRule(css_rules_cache[j], j);
		}
		
//		document.body.style.display = '';
		
		
//		style.title = 'rocon';
		
		
		
//		console.dir(style);
		
//		var sheets = document.styleSheets;
//		
//		for (var i = sheets.length - 1; i >= 0; i--) {
//			var sheet = sheets[i];
//			if (sheet.title == 'rocon') {
//				for (var j = 0; j < css_rules_cache.length; j++) {
//					sheet.insertRule(css_rules_cache[j], j);
//				}
//				break;
//			}
//		}
		
	}
	css_rules_cache = [];
}

/**
 * Возвращает массив элементов, которым нужно добавить скругленные уголки.
 * Элементом массива является объект со свойствами <code>node</code> 
 * и <code>radius</code>
 * @param {Element} [context] Откуда брать элементы
 * @return {Array}
 */
function getElementsToProcess(context) {
	var elems = [], m;
	
	walkArray((context || document).getElementsByTagName('*'), function(){
		if (m = re_class.exec(this.className || '')) {
			var p = (m[2] || '');
			
			elems.push({
				node: this, 
				params: {
					radius: expandProperty(m[1]), 
					shape: (p.indexOf('shape') != -1 ),
					force: (p.indexOf('force') != -1 )
				}
			});
		}
	});
	
	return elems;
}

/**
 * Обрабатывает все элементы на странице, которым нужно добавить скругленные
 * уголки
 */
function processRoundedElements(context){
	createStylesheet();
	var elems = getElementsToProcess(context);
	if (elems.length) {
		walkArray(elems, function(i, n){
			worker.add(this.params, this.node);
		});
		
		worker.run();
	}
}

/**
 * Применяет уголки к элементам, переданным в массиве. В основном вызывается из
 * <code>rocon.update()</code>
 * @param {arguments} args Аргументы функции
 * @param {Function} fn Функция, которую нужно выполнить на каждом элементе
 */
function applyCornersToArgs(args, fn) {
	walkArray(args, function(){
		walkArray((this instanceof Array) ? this : [this], fn);
	});
}

/**
 * Делает копию объекта
 * @param {Object} obj
 * @return {Object}
 */
function copyObj(obj) {
	var result = {};
	for (var p in obj) 
		if (obj.hasOwnProperty(p))
			result[p] = obj[p];
	
	return result;
}