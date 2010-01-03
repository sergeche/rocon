/**
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */

var base64 = {
	b64: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
	/**
	 * Encodes data with MIME base64
	 * @author Tyler Akins (http://rumkin.com)
	 * @improvements Bayron Guevara
	 * @improvements Thunder.m
	 * @improvements Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	 * @improvements Pellentesque Malesuada
	 * @requires utf8_encode
	 * @param {String} data Data to encode
	 * @return {String}
	 */
	encode: function(data) {
		var b64 = this.b64;
		var o1, o2, o3, h1, h2, h3, h4, bits, i = ac = 0, enc="", tmp_arr = [];

		if (!data) {
			return data;
		}

//		data = this.utf8_encode(data+'');

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
	},

	/**
	 * Decodes data encoded with MIME base64
	 * @author Tyler Akins (http://rumkin.com)
	 * @improvements Aman Gupta
	 * @improvements Onno Marsman
	 * @improvements Pellentesque Malesuada
	 * @improvements Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	 * @param {String} data Data to decode
	 * @return {String}
	 */
	decode: function(data){
		var b64 = this.b64;
		var o1, o2, o3, h1, h2, h3, h4, bits, i = ac = 0, dec = "", tmp_arr = [];

		if (!data) {
			return data;
		}

		data += '';

		do {  // unpack four hexets into three octets using index points in b64
			h1 = b64.indexOf(data.charAt(i++));
			h2 = b64.indexOf(data.charAt(i++));
			h3 = b64.indexOf(data.charAt(i++));
			h4 = b64.indexOf(data.charAt(i++));

			bits = h1<<18 | h2<<12 | h3<<6 | h4;

			o1 = bits>>16 & 0xff;
			o2 = bits>>8 & 0xff;
			o3 = bits & 0xff;

			if (h3 == 64) {
				tmp_arr[ac++] = String.fromCharCode(o1);
			} else if (h4 == 64) {
				tmp_arr[ac++] = String.fromCharCode(o1, o2);
			} else {
				tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
			}
		} while (i < data.length);

		dec = tmp_arr.join('');
		dec = this.utf8_decode(dec);

		return dec;
	},
	
	/**
	 * Encodes an ISO-8859-1 string to UTF-8
	 * @author Webtoolkit.info (http://www.webtoolkit.info/)
	 * @improvements Aman Gupta
	 * @improvements Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	 * @improvements Norman "zEh" Fuchs
	 * @improvements hitwork
	 * @improvements Onno Marsman
	 * @param {String} string ISO-8859-1 string to encode
	 * @return {String}
	 */
	utf8_encode: function(string) {
		string = (string+'').replace(/\r\n/g, "\n").replace(/\r/g, "\n");

		var utftext = "";
		var start, end;
		var stringl = 0;
	
		start = end = 0;
		stringl = string.length;
		for (var n = 0; n < stringl; n++) {
			var c1 = string.charCodeAt(n);
			var enc = null;
	
			if (c1 < 128) {
				end++;
			} else if((c1 > 127) && (c1 < 2048)) {
				enc = String.fromCharCode((c1 >> 6) | 192) + String.fromCharCode((c1 & 63) | 128);
			} else {
				enc = String.fromCharCode((c1 >> 12) | 224) + String.fromCharCode(((c1 >> 6) & 63) | 128) + String.fromCharCode((c1 & 63) | 128);
			}
			if (enc != null) {
				if (end > start) {
					utftext += string.substring(start, end);
				}
				utftext += enc;
				start = end = n+1;
			}
		}
	
		if (end > start) {
			utftext += string.substring(start, string.length);
		}
	
		return utftext;
	},
	
	/**
	 * Converts a string with ISO-8859-1 characters encoded with UTF-8 
	 * to single-byte ISO-8859-1
	 * @author Webtoolkit.info (http://www.webtoolkit.info/)
	 * @improvements Aman Gupta
	 * @improvements Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	 * @improvements Norman "zEh" Fuchs
	 * @improvements hitwork
	 * @improvements Onno Marsman
	 * @param {String} str_data 
	 * @return {String}
	 */
	utf8_decode: function(str_data) {
		var tmp_arr = [], i = ac = c1 = c2 = c3 = 0;

		str_data += '';
	
		while ( i < str_data.length ) {
			c1 = str_data.charCodeAt(i);
			if (c1 < 128) {
				tmp_arr[ac++] = String.fromCharCode(c1);
				i++;
			} else if ((c1 > 191) && (c1 < 224)) {
				c2 = str_data.charCodeAt(i+1);
				tmp_arr[ac++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
				i += 2;
			} else {
				c2 = str_data.charCodeAt(i+1);
				c3 = str_data.charCodeAt(i+2);
				tmp_arr[ac++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
		}
	
		return tmp_arr.join('');
	}
};