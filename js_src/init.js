/**
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * @include "common.js"
 * @include "worker.js"
 * @include "canvas.js"
 * @include "vml.js"
 */

addDomReady(processRoundedElements);
// после того, как добавили уголки, необходимо очистить кэш фона,
// иначе будут проблемы с динамическим обновлением блоков
addDomReady(function(){
	walkArray(getBg.processed_elems, function(){
		this.removeAttribute('rocon_bg');
	});
	getBg.use_cache = false;
});

// set browser-specific properties
//canvas.returnType(2);
worker.setAdapter(canvas);
if (browser.safari) {
	canvas.returnType(2);
//	worker.nativeProperties(
//		'-webkit-border-top-left-radius', 
//		'-webkit-border-top-right-radius', 
//		'-webkit-border-bottom-right-radius', 
//		'-webkit-border-bottom-left-radius' 
//	);
} else if (browser.mozilla) {
//	worker.nativeProperties(
//		'-moz-border-radius-topleft', 
//		'-moz-border-radius-topright', 
//		'-moz-border-radius-bottomright', 
//		'-moz-border-radius-bottomleft'
//	);
} else if (browser.msie) {
	worker.setAdapter(vml);
	addDomReady(function(){
		corners_ss.cssText += css_text;
		css_text = '';
		addRule = corners_ss.addRule;
	});
}
//else if (browser.opera)
//	worker.setAdapter(svg);

bindReady();