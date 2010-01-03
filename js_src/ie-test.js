/**
 * Добавление уголков для IE
 * @author Sergey Chikuyonok (sc@design.ru)
 * @copyright Art.Lebedev Studio (http://www.artlebedev.ru)
 * @include "common.js"
 */

if (browser.msie) {
	_corner_cache.ix = 0;
	_corner_cache.created = {};
	
	/**
	 * Возвращает имя класса для переданных параметров. Используется для 
	 * того, чтобы не плодить много разных классов для одних и тех же правил
	 * @param {Number} radius Радиус скругления уголка
	 * @param {Number} border_width Толщина бордюра
	 * @return {String}
	 */
	function getClassName(radius, border_width) {
		border_width = border_width || 0;
		var key = radius + ':' + border_width;
		if (!_corner_cache[key]) {
			_corner_cache[key] = rule_prefix + _corner_cache.ix++;
		}
		
		return _corner_cache[key];
	}
	
	/**
	 * Создает CSS-правила для скругленных уголков
	 * @param {Number} radius Радиус скругления
	 * @param {Number} border_width Толщина бордюра
	 */
	function createCSSRules(radius, border_width) {
		border_width = border_width || 0;
		var class_name = getClassName(radius, border_width);
		if (!_corner_cache.created[class_name]) {
			// такое правило еще не создано в CSS, создадим его
			var prefix, b = border_width;
			
			if (browser.version < 7) {
				prefix = '.' + class_name + ' .' + base_class;
				
				addRule(prefix + '-tl', 'left:' + (-b) + 'px; top:' + (-1 - b) + 'px;');
				
				addRule(
					prefix + '-tr', 
					'left:' + (b - 1 ) + 'px; ' +
						'width: ' + (1) + 'px; ' +
						'top:' + (-1 - b) + 'px;'
				);
				
				addRule(
					prefix + '-bl', 
					'left:' + (- border_width) + 'px; ' +
						'bottom:' + (-border_width) + 'px;' +
						'height:' + radius + 'px'
				);
				
				addRule(
					prefix + '-br', 
					'left:' + (-radius + border_width - 1) + 'px; ' +
						'width: ' + (radius) + 'px; ' +
						'bottom:' + (-border_width) + 'px;' +
						'height:' + radius + 'px'
				);
			} else {
				prefix = '.' + class_name + '>.' + base_class;
				addRule(
					prefix + '-tl', 
					'left:' + (-1 - border_width) + 'px; ' +
						'top:' + (-1 - border_width) + 'px;'
				);
				
				addRule(
					prefix + '-tr', 
					'right:' + ( - border_width) + 'px; ' +
						'top:' + (-1 - border_width) + 'px;'
				);
				
				addRule(
					prefix + '-bl', 
					'left:' + (-1 - border_width) + 'px; ' +
						'bottom:' + (-border_width) + 'px;'
				);
				
				addRule(
					prefix + '-br', 
					'right:' + (-border_width) + 'px; ' +
						'bottom:' + (-border_width) + 'px;'
				);
				
			}
			
			
			_corner_cache.created[class_name] = true;
		}
	}
	
	createStylesheet();
	try {
		if (!document.namespaces["v"])
			document.namespaces.add("v", "urn:schemas-microsoft-com:vml");
	} catch(e) { }
	
	addRule = function(selector, rules){
		alert(selector);
		corners_ss.addRule('p', rules);
	};
	
	addCorners = function(elem, radius){
		var cparams = getCornerParams(elem, radius);
		
//		addRule('body', 'background:blue');
		
		createCSSRules(cparams.radius, cparams.real_border_width);
		
//		// теперь добавляем сами уголки в элемент
//		walkArray(['tl', 'tr', 'bl', 'br'], function(){
//			elem.appendChild(drawCornerIE(cparams, this));
//		});
		
		
		// говорим, что все добавилось
//			alert(getClassName(cparams.radius, cparams.real_border_width) + ' ' + base_class + '-init');
		elem.className += ' ' + getClassName(cparams.radius, cparams.real_border_width) + ' ' + base_class + '-init';
	};
}