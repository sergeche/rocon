/**
 * Добавление уголков для Safari
 * @author Sergey Chikuyonok (sc@design.ru)
 * @copyright Art.Lebedev Studio (http://www.artlebedev.ru)
 * @include "common.js"
 */

if (browser.safari) {
	/**
	 * @param {Element} elem
	 * @param {Number[]} radius
	 */
	addCorners = function(elem, radius) {
		var selector = '.' + base_class + '-' + radius.join('-');
		if (!isProcessed(selector)) {
			var selector_str = '';
			walkArray(['top-left', 'top-right', 'bottom-right', 'bottom-left'], function(i){
				selector_str += '-webkit-border-' + this + '-radius: ' + radius[i] + 'px;';
			});
			
			addRule(selector, selector_str);
			elem.className += ' ' + selector.substr(1);
			processed_rules[selector] = true;
		}
	}
	
	result.update = function() {
		applyCornersToArgs(arguments, function(){
			var m = re_class.exec(this.className || '');
			if (m) 
				addCorners(cleanUp(this), expandProperty(m[1]));
		});
	}
}