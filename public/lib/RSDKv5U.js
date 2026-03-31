function enforceIntegerScaling() {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;

    const baseWidth = 424;
    const baseHeight = 240;

    const scaleX = Math.floor(window.innerWidth / baseWidth);
    const scaleY = Math.floor(window.innerHeight / baseHeight);
    const scale = Math.max(1, Math.min(scaleX, scaleY));

    canvas.style.width = (baseWidth * scale) + 'px';
    canvas.style.height = (baseHeight * scale) + 'px';
    canvas.style.imageRendering = 'pixelated';

    canvas.style.position = 'absolute';
    canvas.style.top = '50%';
    canvas.style.left = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
}

document.body.style.backgroundColor = 'black';
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';

window.addEventListener('resize', enforceIntegerScaling);

var Module = {
    onRuntimeInitialized: function () {
        TS_InitFS('RSDKv5U',
            function () {
                console.log('EngineFS initialized');
                if (window.__engineConsoleAppend) window.__engineConsoleAppend('EngineFS initialized');

                const splash = document.getElementById("splash");
                splash.style.opacity = 0;
                setTimeout(() => { splash.remove(); }, 1000);
                RSDK_Init();
            });
    },
    print: (function () {
        var element = document.getElementById('output');
        if (element) element.value = '';
        return function (text) {
            if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');

            console.log(text);

            // Pipe to in-page console
            if (window.__engineConsoleAppend) {
                window.__engineConsoleAppend(text);
            }

            if (element) {
                element.value += text + "\n";
                element.scrollTop = element.scrollHeight;
            }
        };
    })(),
    printErr: (function () {
        return function (text) {
            if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');

            console.error(text);

            // Pipe errors to in-page console too
            if (window.__engineConsoleAppend) {
                window.__engineConsoleAppend('[ERROR] ' + text);
            }
        };
    })(),
    canvas: (() => {
        var canvas = document.getElementById('canvas');
        canvas.addEventListener("webglcontextlost", (e) => {
            alert('WebGL context lost. You will need to reload the page.');
            e.preventDefault();
        }, false);
        enforceIntegerScaling();
        return canvas;
    })(),
    setStatus: (text) => {
        if (!Module.setStatus.last) Module.setStatus.last = { time: Date.now(), text: '' };
        if (text === Module.setStatus.last.text) return;
        var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
        var now = Date.now();
        if (m && now - Module.setStatus.last.time < 30) return;
        Module.setStatus.last.time = now;
        Module.setStatus.last.text = text;

        if (m) {
            text = m[1];
        }

        console.log(text);
        if (window.__engineConsoleAppend) window.__engineConsoleAppend('[STATUS] ' + text);
    },
    totalDependencies: 0,
    monitorRunDependencies: (left) => {
        this.totalDependencies = Math.max(this.totalDependencies, left);
        Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies - left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
    }
};

Module.setStatus('Downloading...');

window.onerror = (msg, url, line) => {
    var errorText = 'Exception thrown, see JavaScript console';
    Module.setStatus(errorText);
    if (window.__engineConsoleAppend) {
        window.__engineConsoleAppend('[FATAL] ' + msg + ' at ' + url + ':' + line);
    }

    Module.setStatus = (text) => {
        if (text) {
            console.error('[post-exception status] ' + text);
            if (window.__engineConsoleAppend) window.__engineConsoleAppend('[post-exception] ' + text);
        }
    };
};

function RSDK_Init() {
    try {
        FS.chdir('/RSDKv5U');

        // Check what files exist
        try {
            var files = FS.readdir('/RSDKv5U');
            console.log('Files in /RSDKv5U:', JSON.stringify(files));
            if (window.__engineConsoleAppend) window.__engineConsoleAppend('Files: ' + JSON.stringify(files));
        } catch(e) {
            console.error('/RSDKv5U directory error:', e);
            if (window.__engineConsoleAppend) window.__engineConsoleAppend('[ERROR] /RSDKv5U dir: ' + e.message);
        }

        // Check Data.rsdk specifically
        try {
            var stat = FS.stat('/RSDKv5U/Data.rsdk');
            console.log('Data.rsdk size:', stat.size);
            if (window.__engineConsoleAppend) window.__engineConsoleAppend('Data.rsdk size: ' + stat.size);
        } catch(e) {
            console.error('Data.rsdk NOT FOUND');
            if (window.__engineConsoleAppend) window.__engineConsoleAppend('[ERROR] Data.rsdk NOT FOUND');
        }

        const storedSettings = localStorage.getItem('settings');
        if (storedSettings) {
            const settings = JSON.parse(storedSettings);
            console.log('Settings:', JSON.stringify(settings));
            if (window.__engineConsoleAppend) window.__engineConsoleAppend('Settings: ' + JSON.stringify(settings));

            console.log('Calling _RSDK_Configure...');
            _RSDK_Configure(settings.enablePlus, 0);
            console.log('_RSDK_Configure returned OK');
        } else {
            console.log('No settings in localStorage');
            if (window.__engineConsoleAppend) window.__engineConsoleAppend('No settings found');
        }

        console.log('About to call _RSDK_Initialize...');
        if (window.__engineConsoleAppend) window.__engineConsoleAppend('Calling _RSDK_Initialize...');
        _RSDK_Initialize();
        console.log('_RSDK_Initialize returned OK');
    } catch(e) {
        console.error('RSDK_Init crashed:', e.message);
        console.error('Stack:', e.stack);
        if (window.__engineConsoleAppend) {
            window.__engineConsoleAppend('[FATAL] RSDK_Init: ' + e.message);
            window.__engineConsoleAppend('[STACK] ' + e.stack);
        }
    }
}
