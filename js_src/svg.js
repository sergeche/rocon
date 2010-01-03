/**
 * SVG adapter for drawing rounded corners
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */var svg = (function(){
		/** Stroke gradient raw string */
	var stroke_gradient = '<linearGradient id="corner_gradient" x1="0%" y1="0%" x2="0%" y2="100%">' +
			'<stop offset="%grd_start%" stop-color="%top_color%"/>' +
			'<stop offset="%grd_stop%" stop-color="%left_color%" />' +
		'</linearGradient>',
		
		/** Stroke drawing raw string */
		stroke_path = '<path fill="url(#corner_gradient)" d="M 0,%height% V%radius% a%radius%,%radius%,0,0,1,%radius%,-%radius% H%width% v%top% H%radius% A%radius%,%radius%,0,0,0,%left%,%radius% V%height% z"/>',
		
		/** Fill drawing raw string */
		fill_path = '<g transform="%transform%">' +
			'<path fill="%color%" d="M0,%height% V%radius% a%radius%,%radius%,0,0,1,%radius%,-%radius% H%width% %shape% z"/>' +
		'</g>',
		
		/** Base64 encoding symbols */
		b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	
	/**
	 * Encodes data with MIME base64
	 * @author Tyler Akins (http://rumkin.com)
	 * @improvements Bayron Guevara
	 * @improvements Thunder.m
	 * @improvements Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	 * @improvements Pellentesque Malesuada
	 * @param {String} data Data to encode
	 * @return {String}
	 */
	function base64_encode(data) {
		var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, enc="", tmp_arr = [];

		if (!data) {
			return data;
		}

		do { // pack three octets into four hexets
			o1 = data.charCodeAt(i++);
			o2 = data.charCodeAt(i++);
			o3 = data.charCodeAt(i++);

			bits = o1<<16 | o2<<8 | o3;

			h1 = bits>>18 & 0x3f;
			h2 = bits>>12 & 0x3f;
			h3 = bits>>6 & 0x3f;
			h4 = bits & 0x3f;

			// use hexets to index into b64, and append result to encoded string
			tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
		} while (i < data.length);

		enc = tmp_arr.join('');

		switch( data.length % 3 ){
			case 1:
				enc = enc.slice(0, -2) + '==';
			break;
			case 2:
				enc = enc.slice(0, -1) + '=';
			break;
		}

		return enc;
	}
	
	/**
	 * Replaces entities (%entity%) in string with values passed in
	 * <code>params</code>: {entity1: value, entity2: value, ...}
	 * @param {String} str Raw string
	 * @param {Object} params Entity values
	 * @return {String} New string with replaced values
	 */
	function replaceEntities(str, params) {
		// merge objects
		var _params = {};
		for (var i = 1; i < arguments.length; i++) {
			var obj = arguments[i];
			if (obj)
				for (var a in obj) if (obj.hasOwnProperty(a))
					_params[a] = obj[a];
		}
		
		// replace entities
		return str.replace(/\%(\w+)\%/g, function(s, p1){
			return _params[p1];
		});
	}
	
	/**
	 * Create border shape (stroke).
	 * 
	 * @param {Number} params.radius Corner radius
	 * @param {Number} params.left Left border width, pixels
	 * @param {String} params.left_color Left border color
	 * @param {Number} params.top Top border width, pixels
	 * @param {String} params.top_color Top border color
	 * @param {Boolean} params.use_shape Flag, indicating that shape, not counter-shape, must be drawn
	 * 
	 * @return {String} String containing SVG tags
	 */
	function drawStroke(params) {
		var extra_params = {
			grd_start: params.top / params.radius,
			grd_stop: params.radius / params.height
		};  
		
		
		return (params.top + params.left) ? 
			replaceEntities(stroke_gradient, params, extra_params) +
			replaceEntities(stroke_path, params, extra_params) 
			: '';
	}
	
	/**
	 * Draw background for corner image
	 * 
	 * @param {Number} params.radius Corner radius
	 * @param {Number} params.left Left border width, pixels
	 * @param {Number} params.top Top border width, pixels
	 * @param {String} params.color Color of background
	 * @param {Boolean} params.use_shape Flag, indicating that shape, not counter-shape, must be drawn
	 */
	function drawBackground(params) {
		var offset_x = 0, offset_y = 0,
			width = params.width,
			height = params.height;
		
		if (params.use_shape) {
			if (params.top) offset_y = 1;
			if (params.left) offset_x = 1;
			
			width  -= offset_x;
			height -= offset_y;
		}
		
		var t = {
			transform: 'translate(' + offset_x + ',' + offset_y + ')',
			shape: (params.use_shape ? 'V' + height : 'H0'),
			width: width,
			height: height
		};
			
		return replaceEntities(fill_path, params, t);
	}
	
	/**
	 * Returns transformation params for different types of corners
	 * @param {String} params.type Corner type: tl, tr, bl, br
	 * @param {Number} params.width Corner width
	 * @param {Number} params.height Corner height
	 */
	function rotate(params) {
		switch (params.type) {
			case 'tr': 	// top right corner
				return 'scale(-1, 1) translate(-' + params.width + ', 0)';
				
			case 'bl': // bottom left corner
				return 'scale(1, -1) translate(0, -' + params.height + ')';
				
			case 'br': // bottom right corner
				return 'scale(-1, -1) translate(-' + params.width + ', -' + params.height + ')';
			default:
				return '';
		}
	}
	
	return {
		/**
		 * Draw rounded corner
		 * 
		 * @param {Number} params.radius Corner radius
		 * @param {Number} params.left Left border width, pixels
		 * @param {String} params.left_color Left border color
		 * @param {Number} params.top Top border width, pixels
		 * @param {String} params.top_color Top border color
		 * @param {Boolean} params.use_shape Flag, indicating that shape, not counter-shape, must be drawn
		 * @param {String} params.color Color of background
		 * @param {String} params.type Corner type: tl, tr, bl, br
		 * 
		 * @return {String} Image in data:URL format
		 */
		draw: function(params) {
			params.width = params.width || params.radius;
			params.height = params.height || params.radius;
			
			var data = '<svg xmlns="http://www.w3.org/2000/svg" width="' + params.width + 'px" height="' + params.height + 'px">' +
					'<g transform="' + rotate(params) + '">' +
					drawBackground(params) +
					drawStroke(params) +
					'</g>' +
					'</svg>';
//			console.log(data);
			return 'data:image/svg+xml;base64,' + base64_encode(data); 
//			return data; 
		},
		
		returnType: function() {
			return 1;
		}
	}
	
})();