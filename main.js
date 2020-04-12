(function() {
    const print = console.log;

    const controlsForm = document.querySelector('#controls');
    const playButton = controlsForm.querySelector('button[name=play]');
    const stopButton = controlsForm.querySelector('button[name=stop]');
    const jsonUrlSourceInput = controlsForm.querySelector('input[name=url]');

    const levelContainer = document.querySelector('.level-container');
    const levelEl = levelContainer.querySelector('.level');

    const levelText = document.getElementById('level');
    const windowElement = document.querySelector('.window');

    const playerElement = document.getElementById('player');

    const birdElement = document.getElementById('bird');

    const bird = {
        name: 'Воробей',
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
        isPlaying: false,
        playState: null,
        gravity: 609.8,  // (':
        MAX_VELOCITY: {
            vertical: 300,
            horizontal: 300,
        }
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
        horizontalVelocity: 50,
        jumpVelocity: 200,
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
            this.velocity.y = (this.velocity.y > 0 ? -this.jumpVelocity : this.velocity.y - this.jumpVelocity);
            this.velocity.y = Math.min(game.MAX_VELOCITY.vertical, Math.max(-game.MAX_VELOCITY.vertical, this.velocity.y));
        },
        unjump: function() {
            this.velocity.y = this.jumpVelocity * 0.3;
        },
        _move: function({ timeFraction }) {
            const { x: vx, y: vy } = this.velocity;
            const { x: ax, y: ay } = this.acceleration
            const { x, y } = this.location;

            this.location = { x: x + vx * timeFraction, y: y + vy * timeFraction };
            this.velocity = { x: vx + timeFraction * ax, y: vy + timeFraction * ay };

            requestAnimationFrame(this._reposition);
        },
        _reposition: function() {
            const { x, y } = this.location;
            this._element.style.left = `${x}px`;
            this._element.style.top = `${y}px`;
        },
        setup: function() {
            this._titleElement.innerHTML = this.name;
            this._reposition = this._reposition.bind(this);
            this._reposition();
        },
    };

    player.setup();

    function togglePlayButton(isPlaying) {
        if (isPlaying) {
            playButton.innerText = 'Pause';
            playButton.dataset.pause = true;
        } else {
            playButton.innerText = 'Resume';
            playButton.dataset.pause = false;
        }
    }


    function play(opts = {}) {

        const {length, range = document.createRange(), elementFromIndex = () => levelEl, start = 0, offset = 1, chars = 300, tick = 23} = opts;

        const end = Math.min(start+chars, length);

        range.setStart(...elementFromIndex(start));
        range.setEnd(...elementFromIndex(end));

        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        if (end === length) {
            game.isPlaying = false;
            return;
        }

        if (game.isPlaying) {
            windowElement.scrollLeft = start * 0.6;
        }

        setTimeout(play, tick, Object.assign({}, opts, {start: (game.isPlaying ? start+offset : start)}));
    }

    playButton.addEventListener('click', e => {
        game.isPlaying = !game.isPlaying;
        togglePlayButton(game.isPlaying);
    });

    const keyMem = {up: false};

    const onPlayerKeyEvent = action => e => {
        const { keyCode } = e;
        switch (keyCode) {
            case 38: // up
                if (action == 'up') {
                    keyMem.up = false;
                } else if (action == 'down' && !keyMem.up) {
                    keyMem.up = true;
                    player.jump();
                }
                break;
            case 39: // right
                player.setHorizontalMovement('right', action === 'down' ? undefined : 0);
                break;
            case 40: // down
                if (action == 'down') {
                    player.unjump();
                }
                break;
            case 37: // left
                player.setHorizontalMovement('left', action === 'down' ? undefined : 0);
                break;
            default:
                return;
        }
    };

    document.addEventListener('keydown', onPlayerKeyEvent('down'));
    document.addEventListener('keyup', onPlayerKeyEvent('up'));

    const startPlayerPositionTimer = ({ prevTs = performance.now(), tick = 16 } = {}) => {
        const ts = performance.now();
        const scheduleNextFrame = () => setTimeout(startPlayerPositionTimer, tick, {player, game, prevTs: ts, tick});
        if (!game.isPlaying) { 
            return scheduleNextFrame();
        }

        const timeFraction = (ts - prevTs) / 1000;

        player._move({ timeFraction });

        scheduleNextFrame();
    };

    startPlayerPositionTimer();

    async function loadLevel() {
        const level = await fetch(jsonUrlSourceInput.value)
            .then(r => r.text());

        const levelIndex = [];  // items are (textNode, charIndex)
        level.split('\n').forEach((ch, i) => {
            const lineEl = document.createElement('span');
            lineEl.innerText = ch;
            lineEl.classList.toggle('level-line');
            const textNode = lineEl.firstChild;
            levelIndex.push(...ch.split('').map((_, i) => [textNode, i]));
            levelEl.append(lineEl);
        })

        // levelText.innerHTML = level;

        play({length: levelIndex.length, elementFromIndex: i => levelIndex[i]});

        playButton.focus();
    }

    loadLevel();
})();
