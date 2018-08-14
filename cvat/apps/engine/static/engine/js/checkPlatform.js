// legacy syntax for IE support

var supportedPlatforms = ['Chrome', 'Firefox'];
if (supportedPlatforms.indexOf(platform.name) == -1) {
    try {
        document.documentElement.innerHTML = "<center><h1> This tool does not support " + platform.name +
                                                ". \n" +
                                                "Please use the latest version of Google Chrome or Mozilla Firefox.</h1></center>";
        window.stop();
    }
    catch (err) {
        document.execCommand('Stop');
    }
}
