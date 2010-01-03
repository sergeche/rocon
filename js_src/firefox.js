/**
 * Добавление уголков для Firefox
 * @author Sergey Chikuyonok (sc@design.ru)
 * @copyright Art.Lebedev Studio (http://www.artlebedev.ru)
 * @include "common.js"
 */

if (browser.mozilla) {
	/**
	 * @param {Element} elem
	 * @param {Number[]} radius
	 */
	addCorners = function(elem, radius) {
		var selector = '.' + base_class + '-' + radius.join('-');
		if (!isProcessed(selector)) {
			
			var radius_value = mapArray(radius, function(r){
				return r + 'px';
			});
			
			addRule(selector, '-moz-border-radius:' + radius_value.join(' '));
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