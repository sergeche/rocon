/**
 * Canvas adapter for drawing rounded corners
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * 
 * @include "common.js"
 * @include "/js-libs/canvas-doc.js"
 */var canvas = (function(){
	
	var composite_op = 'destination-out',
	
		/** @type {Element} Canvas where all images are drawn */
		cv,
		/** @type {Element} Canvas for stroke */
		stroke_cv,
		
		/** @type {CanvasRenderingContext2D} Drawing context */
		ctx,
		/** @type {CanvasRenderingContext2D} Stroke drawing context */
		stroke_ctx,
		
		/** Type of returnerd object of <code>draw()</code> method (1 — image string, 2 — canvas element) */
		return_type = 1;
		
		// debug only
//		document.body.appendChild(cv);
	
	/**
	 * Prepare canvas for drawing: removes old paintings, restores original
	 * transform matrix, scales canvas
	 * 
	 * @param {Number} params.radius Corner radius
	 * @param {Boolean} params.use_shape Flag, indicating that shape, not counter-shape, must be drawn
	 * @param {String} params.type Corner type: tl, tr, bl, br
	 */
	function prepare(params) {
		ctx.restore();
		cv.width = params.width;
		cv.height = params.height;
		ctx.clearRect(0, 0, cv.width, cv.height);
		ctx.save();
	}
	
	/**
	 * Draw border shape (stroke) on <code>ctx</code>. Canvas must be already
	 * scaled to the size of corner.
	 * 
	 * @param {Number} params.radius Corner radius
	 * @param {Number} params.left Left border width, pixels
	 * @param {String} params.left_color Left border color
	 * @param {Number} params.top Top border width, pixels
	 * @param {String} params.top_color Top border color
	 * @param {Boolean} params.use_shape Flag, indicating that shape, not counter-shape, must be drawn
	 */
	function drawStroke(params) {
		// create short-hand vars for better YUICompressor mungin
		var radius = params.radius,
			border_left = params.left,
			border_top = params.top;
		
		if (!(border_left + border_top))
			// nothing to draw
			return;
		
			
		stroke_cv.width = params.width;	
		stroke_cv.height = params.height;
		
		stroke_ctx.clearRect(0, 0, params.width, params.height);
		
		if (border_top) {
			stroke_ctx.fillStyle = params.top_color;
			stroke_ctx.fillRect(radius, 0, cv.width, border_top);
		}
		
		if (border_left) {
			stroke_ctx.fillStyle = params.left_color;
			stroke_ctx.fillRect(0, radius, border_left, cv.height);
		}
		
		stroke_ctx.save();
		
		if (params.top_color != params.left_color) {
			var grd = ctx.createLinearGradient(0, border_top, 0, radius);
			grd.addColorStop(0, border_top ? params.top_color : params.left_color);
			grd.addColorStop(1, border_left ? params.left_color : params.top_color);
			
			stroke_ctx.fillStyle = grd;
		} else {
			stroke_ctx.fillStyle = params.top_color;
		}
		
		// start drawing two circles to create border arc
		ctx.save();
		stroke_ctx.beginPath();
		stroke_ctx.arc(radius, radius, radius, 0, Math.PI * 2, true);
		stroke_ctx.fill();
		ctx.restore();
		
		
		// change composite operation so the next circle will be extracted from the previous one
		stroke_ctx.globalCompositeOperation = composite_op;
		
		stroke_ctx.translate(border_left, border_top);
		if (radius) {
			stroke_ctx.scale(Math.max(1 - border_left / radius, 0) || 0.01, Math.max(1 - border_top / radius, 0) || 0.01);
		}
		
		stroke_ctx.beginPath();
		stroke_ctx.arc(radius, radius, radius, 0, Math.PI * 2, true);
		stroke_ctx.fill();
		stroke_ctx.restore();
		
		// leave only one quarter of circle
		stroke_ctx.clearRect(radius, border_top, radius, cv.height);
		stroke_ctx.clearRect(border_left, radius, cv.width, cv.height);
		
		ctx.drawImage(stroke_cv, 0, 0);
	}
	
	/**
	 * Rotate canvas for specified corner type
	 * 
	 * @param {String} Corner type: tl, tr, bl, br
	 * @param {Number} radius Corner radius
	 */
	function rotate(params) {
		switch (params.type) {
			case 'tr': 	// top right corner
				ctx.scale(-1, 1);
				ctx.translate(-params.width, 0);
				break;
				
			case 'bl': // bottom left corner
				ctx.scale(1, -1);
				ctx.translate(0, -params.height);
				break;
				
			case 'br': // bottom right corner
				ctx.scale(-1, -1);
				ctx.translate(-params.width, -params.height);
				break;
		}
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
		var radius = params.radius, 
			offset_x = 0, 
			offset_y = 0;
		
		ctx.save();
		ctx.fillStyle = params.color;
		if (!params.use_shape) {
			ctx.fillRect(0, 0, radius, radius);
			
			if (params.left)
				offset_x = .5;
				
			if (params.top)
				offset_y = .5;
			
			ctx.globalCompositeOperation = composite_op;
		} else {
			if (params.left)
				offset_x = 1;
				
			if (params.top)
				offset_y = 1;
		}
		
		ctx.translate(offset_x, offset_y);
		ctx.beginPath();
		ctx.fillStyle = params.color;
		ctx.arc(radius, radius, radius, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
		
		if (params.use_shape) {
			ctx.fillStyle = params.color;
			ctx.fillRect(radius, 0, cv.width, cv.height);
			ctx.fillRect(0, radius, cv.width, cv.height);
		}
	}
	
	return {
		init: function() {
			cv = createElement('canvas');
			ctx = cv.getContext('2d');
			cv.width = 10;	
			cv.height = 10;
			
			stroke_cv = createElement('canvas');
			stroke_ctx = stroke_cv.getContext('2d');
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
			// TODO delete this
			params.width = params.width || params.radius;
			params.height = params.height || params.radius;
			
			if (return_type == 2) {
				cv = createElement('canvas', 'rocon-cn');
				ctx = cv.getContext('2d');
			}
			
			prepare(params);
			rotate(params);
			drawBackground(params);
			drawStroke(params);
			return (return_type == 2) ? cv : cv.toDataURL();
		},
		
		returnType: function(type) {
			if (typeof(type) != 'undefined')
				return_type = type;
			return return_type;
		}
	};
	
})();