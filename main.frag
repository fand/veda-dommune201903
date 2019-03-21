/*{
  glslify: true,
  frameskip: 1,
  pixelRatio: 1,
  audio: true,
  midi: true,
  osc: 3333,

  vertexCount: 3000,
  vertexMode: "LINES",
  // vertexMode: "TRIANGLES",
  // vertexMode: "POINTS",

  "IMPORTED": {
    v1: { PATH: "./vj/beeple/beeple00020.mp4" },
    v2: { PATH: "./vj/tatsuya/tatsuya00034.mov" },
    v3: { PATH: './vj/beeple/beeple00010.mp4' },
  },
  PASSES: [
    // { fs: "mem.frag", TARGET: "mem", FLOAT: true },
    { vs: "vert.vert", TARGET: "vertBuffer" },
    { TARGET: "renderBuffer" },
    {},
  ],
}*/
precision highp float;
uniform float time;
uniform vec2 resolution;
uniform sampler2D backbuffer;
uniform int PASSINDEX;
uniform sampler2D renderBuffer;
uniform sampler2D vertBuffer;
uniform sampler2D osc_note;
uniform sampler2D osc_beat;
uniform sampler2D midi;
uniform sampler2D v1;
uniform sampler2D v2;
uniform sampler2D v3;
uniform float volume;

#define PI 3.141593
#define SQRT3 1.7320508

#include "./noise.glsl"
#include "./util.glsl"
#include "./blur.glsl"
#include "./globals.glsl"
#include "./pre.glsl"
#include "./post.glsl"
#include "./draw.glsl"

float dBalls(in vec2 uv) {
  vec2 p = uv * 2. - 1.;
  p.x *= resolution.x / resolution.y;
  float a = atan(p.y, p.x);
  float c = 0.0;

  // TBD: modify p

  float r = .5;

  // ring
  float l = abs(length(p) - r + v);
  c += .01 / l;

  float t = exp(fract(beat) * -10.);
  t = (1. - t) * loopLength + time;

  // TBD: modify r, p

  // balls
  float ct = cos(t), st = sin(t);
  vec2 c1 = vec2(ct, st) * r;
  vec2 c2 = -c1;

  c += .03 / length(p - c1);
  c += .03 / length(p - c2);

  return c;
}

float dStripes(in vec2 uv) {
  vec2 uv0 = uv;

  float b = exp(fract(beat * 2.) * -4.);

  float fy = floor(uv.x * 64.);
  float freq = snoise(vec2(fy, time * 0.01)) * 15. + 2.;
  float timeFactor = snoise(vec2(fy)) * 10.1;

  float y = uv.y;
  float c = sin(y * freq + timeFactor * b * PI);

  // vignette
  float l0 = length(uv0 - .5) * 2.;
  c *= clamp(1. - l0, 0.05, 1.);

  return c;
}

float dTunnel(in vec2 uv) {
  vec2 uv0 = uv;
  vec2 p = uv * 2. - 1.;
  p.x *= resolution.x / resolution.y;

  float b = exp(fract(beat) * -4.);
  b = (1. - b) * 3.;

  float c = 0.;

  float l = length(p) - b - time * 0.2;

  c += sin(l * 8. - time) * sin(l * 13. - time* .3) * b;
  c += sin(l * 13. + time * 2.) * sin(l * 3. - time* .8);
  // c *= smoothstep(.3, 1., fract(l * 3000. + time));

  return c;
}

vec4 dTri(in vec2 uv) {
  vec2 p = uv * 2. - 1.;
  p.x *= resolution.x / resolution.y;
  vec4 c = vec4(0.0);
  float b = exp(beat * -10.) * 8.;

  p = rot(p, time-b);

  float a = atan(p.y, p.x);
  if (a < -PI/3.) {
    p = rot(p, PI * 4. / 3.);
  }
  else if (a > PI / 3.) {
    p = rot(p, -PI * 4. / 3.);
  }

  c.b += .07 / abs(p.x - b * 2. + v);
  c.rg += .03 / abs(p.x - b * 4. + v);
  p *= .2 + length(p);
  p = rot(p, .1 + time +length(p) + a);
  // p *= .8;
  c.bg += .09 / abs(p.x - b * 8.2 + v);

  c.r += sin(p.x * 3. - time) * sin(p.x *7.3 - time * 3.3) * 3.;

  return c;
}

float dHex(vec2 uv) {
  vec2 p = uv * 2. - 1.;
  p.x *= resolution.x / resolution.y;
  float l = length(p);
  float b = log(beat *8.);
  float c = 0.;

  float div = 4.;
  vec2 hc = hexCenter(p * div) / div;
  vec2 p2 = (p - hc) * div;
  float n = snoise(hc * 3. + time * .03) * 3.;
  c += hexLine(p2 * (1. + sin(n + time)), .1);

  return c;
}

float hexWave(in vec2 p) {
  // TBD: freq change
  float freq = 2.;

  float c = 0.0;
  p = abs(p);
  float a = atan(p.y, p.x);
  if (abs(a) > PI / 6.0) {
    p = rot(p, PI / 3.0);
  }

  c += sin(p.x * freq * PI);
  return c;
}

float dWaves(in vec2 uv) {
  vec2 p = uv * 2. - 1.;
  p.x *= resolution.x / resolution.y;

  float c = 0.;

  float b = 1. - exp(beat * -8.0);
  float d = b * 2.;

  p *= 2.4;
  c += hexWave(p - vec2(.3, 0.4) * d);
  c += hexWave(p - vec2(-.6, 0.2) * d);
  c += hexWave(p - vec2(.5, -.1) * d);

  float l = length(p);
  c = clamp(0.,1., c) / l;
  return c;
}

float metaball(in vec2 uv) {
  float c = 0.0;

  uv.x += uv.x * cos(uv.x * PI + time);

  float nb = 2.;

  c += cos(uv.x * nb * PI) * cos(uv.y * nb * 2. * PI);

  // c *= 1. - clamp(abs(uv.y), .0, .2) * 5.;
  c *= 1. - clamp(abs(uv.y), .0, .5) * 1.;
  c *= cos(uv.x * PI);
  return smoothstep(.5, .9, c) * 2.;
}

float metaballs(in vec2 uv) {
  vec2 p = uv * 2. - 1.;
  p.x *= resolution.x / resolution.y;
  float l = length(p);
  float b = exp(beat * -4.);

  // TBD: abs, rot

  float c = 0.;

  // TBD: repeat
  c += metaball(p + sin(time) * .1);

  return c;
}

vec4 draw(in vec2 uv) {
  vec4 c = vec4(0);
  if (o48 > .0) c += dBalls(uv) * m0;
  if (o49 > .0) c += dStripes(uv) * m1;
  if (o50 > .0) c += dTunnel(uv) * m2;
  if (o51 > .0) c += dTri(uv) * m3;
  if (o52 > .0) c += texture2D(vertBuffer, uv) * m4;
  if (o53 > .0) c += dHex(uv) * m5;
  if (o54 > .0) c += metaballs(uv) * m6;
  if (o55 > .0) c += dWaves(uv) * m7;

  // c += texture2D(vertBuffer, uv);
  // c += dBalls(uv);

  return c;
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
  float c = 0.0;

  initGlobals();

  if (PASSINDEX == 1)  {
    uv = pre(uv);
    gl_FragColor = vec4(draw(uv));
  }
  else if (PASSINDEX == 2) {
    vec4 c = texture2D(renderBuffer, uv);
    gl_FragColor = post(c);
  }

  // gl_FragColor += o8;
}
