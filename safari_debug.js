
window.SL = [];
const L = console.log, E = console.error, W = console.warn;
console.log = function(...a) { window.SL.push(['LOG', a.join(' ')]); L.apply(console, a); };
console.error = function(...a) { window.SL.push(['ERR', a.join(' ')]); E.apply(console, a); };
console.warn = function(...a) { window.SL.push(['WARN', a.join(' ')]); W.apply(console, a); };
window.onerror = function(m, u, l) { window.SL.push(['ERR', m + ' @' + l]); };
if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
    setInterval(function() {
        var d = document.getElementById('sd');
        if (!d) {
            d = document.createElement('div');
            d.id = 'sd';
            d.style.cssText = 'position:fixed;top:10px;left:10px;right:10px;height:200px;background:rgba(0,0,0,0.95);color:#0f0;font:11px monospace;overflow:auto;z-index:999999;padding:10px;border:2px solid #0f0;';
            document.body.appendChild(d);
        }
        var html = '<b style="color:#fff;font-size:14px">SAFARI DEBUG</b><br><br>';
        for (var i = Math.max(0, window.SL.length - 20); i < window.SL.length; i++) {
            var x = window.SL[i];
            var c = x[0] === 'ERR' ? '#f44' : x[0] === 'WARN' ? '#ff4' : '#0f0';
            html += '<span style="color:' + c + '">' + x[0] + ':</span> ' + x[1] + '<br>';
        }
        d.innerHTML = html;
    }, 1000);
}

ENDOFDEBUG && echo 'Created'
