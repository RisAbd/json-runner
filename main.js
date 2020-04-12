(function() {
    const print = console.log;

    const levelText = document.getElementById('level');
    const playButton = document.getElementById('play');
    const windowElement = document.querySelector('.window');

    const playerElement = document.getElementById('player');

    const birdElement = document.getElementById('bird');

    const bird = {
        name: 'Воробей'
    };

    function setupBird() {
        birdElement.querySelector('.name').innerHTML = bird.name;
        let isLettingBirdFly = true;
        const repositionBird = (x, y) => {
            birdElement.style.left = `${x}px`;
            birdElement.style.top = `${y}px`;
        };
        windowElement.addEventListener('click', function(e) { isLettingBirdFly = !isLettingBirdFly; repositionBird(e.pageX, e.pageY); });
        windowElement.addEventListener('mousemove', function(e) {
            if (!isLettingBirdFly) { return; }
            repositionBird(e.pageX, e.pageY);
        });
    }
    setupBird();

    const game = {
        isPlaying: true,
        playState: null,
        gravity: 109.8,  // (':
    };

    const player = {
        velocity: {
            x: 0, y: 0,
        }, 
        acceleration: {
            x: 0, y: game.gravity,
        },
        location: {
            x: 70, y: 40,
        },
        horizontalVelocity: 100,
        jumpVelocity: -255,
        name: 'Sergey',
        _element: playerElement,
        _titleElement: playerElement.querySelector('.name'),
        _prevHorizontalMovementType: null,
        windowRect: windowElement.getBoundingClientRect(),
        playerRect: playerElement.getBoundingClientRect(), 
        setHorizontalMovement: function(type, value = this.horizontalVelocity) {
            const { x: vx } = this.velocity;
            const { _prevHorizontalMovementType: prevType } = this;
            if (value === 0 && prevType === type) {
                return;
            }
            switch (type) {
                case 'left':
                    this.velocity.x = -value;
                    break;
                case 'right':
                    this.velocity.x = value;
                    break;
                default:
                    throw new Exception('Unknown type', type);
            }

            this._prevHorizontalMovementType = value === 0 ? null : type;
        },
        jump: function() {
            this.velocity.y = this.jumpVelocity;
        },
        unjump: function() {
            this.velocity.y -= this.jumpVelocity * 0.3;
        },
        _move: function({ timeFraction }) {
            const { x: vx, y: vy } = this.velocity;
            const { x: ax, y: ay } = this.acceleration
            const { x, y } = this.location;

            this.location = { x: x + vx * timeFraction, y: y + vy * timeFraction };
            this.velocity = { x: vx + timeFraction * ax, y: vy + timeFraction * ay };

            requestAnimationFrame(this._boundReposition);
        },
        _reposition: function() {
            // print(this);
            const { x, y } = this.location;
            this._element.style.left = `${x}px`;
            this._element.style.top = `${y}px`;
        },
        _boundReposition: undefined,
        setup: function() {
            this._titleElement.innerHTML = this.name;
            this._reposition();
            this._boundReposition = this._reposition.bind(this);
        },
    };

    player.setup();

    // const clip = function(el, from, to) {
    //   var range = document.createRange();
    //   range.setStart(el.firstChild, from);
    //   range.setEnd(el.firstChild, to);
    //   // range.selectNodeContents(el);
    //   var sel = window.getSelection();
    //   sel.removeAllRanges();
    //   sel.addRange(range);
    //   return range;
    // };

    function togglePlayButton(isPlaying) {
        if (isPlaying) {
            playButton.innerText = 'Pause';
            playButton.style.backgroundColor = 'gray';
        } else {
            playButton.innerText = 'Play';
            playButton.style.backgroundColor = 'green';
        }
    }

    togglePlayButton(game.isPlaying);


    function play({el = levelText.firstChild, pEl = levelText, range, length, start = 0, offset = 1, chars = 300, tick = 23} = {}) {

        if (!range) {
            range = document.createRange();
        }

        if (!length) {
            length = el.length;
        }

        const end = Math.min(start+chars, length);

        range.setStart(el, start);
        range.setEnd(el, end);

        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        if (end === length) {
            return;
        }

        if (game.isPlaying) {
            windowElement.scrollLeft = start * 0.7;
        }

        start = game.isPlaying ? start+offset : start;

        s = {el, pEl, range, length, start: start, offset, chars, tick}

        setTimeout(play, tick, s);
    }

    playButton.addEventListener('click', e => {
        game.isPlaying = !game.isPlaying;
        togglePlayButton(game.isPlaying);
    });

    const onPlayerKeyDown = e => {
        const { keyCode } = e;
        const step = 15;
        switch (keyCode) {
            case 38: // up
                player.jump();
                break;
            case 39: // right
                player.setHorizontalMovement('right');
                break;
            case 40: // down
                player.unjump();
                break;
            case 37: // left
                player.setHorizontalMovement('left');
                break;
            default:
                return;
        }
    };

    const onPlayerKeyUp = e => {
        const { keyCode } = e;
        const step = 15;
        switch (keyCode) {
            case 38: // up
                break;
            case 39: // right
                player.setHorizontalMovement('right', 0);
                break;
            case 40: // down
                break;
            case 37: // left
                player.setHorizontalMovement('left', 0);
                break;
            default:
                return;
        }
    };

    document.addEventListener('keydown', onPlayerKeyDown);
    document.addEventListener('keyup', onPlayerKeyUp)

    const startPlayerPositionTimer = ({ prevTs = performance.now(), tick = 16 } = {}) => {

        const ts = performance.now();

        const timeFraction = (ts - prevTs) / 1000;

        player._move({ timeFraction });
        // print(player.location);

        const s = { player, game, prevTs: ts, tick };

        setTimeout(startPlayerPositionTimer, tick, s);
    };

    startPlayerPositionTimer();

    async function loadLevel() {
        const level = await fetch('level1.json').then(r => r.text());

        levelText.innerHTML = level;

        play();
    }

    loadLevel();
})();
