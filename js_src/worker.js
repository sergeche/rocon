/**
 * Main worker and caching mechanism used for storing and applying of drawn 
 * corners to the elements
 *  
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * @include "common.js"
 * @include "canvas.js"
 */var worker = (function(){
	
	/** @type {canvas} Drawing adapter (canvas, SVG, VML) */
	var adapter = null,
	
		/** Cached corners */
		cache = {},
		
		/** Number of keys in cache */
		key_count = 0,
		
		/** Native browser properties used to draw browser corners */
		native_props = [],
		
		queue = [],
		
		/** Corner type index in array */
		type_pos = {tl: 0, tr: 1, br: 2, bl: 3},
		
		/** CSS properties for corner types */
		corner_type_map = {
			tl: {
				left: 'border-left-width',
				left_color: 'border-left-color',
				top: 'border-top-width',
				top_color: 'border-top-color'
			},
			
			tr: {
				left: 'border-right-width',
				left_color: 'border-right-color',
				top: 'border-top-width',
				top_color: 'border-top-color'
			},
			
			br: {
				left: 'border-right-width',
				left_color: 'border-right-color',
				top: 'border-bottom-width',
				top_color: 'border-bottom-color'
			},
			
			bl: {
				left: 'border-left-width',
				left_color: 'border-left-color',
				top: 'border-bottom-width',
				top_color: 'border-bottom-color'
			}
		},
		
		opposite_corners = {
			tl: 'tr',
			tr: 'tl',
			bl: 'br',
			br: 'bl'
		},
		
		css_props = [];
	
	//fill-up CSS properties
	walkArray(['left', 'top', 'right', 'bottom'], function(i, n){
		var prefix = 'border-' + n;
		css_props.push(prefix + '-color', prefix + '-width');
	});
		
		
	/**
	 * Check if we need to add extra width for image (for shape-type corners)
	 * @param {Object} params
	 * @param {String} params
	 * @return {Boolean}
	 */
	function needExtraWidth(params, type) {
		return params.shape && (type || 'tl').charAt(1) == 'r';
	}
	
	/**
	 * Returns the smallest numbers
	 * @return {Number}
	 */
	function min() {
		var args = mapArray(arguments, function(n, i){
			return parseInt(n) || 0;
		});
		
		if (args.length == 2) {
			return args[0] < args[1] ? args[0] : args[1];
		} else {
			var result = args[0];
			for (var i = 1; i < args.length; i++) {
				if (args[i] < result)
					result = args[i];
			}
			
			return result;
		}
	}
	
	/**
	 * Returns the highest numbers
	 * @return {Number}
	 */
	function max() {
		var args = mapArray(arguments, function(n, i){
			return parseInt(n) || 0;
		});
		
		if (args.length == 2)
			return args[0] > args[1] ? args[0] : args[1];
		else {
			var result = args[0];
			for (var i = 1; i < args.length; i++) {
				if (args[i] > result)
					result = args[i];
			}
			
			return result;
		}
	}
	
	/**
	 * Returns key used to store image data
	 * @param {Array|Object} params Corner parameters
	 * @return {String}
	 */
	function cacheKey(params) {
		var result = [];
		if (params instanceof Array)
			for (var i = 0; i < params.length; i++)
				result.push(params[i]);
		else
			for (var a in params) if (params.hasOwnProperty(a))
				result.push(a + ':' + params[a]);
			
		return result.join(';');
	}
	
	/**
	 * Add value to cache
	 * @param {String} key Cache key
	 * @param {String} [value] Cache value. If not set, internal class name will be used
	 * @return {String} Internal class name
	 */
	function addToCache(key, value) {
		if (getCachedValue(key))
			return getCachedValue(key);
		
		key_count++;
		cache[key] = value || rule_prefix + key_count;
		return rule_prefix + key_count;
	}
	
	/**
	 * Returns cached value
	 * @param {String} key cache key
	 * @return {String|null}
	 */
	function getCachedValue(key) {
		return cache[key];
	}
	
	/**
	 * Add native CSS corners to the element
	 * @param {Array} radius Set of border radius values
	 * @param {HTMLElement} elem Element to add corners
	 */
	function addNativeCorners(radius, elem) {
		var key = cacheKey(radius),
			css_class = getCachedValue(key),
			css_rules = '';
			
		if (!css_class) {
			css_class = addToCache(key);
			
			walkArray(native_props, function(i, n){
				css_rules += n + ':' + radius[i] + 'px;';
			});
			
			addRule('.' + css_class, css_rules);
		}
		
		addClass(css_class, elem);
	}
	
	/**
	 * Creates, if necessary, new corner elements and returns them
	 * @param {HTMLElement} elem Container element
	 * @return {Object}
	 */
	function createCornerElements(elem) {
		var result = {},
			found = 0,
			re = new RegExp('\\b' + base_class + '-([tblr]{2})\\b', 'i'),
			m;
		
		walkArray(elem.childNodes, function(i, /* HTMLElement */ n){
			if (m = re.exec(n.className)) {
				found++;
				result[m[1]] = n;
			}
		});
		
		if (!found) {
			walkArray(['tl', 'tr', 'bl', 'br'], function(i, n) {
				var e = createElement('span', base_class + ' ' + base_class +'-' + n);
				elem.appendChild(e);
				result[n] = e;
			});
		}
		
		return result;
	}
	
	/**
	 * Add element to drawing queue
	 * @param {Object} params Parent element params
	 * @param {HTMLElement} parent Parent element
	 * @param {Object} corners Corner elements
	 */
	function addToQueue(params, parent, corners) {
		queue.push([params, parent, corners]);
	}
	
	/**
	 * Removes old internal classes from element
	 * @param {HTMLElement} elem
	 * @param {String} new_class New class name to add (optional)
	 * @return {HTMLElement}
	 */
	function cleanUp(elem, new_class) {
		elem.className = elem.className.replace(/\s*rocon__\d+/, '');
		if (new_class)
			elem.className += ' ' + new_class;
		
		return elem;
	}
	
	/**
	 * Returns width that must be set for specified corner type
	 * @param {Object} params Corner's container element params
	 * @param {String} type Corner type (tl, tr, bl, br)
	 * @return {Number}  
	 */
	function getCornerWidth(params, type) {
		return needExtraWidth(params, type) ? 2000 : params.radius[type_pos[type]];
	}
	
	/**
	 * Returns height that must be set for specified corner type
	 * @param {Object} params Corner's container element params
	 * @param {String} type Corner type (tl, tr, bl, br)
	 * @return {Number}  
	 */
	function getCornerHeight(params, type) {
		var cur_pos = type_pos[type],
			op_pos =  type_pos[ opposite_corners[type] ];
		
		return Math.max(params.radius[cur_pos], params.radius[op_pos]);
	}
	
	/**
	 * Draw corners using adapter
	 * @param {Object} params Parent element params
	 * @param {HTMLElement} parent Parent element
	 * @param {HTMLElement[]} corners Corner elements
	 * @param {Object} style Cached CSS properties
	 */
	function drawCorners(params, parent, corners, style) {
		// gather all params for all corners
		var all_params = {}, css_map, elem, style;
		
		for (var corner_type in corners) {
			css_map = corner_type_map[corner_type];
			/** @type {HTMLElement} */
			elem = corners[corner_type];
			
			style = style || getStyle(parent, css_props);
//			debugger;
			
			// gather params for current corner
			var r = parseInt(params.radius[ type_pos[corner_type] ]);
			all_params[corner_type] = {
				radius: r,
				top: min(style[css_map.top], r),
				real_top: parseInt(style[css_map.top]) || 0,
				top_color: convertColorToHex(style[css_map.top_color]),
				left: min(style[css_map.left], r),
				real_left: parseInt(style[css_map.left]) || 0,
				left_color: convertColorToHex(style[css_map.left_color]),
				color: getBg(params.shape ? parent : parent.parentNode),
				use_shape: params.shape,
				type: corner_type,
				width: max(getCornerWidth(params, corner_type), parseInt(style[css_map.left]) || 0),
				height: getCornerHeight(params, corner_type)
			};
		}
		
		// create corners
		for (var corner_type in corners) {
			
			/** @type {HTMLElement} */
			elem = corners[corner_type];
			
			var cparams = all_params[corner_type];
			// calculate X and Y offsets
			cparams.offset_x = -cparams.real_left;
			cparams.offset_y = -(params.shape ? max(cparams.height, cparams.radius, cparams.real_top) : cparams.real_top);
			
			
			var op_corner = opposite_corners[corner_type],
				key = cacheKey(cparams);
			
			if (needExtraWidth(params, corner_type)) {
				//add extra properties for cache key
				key += '--' + (cparams.left + all_params[op_corner].left) + 
					':' + params.radius[ type_pos[op_corner] ];
			}
			
			var css_class = getCachedValue(key);
				
			if (!css_class) {
				// image is not yet created
				css_class = addToCache(key);
				var css_rules = 'height:' + cparams.height + 'px;';
				
				if (adapter.returnType() != 2)
					css_rules += 'background-image:url(' + adapter.draw(cparams) + ');';
				
				
				if (needExtraWidth(params, corner_type)) {
					css_rules += 'width:100%;' +
							'padding-left:' + (cparams.real_left + all_params[op_corner].left) + 'px;' +
							'clip:rect(auto,auto,auto,' + params.radius[ type_pos[op_corner] ] + 'px);' +
							'background-position:top right;';
				} else {
					css_rules += 'width:' + cparams.width + 'px;';
				}
						
				var offset_top = -(params.shape ? Math.max(cparams.height, cparams.radius) : cparams.top);
				
				css_rules += ( corner_type.charAt(0) == 't' ? 'top:' : 'bottom:' ) + cparams.offset_y + 'px;';
				css_rules += ( corner_type.charAt(1) == 'l' ? 'left:' : 'right:' ) + cparams.offset_x + 'px;';
				
				addRule('.' + css_class, css_rules);
			}
			
			cleanUp(elem, css_class);
			if (adapter.returnType() == 2) {
				elem.innerHTML = '';
				elem.appendChild(adapter.draw(cparams));
			}
		}
		
		cleanUp(parent);
		if (!hasClass(parent, 'rocon-init'))
			addClass('rocon-init', parent);
		
		if (params.shape)
			adjustBox(params, parent);
	}
	
	/**
	 * Add corners drawn by <code>adapter</code> to the element
	 * @param {Array} params.radius Array of radius values
	 * @param {Boolean} params.shape Use shape instead of counter-shape
	 * @param {HTMLElement} elem Element to apply corners
	 * @param {Boolean} [is_immediate] Draw corners immediately instead adding element to the queue (may cause performance issues in Opera)
	 */
	function addAdapterCorners(params, elem, is_immediate) {
		/*
		 * Due to stupid Opera bug (http://chikuyonok.ru/playground/opera-bug/)
		 * we need to split this single process into two loops:
		 * 1. Add corner elements to the container
		 * 2. Draw images and apply them to the corners 
		 */
		 var corners = createCornerElements(elem);
		 if (is_immediate)
		 	drawCorners(params, elem, corners);
		 else
		 	addToQueue(params, elem, corners);
	}
	
	/**
	 * Main processing function
	 * @param {Array} params.radius Array of radius values
	 * @param {Boolean} params.shape Use shape instead of counter-shape
	 * @param {Boolean} params.force {Boolean} Force usage of drawing adapter instead of native properties
	 * @param {HTMLElement} elem Element to apply corners
	 * @param {Boolean} [is_immediate] Draw corners immediately instead adding element to the queue (may cause performance issues in Opera)
	 */
	function process(params, elem, is_immediate) {
		if (native_props.length && !params.force) {
			addNativeCorners(params.radius, elem);
		} else {
			addAdapterCorners(params, elem, is_immediate);
		}
	}
	
	/**
	 * Корректирует CSS-свойства элемента для правильного рисования уголков в виде
	 * формы
	 * @param {Object} params Corner params
	 * @param {HTMLElement} elem Элемент, который нужно подкорректировать
	 */
	function adjustBox(params, elem) {
		var pt  = 'padding-top',
			pb  = 'padding-bottom',
			mt  = 'margin-top',
			mb  = 'margin-bottom',
			btw = 'border-top-width',
			bbw = 'border-bottom-width',
			
			getProp = function(prop) {
				return parseInt(elem_styles[prop], 10) || 0;
			},
			
			addCSSRule = function(property, value) {
				return property + ':' + value + 'px !important;';
			},
			
			elem_styles = getStyle(elem, [pt, pb, mt, mb, btw, bbw]),
			
			offset_top = Math.max(params.radius[ type_pos['tl'] ], params.radius[ type_pos['tr'] ]),
			offset_bottom = Math.max(params.radius[ type_pos['bl'] ], params.radius[ type_pos['br'] ]),
			offset_border_top = Math.min(offset_top, getProp(btw)),
			offset_border_bottom = Math.min(offset_bottom, getProp(bbw));
		
		/*
		 * Используем форму, поэтому у блока снижаем верхние и нижние
		 * бордюры, а также на величину радиуса снижаем верхний 
		 * и нижний паддинг 
		 */
		
		var padding_top = Math.max(getProp(pt) - offset_top + offset_border_top, 0),
			padding_bottom = Math.max(getProp(pb) - offset_bottom + offset_border_bottom, 0),
			margin_top = getProp(mt) + offset_top,
			margin_bottom = getProp(mb) + offset_bottom,
			border_top_width = getProp(btw) - offset_border_top,
			border_bottom_width = getProp(bbw) - offset_border_bottom,
			
			key = cacheKey([padding_top, padding_bottom, margin_top, margin_bottom, border_top_width, border_bottom_width]),
			class_name = getCachedValue(key);
			
		if (!class_name) {
			class_name = addToCache(key);
			addRule('.' + class_name, 
					addCSSRule(btw, border_top_width) +
					addCSSRule(bbw, border_bottom_width) +
					addCSSRule(pt, padding_top) +
					addCSSRule(pb, padding_bottom) +
					addCSSRule(mt, margin_top) +
					addCSSRule(mb, margin_bottom));
		}
		
		elem.className += ' ' + class_name;
	}
	
	return {
		/**
		 * Set drawing adapter
		 */
		setAdapter: function(obj) {
			adapter = obj;
			if ('init' in adapter)
				adapter.init();
		},
		
		/**
		 * Set native CSS properties for drawing rounded borders
		 * @param {String} tl Top-left corner
		 * @param {String} tr Top-right corner
		 * @param {String} br Bottom-right corner
		 * @param {String} bl Bottom-left corner
		 */
		nativeProperties: function(tl, tr, br, bl) {
			native_props = [tl, tr, br, bl];
		},
		
		/**
		 * Enqueue element for corners addition
		 * @param {Array} params.radius Array of radius values
		 * @param {Boolean} params.shape Use shape instead of counter-shape
		 * @param {Boolean} params.force {Boolean} Force usage of drawing adapter instead of native properties
		 * @param {HTMLElement} elem Element to apply corners
		 */
		add: function(params, elem) {
			process(params, elem);
		},
		
		/**
		 * Add corners to enqueued elements
		 */
		run: function() {
			// first, we need to cache all required CSS properies
			// to get rid of nasty Opera bug
//			console.profile();
//			console.time('get_style');
			
//			var styles = [];
//			walkArray(queue, function(i, n){
//				styles[i] = getStyle(n[1], css_props);
//			});
			
//			console.timeEnd('get_style');
			
			console.time('create_corner');
			// then, draw and add corners
			walkArray(queue, function(i, n){
				drawCorners(n[0], n[1], n[2]);
			});
			console.timeEnd('create_corner');
			
			console.time('apply_css');
			applyCSS();
			console.timeEnd('apply_css');
			
//			console.profileEnd();
			
		},
		
		/**
		 * Add corners to the element
		 */
		apply: function(params, elem) {
			process(params, elem, true);
		}
	}
	
})();