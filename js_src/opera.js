/**
 * Добавление уголков для Opera
 * @author Sergey Chikuyonok (sc@design.ru)
 * @copyright Art.Lebedev Studio (http://www.artlebedev.ru)
 * @include "common.js"
 * @include "/js-libs/canvas-doc.js"
 */
 
if (browser.opera) {
	/*
	 * Нужно дожаться, пока загрузится DOM-дерево, после чего получить все 
	 * элементы, которым нужно скруглить уголки, и добавить соотвествующие 
	 * стили и элементы
	 */
	
	createStylesheet();
	addRule('.' + base_class, 'position:absolute;background-repeat:no-repeat;z-index:1;display:none');
	addRule('.' + base_class + '-init', 'position:relative;');
	addRule('.' + base_class + '-init>.' + base_class, 'display:inline-block;');
	addRule('.' + base_class + '-tl', 'top:0;left:0;background-position:100% 100%;');
	addRule('.' + base_class + '-tr', 'top:0;right:0;background-position:0 100%;');
	addRule('.' + base_class + '-bl', 'bottom:0;left:0;background-position:100% 0;');
	addRule('.' + base_class + '-br', 'bottom:0;right:0;');
	
	/** @type {HTMLCanvasElement} Холст, на котором будут рисоваться уголки */
	var cv = createElement('canvas');
	
	/**
	 * Возвращает подготовленный контекст рисования на холсте
	 * @param {getCornerParams()} options Параметры рисования уголка
	 * @param {Boolean} is_shape Будем рисовать форму (true) или контр-форму (false)?
	 * @return {CanvasRenderingContext2D}
	 */
	function getDrawingContext(options) {
		options.border_width = (options.border_width > options.radius) 
				? options.radius 
				: options.border_width;
		
		if (options.border_width > 1)
			options.radius -= options.border_width / 2;
			
		
		var width = options.radius * 2 + options.border_width, height = width;
		if (options.use_shape) {
			width = 2000;
			if (options.border_width < options.real_border_width) {
				height += (options.real_border_width - options.border_width) * 2;
			}
		}
		
		
		if (options.border_width == 1) {
			width--;
			height--;
		}
		
		cv.width = options.width = width;
		cv.height = options.height = height;
		
		/** @type {CanvasRenderingContext2D} */
		var ctx = cv.getContext('2d');
		
		ctx.strokeStyle = options.border_color;
		ctx.lineWidth = options.border_width;
		ctx.lineJoin = 'miter';
		ctx.lineCap = 'square';
		ctx.fillStyle = options.bg_color[0];
		
		ctx.clearRect(0, 0, width, height);
		return ctx;
	}
	
	/**
	 * Делает обводку в виде звездочки
	 * @param {CanvasRenderingContext2D} ctx Контекст рисования
	 * @param {Number} options.radius Радиус скругления
	 * @param {String} options.color Цвет уголка в hex-формате
	 * @param {Number} options.border_width Толщина обводки
	 * @param {String} options.border_color Цвет обводки
	 */
	function strokeStar(ctx, options) {
		var deg90 = Math.PI / 2, 
			b2 = (options.border_width > 1) ? options.border_width : 0,
			rb2 = options.radius * 2 + b2;
		
		ctx.beginPath();
		ctx.arc(0, 0, options.radius, deg90, 0, true);
		ctx.stroke();
		
		ctx.beginPath();
		ctx.arc(rb2, 0, options.radius, deg90 * 2, deg90, true);
		ctx.stroke();
		
		ctx.beginPath();
		ctx.arc(rb2, rb2, options.radius, -deg90, deg90 * 2, true);
		ctx.stroke();
	
		ctx.beginPath();
		ctx.arc(0, rb2, options.radius, 0, -deg90, true);
		ctx.stroke();
	}
	
	/**
	 * Рисует «звездочку» для создания формы уголков через canvas
	 * @param {Number} options.radius Радиус скругления
	 * @param {String} options.color Цвет уголка в hex-формате
	 * @param {Number} options.border_width Толщина обводки
	 * @param {String} options.border_color Цвет обводки
	 * @return {String} Картинка в формате data:URL
	 */
	function drawStarShape(options) {
		options = copyObj(options);
		
		var ctx = getDrawingContext(options),
			deg90 = Math.PI / 2, 
			deg360 = Math.PI * 2,
			bw = options.border_width,
			b2 = (bw > 1) ? bw : 0,
			rb2 = options.radius * 2 + b2,
			diff = 0,
			draw_borders = (options.border_width < options.real_border_width);
			
		var drawCircle = function(x, y) {
			ctx.beginPath();
			ctx.arc(x, y, options.radius, 0, deg360, true);
			ctx.closePath();
			ctx.fill();
		}
		
		if (draw_borders) {
			// нужно дорисовать толщину бордера
			diff = options.real_border_width - options.border_width;
			ctx.save();
			ctx.translate(0, diff);
		}
		
		drawCircle(0, 0);
		drawCircle(rb2, 0);
		drawCircle(rb2, rb2);
		drawCircle(0, rb2);
		
		ctx.fillRect(rb2, 0, options.width, options.height);
		
		if (bw) {
			strokeStar(ctx, options);
			ctx.fillStyle = ctx.strokeStyle;
			ctx.fillRect(rb2, options.radius - (bw > 1 ? bw / 2 : bw), options.width, bw * 2);
			
			if (draw_borders) {
				ctx.restore();
				ctx.fillStyle = options.border_color;
				ctx.fillRect(0, 0, options.width, diff);
				ctx.fillRect(0, options.height - diff, options.width, diff);
				ctx.fillStyle = options.bg_color;
			}
		}
		
		return ctx.canvas.toDataURL();
	}
	
	/**
	 * Рисует «звездочку» через canvas
	 * @param {Number} options.radius Радиус скругления
	 * @param {String} options.color Цвет уголка в hex-формате
	 * @param {Number} options.border_width Толщина обводки
	 * @param {String} options.border_color Цвет обводки
	 * @return {String} Картинка в формате data:URL
	 */
	function drawStar(options) {
		var old_opt = options;
		options = copyObj(options);
		
		var ctx = getDrawingContext(options),
			radius = options.radius,
			b2 = (options.border_width > 1) ? options.border_width : 0,
			rb2 = radius * 2 + b2,
			r = old_opt.radius,
			deg90 = Math.PI / 2;

		ctx.save();
		ctx.beginPath();
		ctx.arc(0, 0, radius, deg90, 0, true);
		ctx.arc(rb2, 0, radius, deg90 * 2, deg90, true);
		ctx.arc(rb2, rb2, radius, -deg90, deg90 * 2, true);
		ctx.arc(0, rb2, radius, 0, -deg90, true);
		ctx.closePath();
		ctx.clip();
	
		
		ctx.fillStyle = options.bg_color[2];
		ctx.fillRect(0, 0, r, r)
		
		ctx.fillStyle = options.bg_color[3];
		ctx.fillRect(r, 0, r, r);
		
		ctx.fillStyle = options.bg_color[0];
		ctx.fillRect(r, r, r, r);
		
		ctx.fillStyle = options.bg_color[1];
		ctx.fillRect(0, r, r, r);
		ctx.restore();
		
		if (options.border_width)
			strokeStar(ctx, options);
		
		return ctx.canvas.toDataURL();
	}
	
	/**
	 * Возвращает ключ, по которому кэшируются отрисованные элементы
	 * @param {getCornerParams()} cparams Параметры скругления блока
	 * @param {HTMLElement} elem Элемент, для которого делаем скругление
	 * @return {String}
	 */
	function getCacheKey(cparams, elem) {
		var binded = getBindedProperties(elem);
		return [
			cparams.radius, 
			cparams.bg_color.join('-'), 
			cparams.real_border_width, 
			cparams.border_color, 
			cparams.use_shape,
			binded ? binded.id : 0
		].join(':');
	}
	
	/**
	 * Создает CSS-правила для уголков определенного радиуса и цвета
	 * @param {getCornerParams()} cparams Параметры скругления блока
	 * @param {HTMLElement} elem Элемент, для которого делаем скругление
	 * @return {String} Имя класса, которое нужно присвоить элементу
	 */
	function createCSSRulesOpera(cparams, elem) {
		var cache_key = getCacheKey(cparams, elem),
			radius = cparams.radius,
			bw = cparams.real_border_width || 0,
			diff = (cparams.use_shape) ? bw - cparams.border_width : 0;
		
		// смотрим, делали ли правило с такими же параметрами
		if (!_corner_cache[cache_key]) {
			// создаем новое правило
			var cur_class = rule_prefix + corners_ss.cssRules.length;
			_corner_cache[cache_key] = cur_class;
			
			addRule('.' + cur_class + '>.' + base_class, 
				'background-image: url("' + ( cparams.use_shape ? drawStarShape(cparams) : drawStar(cparams) ) + '");' +
				'width: '+ radius +'px;' +
				'height: ' + (radius + diff) + 'px;'
			);
			
			var offset_x = -bw, offset_y = -bw;
			if (cparams.use_shape) {
				offset_y = -radius - diff;
				adjustBox(elem, cur_class, cparams);
				addRule(
					'.' + cur_class + '>.' + base_class + '-tl, .' + cur_class + '>.' + base_class + '-bl', 
					'width:auto;left:0;right:'+ (radius - bw) +'px;background-position:-' + radius + 'px 100%;'
				);
				addRule('.' + cur_class + '>.' + base_class + '-bl', 'background-position:-' + radius + 'px 0;');
			}
			
			if (offset_x || offset_y) {
				addRule('.' + cur_class + '>.' + base_class + '-tl', 'top:'+ offset_y +'px; left:'+ offset_x +'px');
				addRule('.' + cur_class + '>.' + base_class + '-tr', 'top:'+ offset_y +'px; right:'+ offset_x +'px');
				addRule('.' + cur_class + '>.' + base_class + '-bl', 'bottom:'+ offset_y +'px; left:'+ offset_x +'px');
				addRule('.' + cur_class + '>.' + base_class + '-br', 'bottom:'+ offset_y +'px; right:'+ offset_x +'px');
			}
		}
		
		return _corner_cache[cache_key];
	}

	/**
	 * Добавляет уголки элементу
	 * @param {Element} elem
	 */
	addCorners = function(elem, radius){
		// если у элемента нет класса — значит, нет указания, какие уголки
		// нужно добавить
		if (!elem.className)
			return;
		
		// проверим, нужно ли добавлять элементы с уголками
		var dont_add = false;
		walkArray(elem.childNodes, function(){
			if (hasClass(this, base_class)) {
				dont_add = true;
				return false;
			}
		});
		
		var elem_class = createCSSRulesOpera(getCornerParams(elem, radius), elem);
		
		if (!dont_add) 
			// добавляем уголки
			walkArray(['tl', 'tr', 'bl', 'br'], function(){
				elem.appendChild( createElement('span', base_class + ' ' + base_class +'-' + this) );
			});
		
		cleanUp(elem, elem_class + ' ' + base_class + '-init');
	};
	
	addDomReady(function(){
		/*
		 * Одна из причин, по которой я ненавижу Оперу — это 
		 * необходимость до сих пор вставлять подобные костыли, 
		 * чтобы что-то отобразились на странице
		 */
		document.documentElement.style.outline = 'none';
	});
	
	result.update = function() {
		applyCornersToArgs(arguments, function(){
			addCorners( cleanUp(this) );
		});
	}
}