/**
 * VML adapter for drawing rounded corners
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "common.js"
 */var vml = (function(){
	// init VML (took from Raphaёl lib)
	var ns = 'rc_vml',
		doc = document,
		vml_ns = '',
		common_style = 'position:absolute;display:inline-block;',
		is_inited = false;
	
	/** Stroke drawing raw string */
	var stroke_path = '<' + ns + ':shape ' + vml_ns + ' class="' + ns + ' ' + ns + '_stroke" fillcolor="%top_color%" style="' + common_style + 'width:%width%px;height:%height%px;%offset%;%rotation%" stroked="false" coordsize="%c_width% %c_height%" coordorigin="5 5" ' +
			'path="m0,%c_height% l0,%radius% qy%radius%,0 l%c_width%,0 r0,%top% l%radius%,%top% qx%left%,%radius% l%left%,%c_height% l0,%c_height% e x">' +
				'<' + ns + ':fill ' + vml_ns + ' class="' + ns + '" color="%left_color%" color2="%top_color%" type="gradient" colors="%grd_start%% %grd_color_start%, %grd_end%% %grd_color_end%"/>' +
				'</' + ns + ':shape>',
		
		/** Fill drawing raw string */
		fill_path = '<' + ns + ':shape ' + vml_ns + ' class="' + ns + '" fillcolor="%color%" stroked="false" style="' + common_style + 'width:%width%px;height:%height%px;%rotation%;%offset%" coordsize="%c_width% %c_height%" coordorigin="5 5" ' +
				'path="m%offset_x%,%c_height% l%offset_x%,%radius% qy%radius%,%offset_y% l%c_width%,%offset_y% l%c_width%,0 %shape% l0,%c_height% e x"></' + ns + ':shape>',
		
		/** All numeric properies of <code>params</code> object */
		num_properties = ['top', 'left', 'radius', 'c_width', 'c_height'],
		
		/** VML coordinate space multiplier for crispy edges of shapes */
		multiplier = 10;
	
	
	
	/**
	 * Replaces entities (like %entity%) in string with values passed in
	 * <code>params</code>: {entity1: value, entity2: value, ...}
	 * @param {String} str Raw string
	 * @param {Object} params Entity values
	 * @return {String} New string with replaced entities
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
			grd_start: (1 - params.top / params.radius) * 100,
			grd_color_start: params.top_color,
			grd_end: (1 - params.radius / params.height) * 100,
			grd_color_end: params.left_color
		};
		
		if ((params.type || '').charAt(0) == 'b') {
			// swap colors
			var tmp_color = params.top_color;
			params.top_color = params.left_color;
			params.left_color = tmp_color;
			
			extra_params.grd_start = 100 - extra_params.grd_start;
			extra_params.grd_end = 100 - extra_params.grd_end;
		}
		
		return (params.top + params.left) ? 
//			replaceEntities(stroke_gradient, params, extra_params) +
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
		var t = {
			shape: params.use_shape ? 'r0,' + params.c_height : 'l0,0'
		};
			
		return replaceEntities(fill_path, params, t);
	}
	
	/**
	 * Returns transformation params for different types of corners
	 * @param {String} Corner type: tl, tr, bl, br
	 * @param {Number} radius Corner radius
	 */
	function rotate(type, radius) {
		switch (type) {
			case 'tr': 	// top right corner
				return 'flip:x;margin-left:-1px;';
				
			case 'bl': // bottom left corner
				return 'flip:y;margin-top:-1px';
				
			case 'br': // bottom right corner
				return 'rotation:180;margin-left:-1px;margin-top:-1px;';
			default:
				return '';
		}
	}
	
	return {
		init: function() {
			if (!is_inited) {
				doc.createStyleSheet().addRule("." + ns, "behavior:url(#default#VML)");
			    try {
			        !doc.namespaces[ns] && doc.namespaces.add(ns, "urn:schemas-microsoft-com:vml");
			    } catch (e) {
			    	vml_ns = 'xmlns="urn:schemas-microsoft.com:vml"';
			    }
			}
			
			is_inited = true;
		},
		
		
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
			params = copyObj(params);
			
			params.width = params.c_width = params.width || params.radius;
			params.height = params.c_height = params.height || params.radius;
			params.offset = '';
			
			if (params.type.charAt(0) == 'b')
				params.offset += 'top: 0px;';
			if (params.type.charAt(1) == 'r')
				params.offset += 'left: 0px;';
			
			params.offset_x = (!params.use_shape && params.left) ? 0.5 * multiplier : 0;
			params.offset_y = (!params.use_shape && params.top) ? 0.5 * multiplier : 0;
			params.rotation = rotate(params.type);
			
			
			// multiply all numeric values
			walkArray(num_properties, function(i, n){
				params[n] *= multiplier;
			});
			
			
			var data = /* '<v:group class="vml" ' + replaceEntities(group_data, params) + '>' + */ 
				drawBackground(params) + 
				drawStroke(params) + 
				/* '</v:group>' */
				'';
//			if (params.type == 'tl')
//				alert(data);
//			var elem = createElement('div', 'rocon-cn');
//			elem.innerHTML = data;
			return data;
		},
		
		returnType: function() {
			return 2;
		}
	}
	
})();