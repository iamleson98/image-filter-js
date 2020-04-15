"use strict"

function Bezier(start, ctrl1, ctrl2, end, lowBound, highBound) {
    var bezier, clamp, controlPoints, endX, i, j, lerp, next, prev, t, _i, _j, _ref;
    if (lowBound == null) {
        lowBound = 0;
    }
    if (highBound == null) {
        highBound = 255;
    }
    if (start[0] instanceof Array) {
        controlPoints = start;
        lowBound = ctrl1;
        highBound = ctrl2;
    } else {
        controlPoints = [start, ctrl1, ctrl2, end];
    }
    if (controlPoints.length < 2) {
        throw "Invalid number of arguments to bezier";
    }
    bezier = {};
    lerp = function (a, b, t) {
        return a * (1 - t) + b * t;
    };
    clamp = function (a, min, max) {
        return Math.min(Math.max(a, min), max);
    };
    for (i = _i = 0; _i < 1000; i = ++_i) {
        t = i / 1000;
        prev = controlPoints;
        while (prev.length > 1) {
            next = [];
            for (j = _j = 0, _ref = prev.length - 2; 0 <= _ref ? _j <= _ref : _j >= _ref; j = 0 <= _ref ? ++_j : --_j) {
                next.push([lerp(prev[j][0], prev[j + 1][0], t), lerp(prev[j][1], prev[j + 1][1], t)]);
            }
            prev = next;
        }
        bezier[Math.round(prev[0][0])] = Math.round(clamp(prev[0][1], lowBound, highBound));
    }
    endX = controlPoints[controlPoints.length - 1][0];
    bezier = MissingValues(bezier, endX);
    if (bezier[endX] == null) {
        bezier[endX] = bezier[endX - 1];
    }
    return bezier;
};

/**
 * @param {Object} values
 * @param {Number} endX
 */
function MissingValues(values, endX) {
    var i, j, leftCoord, ret, rightCoord, _i, _j;
    if (Object.keys(values).length < endX + 1) {
        ret = {};
        for (i = _i = 0; 0 <= endX ? _i <= endX : _i >= endX; i = 0 <= endX ? ++_i : --_i) {
            if (values[i] != null) {
                ret[i] = values[i];
            } else {
                leftCoord = [i - 1, ret[i - 1]];
                for (j = _j = i; i <= endX ? _j <= endX : _j >= endX; j = i <= endX ? ++_j : --_j) {
                    if (values[j] != null) {
                        rightCoord = [j, values[j]];
                        break;
                    }
                }
                ret[i] = leftCoord[1] + ((rightCoord[1] - leftCoord[1]) / (rightCoord[0] - leftCoord[0])) * (i - leftCoord[0]);
            }
        }
        return ret;
    }
    return values;
};

/**
 * @param {Number} value 
 * @param {Number} min 
 * @param {Number} max 
 * @returns {Number}
 */
function Clamp(value, min, max) {
    if (value > max) return max
    if (value < min) return min
    return value
}

function Curves() {
    var algo, bezier, chans, cps, end, i, last, start, _i, _j, _ref, _ref1;
    chans = arguments[0], cps = 2 <= arguments.length ? [].slice.call(arguments, 1) : [];
    last = cps[cps.length - 1];
    algo = Bezier
    if (typeof chans === "string") {
        chans = chans.split("");
    }

    bezier = algo(cps, 0, 255);
    start = cps[0];
    if (start[0] > 0) {
        for (i = _i = 0, _ref = start[0]; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            bezier[i] = start[1];
        }
    }
    end = cps[cps.length - 1];
    if (end[0] < 255) {
        for (i = _j = _ref1 = end[0]; _ref1 <= 255 ? _j <= 255 : _j >= 255; i = _ref1 <= 255 ? ++_j : --_j) {
            bezier[i] = end[1];
        }
    }

    return function (rgba) {
        var _k, _ref2;
        for (i = _k = 0, _ref2 = chans.length; 0 <= _ref2 ? _k < _ref2 : _k > _ref2; i = 0 <= _ref2 ? ++_k : --_k) {
            rgba[chans[i]] = bezier[rgba[chans[i]]];
        }
        return rgba;
    };
}

/**
 * @param {Number} adjust
 */
var Saturation = function Saturation(adjust) {
    adjust *= -0.01;

    /**
     * @param {{ r: Number, g: Number, b: Number, a: Number }} rgba
     */
    return function (rgba) {
        var max = Math.max(rgba.r, rgba.g, rgba.b);

        if (rgba.r !== max) {
            rgba.r += Math.round((max - rgba.r) * adjust);
        }

        if (rgba.g !== max) {
            rgba.g += Math.round((max - rgba.g) * adjust);
        }

        if (rgba.b !== max) {
            rgba.b += Math.round((max - rgba.b) * adjust);
        }

        return rgba;
    };
};

/**
 * @param {Number} change 
 */
function Brightness(change) {
    const lookup = new Array(256)

    for (let i = 0; i < 256; i++) {
        lookup[i] = Clamp(i * (1 + change), 0, 255)
    }

    /**
     * @param {{ r: Number, g: Number, b: Number, a: Number }} rgba
     */
    return function (rgba) {
        rgba.r = lookup[rgba.r];
        rgba.g = lookup[rgba.g];
        rgba.b = lookup[rgba.b];

        return rgba;
    }
}

/**
 * @param {Number} adjust
 */
var CamanGamma = function CamanGamma(adjust) {
    return function (rgba) {
        rgba.r = Math.pow(rgba.r / 255, adjust) * 255;
        rgba.g = Math.pow(rgba.g / 255, adjust) * 255;
        rgba.b = Math.pow(rgba.b / 255, adjust) * 255;
        return rgba;
    };
};

/**
 * @param {{ red?: Number, green?: Number, blue?: Number }} options - contains red or green or blue
 */
function Channels(options) {
    options = Object.assign({}, options)
    var chan, value;
    for (chan in options) {
        value = options[chan];
        if (value === 0) {
            delete options[chan];
            continue;
        }
        options[chan] /= 100;
    }
    return function (rgba) {
        if (!!options.red) {
            if (options.red > 0) {
                rgba.r += (255 - rgba.r) * options.red;
            } else {
                rgba.r -= rgba.r * Math.abs(options.red);
            }
        }
        if (!!options.green) {
            if (options.green > 0) {
                rgba.g += (255 - rgba.g) * options.green;
            } else {
                rgba.g -= rgba.g * Math.abs(options.green);
            }
        }
        if (!!options.blue) {
            if (options.blue > 0) {
                rgba.b += (255 - rgba.b) * options.blue;
            } else {
                rgba.b -= rgba.b * Math.abs(options.blue);
            }
        }
        return rgba;
    };
};

/**
 * @param {Number} adjust
 */
var SepiaCaman = function SepiaCaman(adjust) {
    adjust /= 100;
    return function (rgba) {
        rgba.r = Math.min(
            255,
            rgba.r * (1 - 0.607 * adjust) +
            rgba.g * (0.769 * adjust) +
            rgba.b * (0.189 * adjust)
        );
        rgba.g = Math.min(
            255,
            rgba.r * (0.349 * adjust) +
            rgba.g * (1 - 0.314 * adjust) +
            rgba.b * (0.168 * adjust)
        );
        rgba.b = Math.min(
            255,
            rgba.r * (0.272 * adjust) +
            rgba.g * (0.534 * adjust) +
            rgba.b * (1 - 0.869 * adjust)
        );
        return rgba;
    };
};

/**
 * @param {{ r: Number, g: Number, b: Number }} rgb - rgb css color
 * @param {Number} level
 */
var Colorize = function Colorize(rgb, level) {
    return function (rgba) {
        rgba.r -= (rgba.r - rgb.r) * (level / 100);
        rgba.g -= (rgba.g - rgb.g) * (level / 100);
        rgba.b -= (rgba.b - rgb.b) * (level / 100);
        return rgba;
    };
};

/**
 * @param {Number} first 
 * @param {Number} second 
 * @param {Number} third 
 */
function GreyScale() {
    return function (rgba) {
        let avg = (0.299 * rgba.r) + (0.587 * rgba.g) + (0.114 * rgba.b);
        rgba.r = avg;
        rgba.g = avg;
        rgba.b = avg;
        return rgba;
    }
}

/**
 * @returns {{ getBackupImgData: Function, setBackupImgData: Function }}
 */
const createStore = () => {
    let backupImageData

    /**
     * @param {ImageData} imgData
     */
    function setBackupImgData(imgData) {
        const { width, height, data } = imgData
        backupImageData = new ImageData(width, height)
        for (let i in data) {
            backupImageData.data[i] = data[i]
        }
    }

    /**
     * @returns {ImageData}
     */
    function getBackupImgData() {
        return backupImageData
    }

    return { getBackupImgData, setBackupImgData }
}

// initialize store to set/get data later
const store = createStore()

const filterMap = {
    gameron: [
        { use: CamanGamma, params: [1.6] }
    ],
    charm: [
        { use: Channels, params: [{ red: 8, blue: 8 }] }
    ],
    javana: [
        { use: Saturation, params: [-35] },
        { use: Curves, params: ['b', [20, 0], [90, 120], [186, 144], [255, 230]] },
        { use: Curves, params: ['r', [0, 0], [144, 90], [138, 120], [255, 255]] },
        { use: Curves, params: ['g', [10, 0], [115, 105], [148, 100], [255, 248]] },
        { use: Curves, params: ['rgb', [0, 0], [120, 100], [128, 140], [255, 255]] }
    ],
    sepiana: [
        { use: SepiaCaman, params: [50] }
    ],
    vintage: [
        { use: GreyScale, params: [] },
        { use: SepiaCaman, params: [40] },
        { use: Channels, params: [{ red: 8, blue: 2, green: 4 }] },
        { use: CamanGamma, params: [0.87] }
    ],
    bright: [
        { use: Brightness, params: [0.25] }
    ],
    dawn: [
        { use: Colorize, params: [{ r: 255, g: 205, b: 59 }, 10] },
        { use: CamanGamma, params: [1.2] }
    ]
}

/**
 * @param {ImageData} imgData
 * @param {String} filterName 
 * @returns {ImageData}
 */
function doFilter(imgData, filterName) {
    if (!!filterName && imgData instanceof ImageData) {
        filterName = filterName.toLowerCase().trim()

        if (!filterMap[filterName]) {
            return imgData
        }
        const { width, data, height } = imgData
        const resultImageData = new ImageData(width, height)
        const rgbaFuncList = filterMap[filterName].map(filter => {
            return filter.use(...filter.params)
        })
        for (let i = 0; i < data.length; i += 4) {
            let rgba = {
                r: data[i],
                g: data[i + 1],
                b: data[i + 2],
                a: data[i + 3]
            }
            rgbaFuncList.forEach(rgbaFunc => {
                rgba = rgbaFunc(rgba)
            })
            resultImageData.data[i] = rgba.r
            resultImageData.data[i + 1] = rgba.g
            resultImageData.data[i + 2] = rgba.b
            resultImageData.data[i + 3] = rgba.a
        }
        return resultImageData
    }
    return imgData
}

/**
 * @param {{ data: { imgData: ImageData | undefined, filterName: String | undefined } }} e can pass either 'imgData' or 'filterName'
 */
onmessage = function (e) {
    const { imgData, filterName } = e.data
    if (imgData instanceof ImageData && !!filterName) {
        const result = doFilter(imgData, filterName)
        this.postMessage({ result })
    } else {
        this.postMessage({ result: Error('You must provide both imgData and filterName') })
    }
}
