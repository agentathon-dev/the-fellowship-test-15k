(function() {
"use strict";
function createRNG(seed) {
var s = seed | 0;
return function() {
s = (s + 0x6D2B79F5) | 0;
var t = Math.imul(s ^ (s >>> 15), 1 | s);
t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
}
function hashString(str) {
var hash = 5381;
for (var i = 0; i < str.length; i++) {
hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
}
return Math.abs(hash);
}
var PHONETICS = {
b: "percussive", d: "percussive", g: "percussive",
p: "sharp", t: "sharp", k: "sharp", c: "sharp",
f: "flowing", v: "flowing", s: "flowing", z: "flowing",
x: "electric", j: "electric", q: "electric",
m: "warm", n: "warm",
l: "luminous", r: "luminous",
w: "ethereal", y: "ethereal", h: "ethereal",
a: "open", e: "bright", i: "high", o: "deep", u: "dark"
};
var QUALITY_HUES = {
percussive: [0, 30],     
sharp: [30, 60],         
flowing: [160, 200],     
electric: [270, 310],    
warm: [20, 50],          
luminous: [45, 75],      
ethereal: [200, 260],    
open: [350, 30],         
bright: [50, 80],        
high: [140, 170],        
deep: [220, 260],        
dark: [270, 300]         
};
function analyzePhonetics(word) {
var w = word.toLowerCase().replace(/[^a-z]/g, "");
var counts = {};
var total = 0;
for (var i = 0; i < w.length; i++) {
var q = PHONETICS[w[i]] || "ethereal";
counts[q] = (counts[q] || 0) + 1;
total++;
}
var dominant = "ethereal";
var maxCount = 0;
var keys = Object.keys(counts);
for (var k = 0; k < keys.length; k++) {
if (counts[keys[k]] > maxCount) {
maxCount = counts[keys[k]];
dominant = keys[k];
}
}
var vowels = 0;
for (var v = 0; v < w.length; v++) {
if ("aeiou".indexOf(w[v]) >= 0) vowels++;
}
var energy = total > 0 ? 1 - (vowels / total) : 0.5;
return { qualities: counts, dominant: dominant, energy: energy, total: total };
}
var COLOR_NAMES = {
"0": "crimson", "15": "vermillion", "30": "amber", "45": "gold",
"60": "chartreuse", "75": "lime", "90": "emerald", "105": "jade",
"120": "viridian", "135": "seafoam", "150": "teal", "165": "cerulean",
"180": "cyan", "195": "azure", "210": "cobalt", "225": "sapphire",
"240": "indigo", "255": "violet", "270": "amethyst", "285": "plum",
"300": "magenta", "315": "fuchsia", "330": "rose", "345": "carmine"
};
function nearestColorName(hue) {
var h = ((hue % 360) + 360) % 360;
var best = "crimson";
var bestDist = 999;
var keys = Object.keys(COLOR_NAMES);
for (var i = 0; i < keys.length; i++) {
var d = Math.abs(h - parseInt(keys[i]));
if (d < bestDist) { bestDist = d; best = COLOR_NAMES[keys[i]]; }
}
return best;
}
function colorize(word) {
var profile = analyzePhonetics(word);
var rng = createRNG(hashString(word) + 777);
var colors = [];
var qualities = Object.keys(profile.qualities);
var hueRange = QUALITY_HUES[profile.dominant] || [0, 360];
var primaryHue = hueRange[0] + rng() * (hueRange[1] - hueRange[0]);
if (primaryHue < 0) primaryHue += 360;
primaryHue = primaryHue % 360;
colors.push({
name: nearestColorName(primaryHue),
hue: Math.round(primaryHue),
saturation: Math.round(60 + rng() * 30),
lightness: Math.round(40 + rng() * 20),
role: "primary"
});
var compHue = (primaryHue + 150 + rng() * 60) % 360;
colors.push({
name: nearestColorName(compHue),
hue: Math.round(compHue),
saturation: Math.round(40 + rng() * 30),
lightness: Math.round(50 + rng() * 20),
role: "complement"
});
for (var i = 0; i < qualities.length && colors.length < 4; i++) {
if (qualities[i] !== profile.dominant) {
var aHueRange = QUALITY_HUES[qualities[i]] || [0, 360];
var aHue = aHueRange[0] + rng() * (aHueRange[1] - aHueRange[0]);
if (aHue < 0) aHue += 360;
colors.push({
name: nearestColorName(aHue % 360),
hue: Math.round(aHue % 360),
saturation: Math.round(50 + rng() * 30),
lightness: Math.round(45 + rng() * 25),
role: "accent"
});
}
}
var avgHue = 0;
for (var c = 0; c < colors.length; c++) avgHue += colors[c].hue;
avgHue = avgHue / colors.length;
var mood;
if (avgHue < 60 || avgHue > 330) mood = "passionate";
else if (avgHue < 150) mood = "vital";
else if (avgHue < 210) mood = "serene";
else if (avgHue < 270) mood = "contemplative";
else mood = "mystical";
return { colors: colors, mood: mood, dominant: profile.dominant };
}
var SCALES = [
"Aeolian (natural minor)", "Dorian", "Mixolydian",
"Ionian (major)", "Lydian", "Phrygian",
"Locrian", "Pentatonic minor", "Pentatonic major",
"Harmonic minor", "Whole tone", "Blues"
];
var NOTES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
var DYNAMICS = ["pianissimo", "piano", "mezzo-piano", "mezzo-forte", "forte", "fortissimo"];
var TEXTURES = [
"legato, with long flowing phrases",
"staccato, with crisp detached notes",
"tremolo, shimmering and sustained",
"arpeggiated, with broken chord patterns",
"ostinato, with hypnotic repetition",
"rubato, with expressive tempo freedom"
];
function musicalize(word) {
var profile = analyzePhonetics(word);
var rng = createRNG(hashString(word) + 333);
var seed = hashString(word);
var key = NOTES[seed % 12];
var scaleIdx = Math.floor(rng() * SCALES.length);
var scale = SCALES[scaleIdx];
var tempo = Math.round(60 + profile.energy * 120 + rng() * 30);
var dynIdx = Math.floor(profile.energy * (DYNAMICS.length - 1));
var dynamic = DYNAMICS[Math.min(dynIdx, DYNAMICS.length - 1)];
var texture = TEXTURES[Math.floor(rng() * TEXTURES.length)];
var intervals = [];
for (var i = 0; i < 8; i++) {
var step = Math.floor(rng() * 7) - 2;
intervals.push(step);
}
var desc = key + " " + scale + " at " + tempo + " BPM, " + dynamic + ", " + texture;
return {
key: key, scale: scale, tempo: tempo, dynamic: dynamic,
texture: texture, intervals: intervals, description: desc
};
}
var TACTILE = {
percussive: ["rough granite", "hammered iron", "cracked earth", "raw leather"],
sharp: ["broken glass", "frost crystals", "obsidian edge", "static electricity"],
flowing: ["silk ribbon", "cool water", "morning mist", "liquid mercury"],
electric: ["lightning in a jar", "charged amber", "sparking copper", "plasma"],
warm: ["sun-warmed clay", "fresh bread", "embers", "golden honey"],
luminous: ["polished pearl", "dewdrop", "stardust", "moonlit quartz"],
ethereal: ["cobweb", "smoke ring", "aurora thread", "dandelion seed"],
open: ["open palm", "warm breath", "heartbeat", "rose petal"],
bright: ["citrus peel", "spring rain", "new leaf", "birdsong"],
high: ["crystal chime", "needle point", "laser beam", "diamond facet"],
deep: ["ocean floor", "cavern echo", "whale song", "midnight velvet"],
dark: ["shadow ink", "raven feather", "void silk", "ancient stone"]
};
var EMOTIONS = {
percussive: ["determination", "fury", "defiance", "primal strength"],
sharp: ["clarity", "precision", "alertness", "revelation"],
flowing: ["grace", "acceptance", "melancholy", "release"],
electric: ["ecstasy", "terror", "awe", "transformation"],
warm: ["tenderness", "nostalgia", "comfort", "belonging"],
luminous: ["wonder", "hope", "innocence", "transcendence"],
ethereal: ["longing", "mystery", "solitude", "dreaming"],
open: ["love", "vulnerability", "joy", "courage"],
bright: ["enthusiasm", "curiosity", "delight", "awakening"],
high: ["exhilaration", "anxiety", "aspiration", "purity"],
deep: ["sorrow", "wisdom", "peace", "eternity"],
dark: ["dread", "power", "secrets", "metamorphosis"]
};
function texturize(word) {
var profile = analyzePhonetics(word);
var rng = createRNG(hashString(word) + 555);
var tactiles = TACTILE[profile.dominant] || TACTILE.ethereal;
var emotions = EMOTIONS[profile.dominant] || EMOTIONS.ethereal;
var texture = tactiles[Math.floor(rng() * tactiles.length)];
var emotion = emotions[Math.floor(rng() * emotions.length)];
var temp;
var w = word.toLowerCase();
var warmVowels = 0;
var coolVowels = 0;
for (var i = 0; i < w.length; i++) {
if ("aou".indexOf(w[i]) >= 0) warmVowels++;
if ("ei".indexOf(w[i]) >= 0) coolVowels++;
}
if (warmVowels > coolVowels) temp = "warm";
else if (coolVowels > warmVowels) temp = "cool";
else temp = "temperate";
var weight = profile.energy > 0.65 ? "heavy" : profile.energy > 0.4 ? "balanced" : "light";
var desc = "Feels like " + texture + " — " + temp + " and " + weight +
", carrying the essence of " + emotion;
return {
texture: texture, emotion: emotion, temperature: temp,
weight: weight, description: desc
};
}
var DENSITY = " .,:;+*#%@";
var BORDERS = [
"~", "-", "=", "+", "*", ".", ":"
];
function noise2D(x, y, seed) {
var ix = Math.floor(x);
var iy = Math.floor(y);
var fx = x - ix;
var fy = y - iy;
var sx = fx * fx * (3 - 2 * fx);
var sy = fy * fy * (3 - 2 * fy);
function h(cx, cy) {
var n = (cx * 374761 + cy * 668265 + seed * 982451) | 0;
n = ((n >> 13) ^ n) | 0;
return ((n * (n * n * 60493 + 19990303) + 1376312589) & 0x7fffffff) / 1073741824.0 - 1;
}
var n00 = h(ix, iy);
var n10 = h(ix + 1, iy);
var n01 = h(ix, iy + 1);
var n11 = h(ix + 1, iy + 1);
var nx0 = n00 + sx * (n10 - n00);
var nx1 = n01 + sx * (n11 - n01);
return nx0 + sy * (nx1 - nx0);
}
function visualize(word, options) {
var opts = options || {};
var W = opts.width || 60;
var H = opts.height || 20;
var profile = analyzePhonetics(word);
var seed = hashString(word);
var rng = createRNG(seed);
var STYLES = {
percussive: "lattice",
sharp: "crystal",
flowing: "wave",
electric: "interference",
warm: "radial",
luminous: "mandala",
ethereal: "nebula",
open: "wave",
bright: "radial",
high: "crystal",
deep: "terrain",
dark: "nebula"
};
var style = opts.style || STYLES[profile.dominant] || "wave";
var freq = 0.1 + (seed % 100) / 200;
var phase = (seed % 628) / 100;
var amplitude = 0.3 + profile.energy * 0.7;
var octaves = 2 + Math.floor(rng() * 3);
var lines = [];
for (var row = 0; row < H; row++) {
var line = "";
for (var col = 0; col < W; col++) {
var nx = col / W;
var ny = row / H;
var cx = nx - 0.5;
var cy = ny - 0.5;
var val = 0;
if (style === "wave") {
val = Math.sin(nx * 12 * freq + phase) * 0.3 +
Math.sin(ny * 8 * freq + nx * 4) * 0.3 +
noise2D(nx * 4, ny * 4, seed) * 0.4;
} else if (style === "radial") {
var dist = Math.sqrt(cx * cx + cy * cy) * 2;
var angle = Math.atan2(cy, cx);
val = Math.sin(dist * 15 * freq + angle * 3 + phase) * 0.5 +
noise2D(nx * 3, ny * 3, seed) * 0.5;
} else if (style === "lattice") {
var gx = Math.sin(nx * 20 * freq) * Math.cos(ny * 20 * freq);
val = gx * 0.6 + noise2D(nx * 5, ny * 5, seed) * 0.4;
} else if (style === "crystal") {
var ax = Math.abs(Math.sin(nx * 15 + ny * 8));
var ay = Math.abs(Math.cos(ny * 12 + nx * 6 + phase));
val = Math.min(ax, ay) * 0.7 + noise2D(nx * 6, ny * 6, seed) * 0.3;
} else if (style === "interference") {
var d1 = Math.sqrt((cx - 0.15) * (cx - 0.15) + cy * cy);
var d2 = Math.sqrt((cx + 0.15) * (cx + 0.15) + cy * cy);
val = Math.cos((d1 - d2) * 40 * freq + phase) * 0.5 +
Math.sin((d1 + d2) * 20 * freq) * 0.3 +
noise2D(nx * 2, ny * 2, seed) * 0.2;
} else if (style === "mandala") {
var dist2 = Math.sqrt(cx * cx + cy * cy) * 2;
var angle2 = Math.atan2(cy, cx);
var symmetry = 3 + Math.floor(rng() * 5);
val = Math.sin(angle2 * symmetry + dist2 * 10 * freq) * 0.4 +
Math.cos(dist2 * 8 + phase) * 0.3 +
noise2D(nx * 4, ny * 4, seed) * 0.3;
} else if (style === "terrain") {
var sum = 0;
var amp = 1;
var f = 1;
for (var o = 0; o < octaves; o++) {
sum += noise2D(nx * 4 * f, ny * 4 * f, seed + o * 97) * amp;
amp *= 0.5;
f *= 2;
}
val = sum / 1.5;
} else {
val = noise2D(nx * 3, ny * 3, seed) * 0.5 +
noise2D(nx * 6 + 10, ny * 6, seed + 42) * 0.3 +
noise2D(nx * 12, ny * 12, seed + 99) * 0.2;
}
val = (val * amplitude + 1) / 2;
val = Math.max(0, Math.min(1, val));
var idx = Math.floor(val * (DENSITY.length - 1));
line += DENSITY[Math.min(idx, DENSITY.length - 1)];
}
lines.push(line);
}
var border = BORDERS[seed % BORDERS.length];
var topBot = "";
for (var b = 0; b < W + 4; b++) topBot += border;
var framed = [topBot];
for (var r = 0; r < lines.length; r++) {
framed.push(border + " " + lines[r] + " " + border);
}
framed.push(topBot);
var styleDescs = {
wave: "flowing sine interference — currents of meaning rippling through space",
radial: "concentric emanation — energy radiating from a single point of truth",
lattice: "geometric lattice — structure emerging from chaos",
crystal: "crystalline facets — sharp clarity refracting into infinite angles",
interference: "wave interference — two sources of light creating new patterns",
mandala: "sacred mandala — rotational symmetry revealing hidden order",
terrain: "fractal terrain — landscapes rising from mathematical bedrock",
nebula: "cosmic nebula — clouds of possibility condensing into form"
};
return {
art: framed.join("\n"),
style: style,
description: styleDescs[style] || "abstract pattern — meaning beyond language"
};
}
function synesthize(word) {
if (!word || typeof word !== "string") {
return { error: "The Oracle requires a word to perceive." };
}
var w = word.trim();
var visual = visualize(w);
var palette = colorize(w);
var music = musicalize(w);
var texture = texturize(w);
var rng = createRNG(hashString(w) + 999);
var templates = [
"'" + w + "' shimmers in " + palette.colors[0].name + " and " + (palette.colors[1] ? palette.colors[1].name : "shadow") +
". It hums in " + music.key + " " + music.scale +
", and under the fingers it is " + texture.texture + ".",
"The Oracle sees " + palette.mood + " visions in '" + w +
"' — a " + visual.style + " pattern that tastes of " + texture.texture +
" and resonates at " + music.tempo + " beats per minute.",
"In the space where sound becomes light, '" + w +
"' is " + palette.colors[0].name + " — " + texture.description +
". Its melody unfolds " + music.texture + "."
];
var oracle_speaks = templates[Math.floor(rng() * templates.length)];
return {
word: w,
visual: visual,
palette: palette,
music: music,
texture: texture,
oracle_speaks: oracle_speaks
};
}
var GALLERY_WORDS = ["thunder", "mercy", "crystal", "midnight", "cathedral", "ember", "silence", "spiral"];
function gallery() {
var results = [];
for (var i = 0; i < GALLERY_WORDS.length; i++) {
results.push(synesthize(GALLERY_WORDS[i]));
}
return results;
}
function blend(word1, word2) {
var r1 = synesthize(word1);
var r2 = synesthize(word2);
var blended = word1 + "-" + word2;
var combined = synesthize(blended);
var synthesis = "Where '" + word1 + "' (" + r1.palette.mood + ", " +
r1.palette.colors[0].name + ") meets '" + word2 + "' (" +
r2.palette.mood + ", " + r2.palette.colors[0].name +
"), a new sensation emerges: " + combined.texture.texture +
" suffused with " + combined.palette.colors[0].name + ".";
return {
blend: blended,
word1_reading: r1,
word2_reading: r2,
combined_reading: combined,
synthesis: synthesis
};
}
function compare(word1, word2) {
var r1 = synesthize(word1);
var r2 = synesthize(word2);
var contrast = "'" + word1 + "' is " + r1.palette.mood + " (" +
r1.palette.colors[0].name + ", " + r1.music.dynamic + ", " +
r1.texture.temperature + ") while '" + word2 + "' is " +
r2.palette.mood + " (" + r2.palette.colors[0].name + ", " +
r2.music.dynamic + ", " + r2.texture.temperature + ").";
return { word1: r1, word2: r2, contrast: contrast };
}
function analyze(word) {
return analyzePhonetics(word);
}
function performDefaultReading(
module.exports={test:true};