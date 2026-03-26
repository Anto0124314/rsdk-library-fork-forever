var Module = {
    onRuntimeInitialized: function () {
        TS_InitFS('RSDKv4', function () {
    console.log('EngineFS initialized');
    
    // 1. Tell the UI we are downloading
    Module.setStatus('Downloading Game Data...');
    
    // 2. Fetch Data.rsdk manually from your server
    fetch('Data.rsdk')
        .then(response => {
            if (!response.ok) throw new Error("Could not find Data.rsdk on the server!");
            return response.arrayBuffer();
        })
        .then(buffer => {
            // 3. Write the downloaded file into Emscripten's Virtual Filesystem
            // We write it into the /RSDKv4 folder since your RSDK_Init() does FS.chdir('/RSDKv4')
            FS.writeFile('/RSDKv4/Data.rsdk', new Uint8Array(buffer));
            console.log('Data.rsdk mounted successfully!');
            
            // 4. Clean up the UI
            Module.setStatus(''); 
            const splash = document.getElementById("splash");
            if (splash) {
                splash.style.opacity = 0;
                setTimeout(() => { splash.remove(); }, 1000);
            }
            
            // 5. NOW we boot the engine!
            RSDK_Init();
        })
        .catch(err => {
            console.error(err);
            Module.setStatus('Failed to load game assets.');
        });
});
    },
    print: (function () {
        var element = document.getElementById('output');
        if (element) element.value = ''; // clear browser cache
        return function (text) {
            if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');

            console.log(text);
            if (element) {
                element.value += text + "\n";
                element.scrollTop = element.scrollHeight; // focus on bottom
            }
        };
    })(),
    canvas: (() => {
        var canvas = document.getElementById('canvas');
        canvas.addEventListener("webglcontextlost", (e) => { alert('WebGL context lost. You will need to reload the page.'); e.preventDefault(); }, false);
        return canvas;
    })(),
    setStatus: (text) => {
        if (!Module.setStatus.last) Module.setStatus.last = { time: Date.now(), text: '' };
        if (text === Module.setStatus.last.text) return;
        var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
        var now = Date.now();
        if (m && now - Module.setStatus.last.time < 30) return; // if this is a progress update, skip it if too soon
        Module.setStatus.last.time = now;
        Module.setStatus.last.text = text;

        if (m) {
            text = m[1];
        }

        console.log(text);

        // statusElement.innerHTML = text;
    },
    totalDependencies: 0,
    monitorRunDependencies: (left) => {
        this.totalDependencies = Math.max(this.totalDependencies, left);
        Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies - left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
    }
};
Module.setStatus('Downloading...');
window.onerror = (event, source, lineno, colno, error) => {
    var msg = "Error: " + event;
    if (error && error.stack) msg += "\n" + error.stack;
    
    // Send to console.error so our React Hook catches it!
    console.error(msg); 
    
    Module.setStatus('Exception thrown: ' + event);
    Module.setStatus = (text) => {
        if (text) console.error('[post-exception status] ' + text);
    };
};

function RSDK_Init() {
    FS.chdir('/RSDKv4');

    const storedSettings = localStorage.getItem('settings');
    if (storedSettings) {
        const settings = JSON.parse(storedSettings);

        // value, index
        // index 0 - plus
        // index 1 - device profile
        _RSDK_Configure(settings.enablePlus, 0);

        switch (settings.deviceProfile) {
            case "mobile":
                _RSDK_Configure(1, 1);
                break;
            default:
                _RSDK_Configure(0, 1);
                break;
        }        
    }

    _RSDK_Initialize();
}
