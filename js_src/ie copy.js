/**
 * Добавление уголков для IE
 * @author Sergey Chikuyonok (sc@design.ru)
 * @copyright Art.Lebedev Studio (http://www.artlebedev.ru)
 * @include "common.js"
 */

if (browser.msie) {
	// уголки для IE создаем через VML
	_corner_cache.ix = 0;
	_corner_cache.created = {};
	
	var vml_class = 'vml-' + base_class; //использую именно класс, чтобы работало в IE8
	
	try {
		if (!document.namespaces["v"])
			document.namespaces.add("v", "urn:schemas-microsoft-com:vml");
	} catch(e) { }
	
	createStylesheet();
	var dot_class = '.' + base_class;
	corners_ss.cssText = "." + vml_class + " {behavior:url(#default#VML);display:inline-block;position:absolute}" +
		dot_class + "-init {position:relative;zoom:1;}" +
		dot_class + " {position:absolute; display:inline-block; zoom: 1; overflow:hidden}" +
		dot_class + "-tl ." + vml_class + "{flip: 'y'}" +
		dot_class + "-tr ." + vml_class + "{rotation: 180;right:1px;}" +
		dot_class + "-br ." + vml_class + "{flip: 'x'; right:1px;}";
		
	if (browser.version < 7) {
		corners_ss.cssText += dot_class + '-tr, ' + dot_class + '-br {margin-left: 100%;}';
//				dot_class + ' .' + vml_class + '{position:absolute}' +
//				dot_class + '-tr .' + vml_class + '{right: 0}';
	}
	
	addRule = function(selector, rules){
		corners_ss.cssText += selector + '{' + rules + '}';
	};
	
	/**
	 * Создает элемент со скругленным уголком. В функции используется
	 * кэширование, то есть ранее созданный уголок дублируется, 
	 * а не создается заново
	 * @param {getCornerParams()} options Параметры рисования уголка 
	 * @return {HTMLElement}
	 */
	function createCornerElementIE(options) {
		var radius = options.radius,
			border_width = options.border_width,
			cache_key = radius + ':' + border_width + ':' + options.use_shape;
		
		if (!createCornerElementIE._cache[cache_key]) { // элемент еще не создан
			
			var multiplier = 10;
			
			var cv = createElement('v:shape');
			cv.className = vml_class;
			cv.strokeweight = border_width + 'px';
			cv.stroked = (border_width) ? true : false;
			var stroke = createElement('v:stroke');
			stroke.className = vml_class;
			stroke.joinstyle = 'miter';
			cv.appendChild(stroke);
			
			var w = radius, h = w;
			
			cv.style.width = w + 'px';
			cv.style.height = h + 'px';
			
			radius -= border_width / 2;
			radius *= multiplier;
			var bo = border_width / 2 * multiplier;
			var px = Math.round((radius + bo) / w);
			var rbo = radius + bo;
			
			cv.coordorigin = Math.round(px / 2) + ' ' + Math.round(px / 2);
			cv.coordsize = rbo + ' ' + rbo;
			
			var path = '';
			var max_width = rbo + px;
			
			if (options.use_shape) {
				max_width = 2000 * multiplier;
				path = 'm' + max_width + ',0 ns l' + bo +',0  qy' + rbo + ',' + radius + ' l' + max_width + ',' + radius + ' e ';
			} else {
				path = 'm0,0 ns l' + bo +',0  qy' + rbo + ',' + radius + ' l' + rbo + ',' + rbo + ' l0,' + rbo + ' e ';
			}
			
			
			// stroke
			path += 'm' + bo + ',' + (-px) + ' nf l' + bo + ',0 qy' + rbo + ',' + radius + ' l ' + (max_width) +','+ radius +' e x';
			
			cv.path = path;
				
			createCornerElementIE._cache[cache_key] = cv;
		}
		
		return createCornerElementIE._cache[cache_key].cloneNode(true);
	}
	
	createCornerElementIE._cache = {};
	
	/**
	 * Создает скругленный уголок
	 * @param {getCornerParams()} cparams параметры уголка
	 * @param {String} type Тип уголка (tl, tr, bl, br)
	 */
	function drawCornerIE(cparams, type){
		var cv = createCornerElementIE(cparams);
		cv.fillcolor = cparams.bg_color || '#000';
		cv.strokecolor = cparams.border_color || '#000';
		
		var elem = createElement('span', base_class + ' ' + base_class + '-' + type);
		elem.appendChild(cv);
		
		return elem;
	}
	
	/**
	 * Удаляет у элемента старые уголки
	 * @param {HTMLElement} elem Элемент, у которого нужно удалить уголки 
	 */
	function removeOldCorners(elem) {
		walkArray(elem.childNodes, function(){
			if (hasClass(this, base_class)) {
				elem.removeChild(this);
			}
		});
		
		cleanUp(elem);
	}
	
	/**
	 * Возвращает имя класса для переданных параметров. Используется для 
	 * того, чтобы не плодить много разных классов для одних и тех же правил
	 * @param {getCornerParams()} options Параметры рисования уголка
	 * @return {String}
	 */
	function getClassName(options) {
		var key = options.radius + ':' + (options.real_border_width || 0) + ':' + options.use_shape;
		if (!_corner_cache[key]) {
			_corner_cache[key] = rule_prefix + _corner_cache.ix++;
		}
		
		return _corner_cache[key];
	}
	
	/**
	 * Создает CSS-правила для скругленных уголков
	 * @param {getCornerParams()} options Параметры рисования уголка
	 * @param {HTMLElement} elem Элемент, которому добавляются уголки
	 * @param {Number} border_width Толщина бордюра
	 */
	function createCSSRules(options, elem) {
		var radius = options.radius,
			border_width = options.real_border_width || 0,
			diff = (options.use_shape) ? options.real_border_width - options.border_width : 0;
//		border_width += 10;
		
//		corners_ss.disabled = true;
			
		var class_name = getClassName(options);
		if (!_corner_cache.created[class_name]) {
			// такое правило еще не создано в CSS, создадим его
			var prefix = (browser.version < 7) 
							? '.' + class_name + ' .' + base_class  // IE6 
							: '.' + class_name + '>.' + base_class; // IE7+
			
			var offset_x = -border_width, 
				offset_y = -1 -border_width;
			
				
			addRule(prefix, 'width:' + (radius + border_width + 1) + 'px;height:' + (radius + 1) + 'px');
			
			if (options.use_shape) {
				offset_y = -radius - 1 - diff;
				var left_adjust = radius + options.border_width * 2 + diff;
				adjustBox(elem, class_name, options);
				var clip_size = Math.max(radius - border_width * 2, 0);
				var pad_size = Math.min(radius - border_width * 2, 0) * -1;
				
				if (browser.version < 7) {
					pad_size += parseInt(getStyle(elem, 'padding-left') || 0) + parseInt(getStyle(elem, 'padding-right') || 0);
				}
				
				var css_rules = 'width:100%;clip:rect(auto auto auto ' + (clip_size) + 'px);padding-right:' + (pad_size) + 'px;left:' + (-border_width - clip_size) + 'px;';
				addRule(prefix + '-tl', css_rules + 'top:' + offset_y + 'px;');
				addRule(prefix + '-tl .' + vml_class, 'left:' + (clip_size) + 'px');
				
				addRule(prefix + '-bl', css_rules +'bottom:' + offset_y + 'px;');
				addRule(prefix + '-bl .' + vml_class, 'left:' + (clip_size) + 'px');
			} else {
				addRule(prefix + '-tl', 'left:' + offset_x + 'px;top:' + offset_y + 'px;');
				addRule(prefix + '-bl', 'left:' + offset_x + 'px;bottom:' + offset_y + 'px;');
			}
			
			if (browser.version < 7) {
				offset_x = -radius;
				if (border_width) {
					offset_x += -border_width % 2 + radius % 2;
				} else {
					offset_x -= (radius) % 2;
				}
//				var padding = parseInt(getStyle(elem, 'padding-left') || 0) + parseInt(getStyle(elem, 'padding-right') || 0);
				addRule(prefix + '-tr', 'left:' + offset_x + 'px;top:' + offset_y + 'px;');
				addRule(prefix + '-br', 'left:' + offset_x + 'px;bottom:' + offset_y + 'px;');
//				addRule(prefix + '-tl', 'padding-right:'+ padding +'px');
//				addRule(prefix + '-bl', 'padding-right:'+ padding +'px');
			} else {
				addRule(prefix + '-tr', 'right:' + offset_x + 'px;top:' + offset_y + 'px;');
				addRule(prefix + '-br', 'right:' + offset_x + 'px;bottom:' + offset_y + 'px;');
			}
			
			_corner_cache.created[class_name] = true;
		}
		
//		corners_ss.disabled = false;
	}
	
	addCorners = function(elem, radius) {
		var cparams = getCornerParams(elem, radius);
		
		createCSSRules(cparams, elem);
		
		// теперь добавляем сами уголки в элемент
		walkArray(['tl', 'tr', 'bl', 'br'], function(){
			elem.appendChild(drawCornerIE(cparams, this));
		});
		
		
		// говорим, что все добавилось
		elem.className += ' ' + getClassName(cparams) + ' ' + base_class + '-init';
		
	};
	
	result.update = function() {
		applyCornersToArgs(arguments, function(){
			removeOldCorners(this);
			addCorners(this);
		});
	};
}