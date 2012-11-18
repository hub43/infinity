var myId = (new Date).getTime() + (Math.floor(Math.random() * 1000)), countPlayers = 1,  
keys = {LEFT : 37, UP : 38, RIGHT : 39, DOWN : 40}, shipVelocity = 4, fireVelocity = 8,
astroidVelocity = 2, SPACE = 32, SCREEN_WIDTH = 800, SCREEN_HEIGHT = 600;

$('.my-ship').addClass('player-' + myId);
Basbosa('Logger').setOptions({level : 4});
Basbosa('SocketClient').socket.connect();

$(function() {
	$('body').live('keydown', function(e) {
		var keycode = ( e.keyCode ? e.keyCode : (e.which ? e.which : e.charCode));
		for (var direction in keys) {
			if (keycode == keys[direction]) {
				if ($('.my-ship').data('direction') == direction) return;
				$('.my-ship').data('direction', direction);
				Basbosa('j').ltrigger('ui.public.move', {playerId : myId, direction : direction, 
					position : $('.my-ship').position()});
				break;
			}	  		
  	}
		if (keycode == SPACE) {
			Basbosa('j').ltrigger('ui.public.move', {playerId : myId, direction : $('.my-ship').data('direction'), 
				position : $('.my-ship').position(), fire : true});
				var fire = $('<div>').addClass('fire moving').data('direction', 'UP').css({
					top : $('.my-ship').position().top + 40,
					left : $('.my-ship').position().left + 25,
				});
				$('#game').append(fire);
		}
	});
	
	$('body').live('keyup', function(e) {
		var keycode = ( e.keyCode ? e.keyCode : (e.which ? e.which : e.charCode ));
		for (var direction in keys) {
			if (keycode == keys[direction]) {
				$('.my-ship').data('direction', 'none');
				Basbosa('j').ltrigger('ui.public.move', {playerId : myId, direction : 'none', 
					position : $('.my-ship').position()});
				break;
			}	  		
  	}
	});
});

requestAnimFrame = function() {
  result = (
      window.requestAnimationFrame       || 
      window.webkitRequestAnimationFrame || 
      window.mozRequestAnimationFrame    || 
      window.oRequestAnimationFrame      || 
      window.msRequestAnimationFrame     || 
      null
  );
  return result;
}();

if (requestAnimFrame) {
	(function animationLoop() {
		requestAnimFrame(animationLoop);
		animationFrame();				
	})();
} else {
	window.setInterval(animationFrame, 1000 / 60);
}


function animationFrame() {
	$('.moving').each(function() {
		var direction = $(this).data('direction');
		if ($(this).hasClass('ship')) {
			velocity = shipVelocity;
		} else if ($(this).hasClass('fire')) {
			velocity = fireVelocity;
		} else {
			velocity = astroidVelocity;
		}
		
		if ($(this).hasClass('bounded')) {
			if ($(this).position().left < 10 && direction == 'LEFT') return;
			if ($(this).position().left > SCREEN_WIDTH && direction == 'RIGHT') return;
			if ($(this).position().top < 10 && direction == 'UP') return;
			if ($(this).position().top > SCREEN_HEIGHT && direction == 'DOWN') return;
		}
		switch (direction) {
			case 'LEFT' :
				$(this).css('left', parseInt($(this).css('left')) - (1 * velocity));
				break;
			case 'RIGHT' : 
				$(this).css('left', parseInt($(this).css('left')) + (1 * velocity));
				break;
			case 'UP' : 
				$(this).css('top', parseInt($(this).css('top')) - (1 * velocity));
				break;
			case 'DOWN' : 
				$(this).css('top', parseInt($(this).css('top')) + (1 * velocity));
				break;
		}	
		if ($(this).position().top < -40 || $(this).position().top > 800) $(this).remove();
	});
	
	// detect colloision
	$('.meteor').each(function(){
		var $meteor = $(this), mp = $meteor.position();
		$('.fire').each(function() {
			var $fire = $(this), fp = $fire.position();
			if (fp.left >= mp.left && fp.left <= mp.left + $meteor.width()) {
				if (mp.top > fp.top + $meteor.height()) {
					$fire.remove();
					$meteor.remove();
					var explode = $('<img>').attr('src', 'img/explode.gif').css({
							top : mp.top - 30,
							left : mp.left
					});
					$('#game').append(explode);
					setTimeout(function(){
						explode.remove();
					}, 1000);
				}
			}
		});
	});
	
};




Basbosa('SocketClient').lon('public.move_result', function(e, message, next) {
	if (message.playerId == myId) return;
	
	// If this player is not in out space
	if (!$('.player-' + message.playerId).size()) {
		var $newShip = $('<div>').addClass('ship moving bounded ship' + ++countPlayers);
		$newShip.addClass('player-' + message.playerId);
		$newShip.css('left', message.position.top);
		$('#game').append($newShip);
	}
	$('.player-' + message.playerId).data('direction', message.direction).css({
		top 	: message.position.top,
		left 	: message.position.left,
	});
	if (message.fire) {
		var fire = $('<div>').addClass('fire moving').data('direction', 'UP').css({
			top : message.position.top + 40,
			left : message.position.left + 25,
		});
		$('#game').append(fire);
	}		
});


function genAstroids() {
	Basbosa('j').ltrigger('ui.public.meteor', {
		left : Math.floor(Math.random() * SCREEN_WIDTH),
		size : Math.floor(Math.random() * 68) + 30,
		rotation : Math.floor(Math.random() * 360),
	});
}
setInterval(genAstroids, 3000);
Basbosa('SocketClient').lon('public.meteor_result', function(e, message, next) {
	var rotate = 'rotate(' + message.rotation + 'deg)', $meteor = $('<img>').attr('src', 'img/meteor.png')
		.addClass('meteor moving')
		.data('direction', 'DOWN')
		.css({left : message.left, width : message.size, height : message.size,
			'transform'	: rotate, '-ms-transform' : rotate, '-webkit-transform': rotate,
			'-o-transform' : rotate, '-moz-transform' : rotate
		});
	$('#game').append($meteor);
});

