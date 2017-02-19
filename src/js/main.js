(function() {
	var	container = document.querySelector('.container'),
			room = container.querySelector('.cube'),
			rows = [].slice.call(room.querySelectorAll('.seat-area > .row')),
			rowsNum = rows.length,
			colsNum = rows[0].children.length,
			seats = [].slice.call(room.querySelectorAll('.row-seat')),
			seatWidth = seats[0].offsetWidth,
			ticket = document.querySelector('.ticket'),
			ticketSeats = [].slice.call(ticket.querySelectorAll('.row-seat')),
			monitor = room.querySelector('.screen'),
			video = monitor.querySelector('video'),
			playCtrl = monitor.querySelector('button.action-play'),
		    intro = monitor.querySelector('.intro'),
		    selectSeatsCtrl = intro.querySelector('button.action-seats'),
			lookaroundCtrl = document.querySelector('button.action-lookaround'),
			// how much the camera rotates when the user moves the mouse
			lookaroundRotation = {
				rotateX : 25, // a relative rotation of -25deg to 25deg on the x-axis
				rotateY : 15  // a relative rotation of -15deg to 15deg on the y-axis
			},        
			// controls whether the tilt is active or not
			lookaround = false,
			winsize = {width: window.innerWidth, height: window.innerHeight},
			sideWidth = 4 * seatWidth,
			// if the following is changed, the CSS values also need to be adjusted (and vice-versa)
			rowFrontGap = 800,
			rowRowGap = 100,
			middleGapNum = 2,
			perspective = 2000,
			roomsize = {
				x : rowsNum * seatWidth + sideWidth + middleGapNum * seatWidth,
				y : 1000, // SCSS $cube-y
				z : 3000 // SCSS $cube-z
			},
			// transition settings for the room animations (moving camera to seat)
			transitionOpts = {'speed' : 1000, 'easing' : 'cubic-bezier(.7,0,.3,1)'},
			// the initial values for the room transform
			initTransform = {
				translateX : 0,
				translateY : roomsize.y/3.5, // view from top..  
				translateZ : 0,
				rotateX : -15, // ..looking down
				rotateY : 0
			},        
			// the current room transform
			roomTransform = initTransform;
	var support = {transitions : Modernizr.csstransitions},
			transEndEventNames = {'WebkitTransition': 'webkitTransitionEnd', 'MozTransition': 'transitionend', 'OTransition': 'oTransitionEnd', 'msTransition': 'MSTransitionEnd', 'transition': 'transitionend'},
			//过渡完成时触发的事件名  当然了 前提是support为ture 事件名才不会undefined
			transEndEventName = transEndEventNames[Modernizr.prefixed('transition')],
			onEndTransition = function(el, callback) {
			//el都是传room  
				var onEndCallbackFn = function( ev ) {
					if( support.transitions ) {
						//如果不是room过渡完成  而是room的子元素过渡完成触发事件冒泡而被room接收 则不管
						if( ev.target != this ) return 
						//就是room本身过渡完成  那么room移除监听 
						this.removeEventListener( transEndEventName, onEndCallbackFn )
					}
					//无论是否支持transion  room的过渡完成都会调用backFn一次  还有执行下面的
					if( callback && typeof callback === 'function' ) { callback.call(this) }
				}
				//支持transition， 则在room本身过渡完成时调用backFn
				if( support.transitions ) {
					el.addEventListener( transEndEventName, onEndCallbackFn )
				}
				//不支持transition， 则room本身没有过渡 可认为过渡立刻完成 直接调用backFn
				else {
					onEndCallbackFn()
				}
			};
	//container舞台的缩放   Z方向不设置  而XY缩放依据 当前窗口的x CSS像素与room的固有x CSS像素比值   //*******modernizr
	function scaleRoom() {
		var factor = winsize.width / roomsize.x
		container.style[Modernizr.prefixed('transform')] = 'scale3d(' + factor + ',' + factor + ',1)'
	}     
	//room设置为没有任何的过渡
	function removeRoomTransition() {
		room.style[Modernizr.prefixed('transition')] = 'none'
	}
	//对room进行位移和旋转  room的原点在room中心
	//有传transform对象 利用对象信息  translateXYZ  rotateYZ  而rotateZ利用的是全局变量perspective*******
	//没有传transform对象  利用roomTranform信息  做法一样 
	function applyRoomTransform(transform) {
		room.style[Modernizr.prefixed('transform')] = transform ? 'translate3d(0,0,' + perspective + 'px) rotate3d(1,0,0,' + transform.rotateX + 'deg) rotate3d(0,1,0,' + transform.rotateY + 'deg) translate3d(' + transform.translateX + 'px, ' + transform.translateY + 'px, ' + transform.translateZ + 'px)'
																: 'translate3d(0,0,' + perspective + 'px) rotate3d(1,0,0,' + roomTransform.rotateX + 'deg) rotate3d(0,1,0,' + roomTransform.rotateY + 'deg) translate3d(' + roomTransform.translateX + 'px, ' + roomTransform.translateY + 'px, ' + roomTransform.translateZ + 'px)'
	}	
    //对room的transform属性的过渡设置
    //有传 利用它的信息设置过渡的时间和贝塞尔曲线  对象是room的transform属性的过渡设置
    //无传 利用默认的信息设置
	function applyRoomTransition(transSettings) {
		var settings = transSettings || transitionOpts
		room.style.WebkitTransition = '-webkit-transform ' + settings.speed + 'ms ' + settings.easing
		room.style.transition = 'transform ' + settings.speed + 'ms ' + settings.easing
	}	
	function showLookaroundCtrl() {
		classie.add(lookaroundCtrl, 'action-shown')
	}
	function disableLookaround() {
		classie.add(lookaroundCtrl, 'action-disabled')
		lookaround = false
	}
	function enableLookaround() {
		classie.remove(lookaroundCtrl, 'action-disabled')
		lookaround = true
	}	

	function lineEq(y2, y1, x2, x1, currentVal) {
		// y = mx + b
		var m = (y2 - y1) / (x2 - x1),
		    b = y1 - m * x1

		return m * currentVal + b
	}
	// preview perspective from the selected seat. Moves the camera to that position.
	function previewSeat(seat) {
		// disable lookaround
		disableLookaround()
		// change transition properties
		applyRoomTransition()
		// getComputedStyle: https://css-tricks.com/get-value-of-css-rotation-through-javascript/
		//为了获取所在行的tranform中的 translateYZ值 所有行的translateX都是0不用管  
		//注意返回transform是以matrix矩阵形式的
		var st = window.getComputedStyle(seat.parentNode, null),
			tr = st.getPropertyValue('-webkit-transform') ||
				 st.getPropertyValue('-moz-transform') ||
				 st.getPropertyValue('-ms-transform') ||
				 st.getPropertyValue('-o-transform') ||
				 st.getPropertyValue('transform') ||
				 'Either no transform set, or browser doesn´t do getComputedStyle'
			
		if( tr === 'none' ) return
		
		var values = tr.split('(')[1]
		values = values.split(')')[0]
		values = values.split(',')
			
			// translateY value of this seat´s row
		var	y = values[13],
				// translateZ value of this seat´s row   //y为座位底部距离地面的数值  z为距离前墙面的距离  
				z = values[14],
		
				// seat´s center point (x-axis)       //x为距离左墙面的距离  xyz就是seat在room的位置
				seatCenterX = seat.offsetLeft + sideWidth/2 + seat.offsetWidth/2,

				// translateX, translateY and translateZ values
				tx = seatCenterX < roomsize.x/2 ? (roomsize.x/2 - seatCenterX) :  - (seatCenterX - roomsize.x/2),
				ty = roomsize.y/2 - (roomsize.y - Math.abs(y) - seat.offsetHeight ) + 10, // add a small extra
				tz = Math.abs(z)+10, // add a small extra

				// calculate how much to rotate in the y-axis (the more close to the screen the more we need to rotate.
				// calculate how much to rotate in the x-axis (the more close to the screen the more we need to rotate)
				firstRowZ = roomsize.z - rowFrontGap,
				lastRowZ = firstRowZ - (rowsNum - 1 + middleGapNum) * rowRowGap,
			
				//x与中点的差值范围
				minDiffX = 0, maxDiffX = roomsize.x/2,
				// for the last row:
				minRotY1 = 0, maxRotY1 = 20, // min and max values for y rotation
				rotY1 = lineEq(minRotY1, maxRotY1, minDiffX, maxDiffX, tx),
				// for the first row:
				minRotY2 = 0, maxRotY2 = 50, // min and max values for y rotation
				rotY2 = lineEq(minRotY2, maxRotY2, minDiffX, maxDiffX, tx),
				// final:
				rotY = lineEq(rotY1, rotY2, lastRowZ, firstRowZ, Math.abs(z))

		// room transforms
		roomTransform = {
			translateX : tx,
			translateY : ty,
			translateZ : tz,
			rotateX : 0,//rotX,
			rotateY : rotY
		}

		// apply transform
		applyRoomTransform()
		
		//无论是否支持transion  room本身的（不是子元素）transform完成时都要把room transtion清空
		//room的transiton 现在1s 如果不清空  lookaround里又没有设置transition  lookaround就会很慢
		//在lookaround里每次都removeRoomTransition也不太好
		onEndTransition(room, function() {removeRoomTransition()} )
	}	
	// select a seat on the ticket
	function selectSeat(planseat) {
		if( classie.has(planseat, 'row-seat-reserved') ) {
			return false
		}
		if( classie.has(planseat, 'row-seat-selected') ) {
			classie.remove(planseat, 'row-seat-selected')
			return false
		}
		classie.add(planseat, 'row-seat-selected')

		// the real seat
		var seat = seats[ticketSeats.indexOf(planseat)]
		// show the seat´s perspective
		previewSeat(seat)
	}	
	function zoomOutScreen(callback) {
		applyRoomTransition({'speed' : 1500, 'easing' : 'ease'})
		applyRoomTransform(initTransform)
		//在transtion完成时  transition的设置清空 并显示lookaroundCtrl
		onEndTransition(room, function() {      
			removeRoomTransition()
			callback.call()
		})  
	}	
	function videoPlay() {
		// hide the play control
		classie.remove( playCtrl, 'action-shown')
		video.currentTime = 0
		video.play()
	}
	function videoLoad() {
		// show the play control
		classie.add( playCtrl, 'action-shown')
		video.load()
	}	
	function initEvents() {

		var onSeatSelect = function(event) {                    	
			var e= EventUtil.getEvent(event)
			var target= EventUtil.getTarget(e)
			if( classie.has( target, 'row-seat') ){
				selectSeat( target ) 
			}
		}              
		EventUtil.addHandler( ticket, 'click', onSeatSelect )

		// enabling/disabling the lookaround
		var onLookaroundCtrlClick = function() {
			// if lookaround is enabled..
			if( lookaround ) {
				disableLookaround()
			}
			else {
				enableLookaround()
			}
		}
		EventUtil.addHandler( lookaroundCtrl, 'click', onLookaroundCtrlClick )

		// mousemove event / lookaround functionality
		var onMouseMove = function( event ) {
			requestAnimFrame(function() {
				if( !lookaround ) return false     

				var mousepos = getMousePos( event ),
						rotX = roomTransform.rotateX -  (2 * lookaroundRotation.rotateX * mousepos.y / winsize.height - lookaroundRotation.rotateX),
						rotY = roomTransform.rotateY +  (2 * lookaroundRotation.rotateY * mousepos.x / winsize.width - lookaroundRotation.rotateY),	
            obj = {
            	translateX : roomTransform.translateX, 
            	translateY : roomTransform.translateY, 
            	translateZ : roomTransform.translateZ, 
            	rotateX : rotX, 
            	rotateY : rotY
            }
				applyRoomTransform( obj )
			})
		}
		EventUtil.addHandler( document, 'mousemove', onMouseMove )  

		// select seats control click (intro button): show the room layout
		var onSelectSeats = function() { 
			classie.remove( intro, 'intro-shown')
			classie.add( ticket, 'ticket-shown')
			classie.add( playCtrl, 'action-faded')
			zoomOutScreen(function() {
				showLookaroundCtrl()
			}) 
		}
		EventUtil.addHandler( selectSeatsCtrl, 'click', onSelectSeats )

		// play video
		EventUtil.addHandler( playCtrl, 'click', videoPlay )
		// ended video event
		EventUtil.addHandler( video, 'ended', videoLoad )

		// window resize: update window size
		window.addEventListener('resize', throttle(function(ev) {       
			winsize = {width: window.innerWidth, height: window.innerHeight}
			scaleRoom()
		}, 10))																
	}	
	function init() {
		// scale room to fit viewport*******
		scaleRoom()
		// initial view (zoomed screen)   把room往前移动1300  SCSS里设置视点2000  
		applyRoomTransform({'translateX' : 0, 'translateY' : 0, 'translateZ' : 1300, 'rotateX' : 0, 'rotateY' : 0})
		// bind events
	  initEvents()
	}
	init()
    
})();