var EventUtil={
	addHandler:function(element, type, handler) {
		if (element.addEventListener) {
			element.addEventListener(type, handler, false)
		} else if (element.attachEvent) {
			element.attachEvent('on'+type, handler)
		} else  {
			element['on' + type] = handler
		} 
	},
	removeHandler:function(element, type, handler) {
		if (element.removeEventListener) {
			element.removeEventListener(type, handler, false)
		} else if (element.detachEvent) {
			element.detachEvent('on'+type, handler)
		} else  {
			element['on' + type] = null
		}
	},	
	getEvent:function(event){
		return event ? event : window.event
	},
	getTarget:function(event){
		return event.target || event.srcElement
	},	
	preventDefault:function(event){
		if(event.preventDefault){
			event.preventDefault()
		}
		else{
			event.returnValue=false
		}	
	},
	stopPropagation:function(event){
		if(event.stopPropagation){
			event.stopPropagation()
		}
		else{
			event.cancelBubble=true
		}	
	}
}

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function( callback ){
            window.setTimeout(callback, 1000 / 60)//定义每秒执行60次动画
          }
})()


// from http://www.quirksmode.org/js/events_properties.html#position
function getMousePos(e) {
	var posx = 0
	var posy = 0
	if (!e) var e = window.event
	if (e.pageX || e.pageY) 	{
		posx = e.pageX
		posy = e.pageY
	}
	else if (e.clientX || e.clientY) 	{
		posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft
		posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop
	}
	return {
		x : posx,
		y : posy
	}
}

function throttle(fn, delay) {
	var allowSample = true
	return function(e) {
		if (allowSample) {
			allowSample = false
			setTimeout(function() { allowSample = true }, delay)
			fn(e)
		}
	}
}

(function() {
	// class helper functions from bonzo https://github.com/ded/bonzo
	function classReg( className ) {
	  return new RegExp('(^|\\s+)' + className + '(\\s+|$)')
	}

	// classList support for class management
	// altho to be fair, the api sucks because it won't accept multiple classes at once
	var hasClass, addClass, removeClass

	if ( 'classList' in document.documentElement ) {
		hasClass = function( elem, c ) {
			return elem.classList.contains( c )
		}
		addClass = function( elem, c ) {
			elem.classList.add( c )
		}
		removeClass = function( elem, c ) {
			elem.classList.remove( c )
		}
	} else {
		hasClass = function( elem, c ) {
		  return classReg( c ).test( elem.className )
		}

		addClass = function( elem, c ) {
	    if ( !hasClass( elem, c ) ) {
	      elem.className = elem.className + ' ' + c
	    }
		}

		removeClass = function( elem, c ) {
		  elem.className = elem.className.replace( classReg( c ), ' ' )
		}
	}

	function toggleClass( elem, c ) {
		var fn = hasClass( elem, c ) ? removeClass : addClass
		fn( elem, c )
	}

	var classie = {
		// full names
		hasClass: hasClass,
		addClass: addClass,
		removeClass: removeClass,
		toggleClass: toggleClass,
		// short names
		has: hasClass,
		add: addClass,
		remove: removeClass,
		toggle: toggleClass
	}

	window.classie = classie

})();
