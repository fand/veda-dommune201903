/*{
  glslify: true,
  frameskip: 1,
  pixelRatio: 1,
  audio: true,
  osc: 3333,

  vertexCount: 1000,
  vertexMode: "LINES",
  // vertexMode: "TRIANGLES",
  // vertexMode: "POINTS",

  "IMPORTED": {
    v1: { PATH: "./vj/beeple/beeple00020.mp4" },
    v2: { PATH: "./vj/tatsuya/tatsuya00034.mov" },
    // v1: { PATH: './vj/beeple/beeple00034.mp4' },
    // v2: { PATH: './vj/beeple/beeple00100.mp4' },
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
uniform sampler2D v1;
uniform sampler2D v2;
uniform sampler2D v3;

#define PI 3.141593
#define SQRT3 1.7320508

#pragma glslify: blur = require('glsl-fast-gaussian-blur')
#pragma glslify: noise2 = require('glsl-noise/simplex/2d')
#pragma glslify: noise3 = require('glsl-noise/simplex/3d')
#pragma glslify: import('./util')
#pragma glslify: import('./pre')
#pragma glslify: import('./post')

struct Camera {
  vec3 pos;
  vec3 dir;
};

float beat;
float loopLength;

void initGlobals() {
  beat = texture2D(osc_beat, vec2(0)).r;
  loopLength = texture2D(osc_beat, vec2(1)).r;
}

float stripes(in vec2 uv) {
  float b = exp(beat * -10.);

  float fy = floor(uv.y * 32.);
  float freq = noise2(vec2(fy, time * 0.01)) * 15. + 2.;
  float timeFactor = noise2(vec2(fy)) * 10.1;

  float x = uv.x;
  return sin(x * freq + timeFactor * b * PI);
}

float rings(in vec2 uv) {
  uv = uv * 2. - 1.;
  float b = exp(beat * -4.);

  float c = 0.0;
  float d = 0.0; // depth

  for (int i = 0; i < 16; i++) {
    float fi = float(i);
    float ni = sin(fi * 3.7) * cos(fi * 13.9);
    float nt = sin(fi + b * 2.8 + time * .7) * 0.5 * 1.;

    vec2 uv2 = vec2(uv.x, uv.y + float(i) / 8. - 1.0);
    uv2.y *= 2.;
    uv2.x += ni * 0.2;

    float l = length(uv2 - vec2(0.0));
    l *= nt * 4. + 5.;

    float a = atan(uv2.y, uv2.x);
    a += (ni * 3.) * time * 2.;

    c += smoothstep(.9, .91, l) * smoothstep(1.0, .99, l) * sin(a);
  }

  return c;
}

float star(in vec2 uv, in vec2 star) {
  vec2 u1 = uv - star;
  float l = length(u1);
  float a = atan(u1.y, u1.x) + time *PI / 5.; // 6sec
  return sin(a * 16.) / (l * 2.) * max(2. - l, 0.0);
}

float stars(in vec2 uv) {
  uv = uv * 2. - 1.;
  uv.x *= resolution.x / resolution.y;

  uv *= 1.2;

  float c = 0.0;

  vec2 c1 = vec2(0.5, 0.4);
  vec2 c2 = vec2(-0.6, 0.1);
  vec2 c3 = vec2(0.3, -0.3);


  float b = exp(fract(beat * 3.) * - 4.0);
  // uv /= 1. + sin(beat) * 2.;

  // c1 *= 2.;
  // c2 *= 2.;
  // c3 *= 2.;

  float bt = time * PI / 7.5; // 15sec

  for (int i = 0; i < 8; i++) {
    c1 = rot(c1, bt);
    c += star(uv, c1 * (1. - 0.2* float(i) / 8.));
  }

  // c1 = rot(c1, bt);
  // c2 = rot(c1, bt);
  // c3 = rot(c2, bt);
  // // c1 = rot(c1 * (1. + sin(time + 1.) * 0.2), time);
  // // c2 = rot(c2 * (1. + sin(time + 2.) * 0.1), time);
  // // c3 = rot(c3 * (1. + sin(time + 3.) * 0.2), time);
  //
  // c += star(uv, c1);
  // c += star(uv, c2);
  // c += star(uv, c3);
  return c;
  // return smoothstep(.2, .8, c);
}

float line(float x, float y) {
  float d = abs(y - x);
  return smoothstep(.03, .0, d);
}

float dia(in vec2 uv) {
  uv = uv * 2. - 1.;
  uv.x *= resolution.x / resolution.y;

  float c = 0.0;

  uv *= 4.0 * PI;
  uv.y *= 1. + cos(uv.x) * 0.1;

  // beat = exp(beat* -5.0);

  uv.x *= 1. - fract(beat * 2.);

  // uv.y += cos(uv.x * time * 0.3) * 0.2;

  uv.y += PI;
  c += cos(uv.x) + cos(uv.y);

  uv.y -= PI * 2.;
  c *= cos(uv.x) + cos(uv.y);

  uv.y += PI;
  uv = abs(uv);
  uv *= 1.5 + cos((time - beat) * PI / 3.);
  c *= .5 + cos(uv.x) + cos(uv.y);

  // c /= length(uv) * 0.2;

  // float fx = sin(uv.x * 4. * PI);
  // uv.y = abs(uv.y);
  // float c = step(sin(uv.x * PI - beat), uv.y) - step(cos(uv.x * PI + beat), uv.y);

  return c;
}

float hexWave(in vec2 p) {
  float c = 0.0;

  p = abs(p);

  float a = atan(p.y, p.x);
  if (abs(a) > PI / 6.0) {
    p = rot(p, PI / 3.0);
  }
  p.x *= p.x;
  c += sin(p.x *2. * PI);
  c *= 0.3 / p.x;

  return c;
}

float balls(in vec2 uv) {
  uv = uv * 2. - 1.;
  uv.x *= resolution.x / resolution.y;

  float c;

  float b = 1. - exp(beat * -8.0);
  float d = b * 2.;

  uv *= 1.4;
  c += hexWave(uv - vec2(.3, 0.4) * d);
  c /= hexWave(uv - vec2(-.6, 0.2) * d);
  c /= hexWave(uv - vec2(.5, -.1) * d);
  c /= hexWave(uv - vec2(-.4, -.3) * d);
  c /= hexWave(uv - vec2(-.2, .5) * d);
  c /= hexWave(uv - vec2(.2, -.5) * d);

  // c = clamp(0.,1., c) / length(uv);
  return c;
}

float arcBall(in vec2 uv, in float b, in float seed) {
  uv = uv * 2. - 1.;
  uv.x *= resolution.x / resolution.y;

  uv *= 6.;

  float c = 0.0;

  // c += .5 / length(uv * (1. + sin(time) * 0.2));

  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float r = 1.8 + sin(fi * 3. + seed) * 1.2;

    float ti = time + r * 8. + seed;

    // skew
    vec2 uv2 = uv;
    // vec2 uv2 = rot(uv, r * 8. + time);
    // uv2.x *= 1. + cos(ti) * 0.7;
    // uv2.y *= 1. + sin(ti) * 0.2;

    float a1 = mod(fi * 9. + ti * 1.1 * sin(seed + fi), 2. * PI);
    float a2 = mod(fi * 9. + ti * 1.7 * sin(seed + fi), 2. * PI);

    float a = atan(uv2.y, uv2.x) +PI;

    // ring
    float w = 0.3;
    float l = length(uv2);
    float ring = smoothstep(r - w, r, l) * smoothstep(r + w +.1, r + .1, l);

    // arc
    float arc = smoothstep(a1, a1 + 0.1, a) * smoothstep(a2, a2 - 0.1, a);

    if (a1 > a2) {
      arc = (
        step(0., a) * smoothstep(a2, a2 - 0.1, a) +
        smoothstep(a1, a1 + 0.1, a) * step(a, 7.)
      );
    }

    c += arc * ring;
  }

  return c;
}

float arcBalls(in vec2 uv) {
    float b = 1. - exp(beat * -8.0);
    return (
      arcBall(uv + vec2(cos(time * 0.3), sin(time * 0.4)) * 0.2, b, 10.) +
      arcBall(uv + vec2(cos(time * 0.2), sin(time * 0.7)) * 0.2, b, 20.) +
      arcBall(uv + vec2(cos(time * 0.9), sin(time * 0.3)) * 0.2, b, 30.) +
      arcBall(uv + vec2(cos(time * 0.4), sin(time * 0.15)) * 0.2, b, 40.) +
      arcBall(uv + vec2(cos(time * 0.5), sin(time * 0.8)) * 0.2, b, 50.)
    ) / 2.;
}

float metaball(in vec2 uv) {
  float c = 0.0;

  uv.x += uv.x * cos(uv.x * PI + time);

  float nb = 16.;

  c += cos(uv.x * nb * PI) * cos(uv.y * nb * 2. * PI);

  // c *= 1. - clamp(abs(uv.y), .0, .2) * 5.;
  c *= 1. - clamp(abs(uv.y), .0, .5) * 1.;
  c *= cos(uv.x * PI);
  return smoothstep(.5, .9, c) * 2.;
}

float metaballs(in vec2 uv) {
  uv = uv * 2. - 1.;
  uv.x *= resolution.x / resolution.y;

  uv *= 1.2;

  uv = rot(uv, sin(length(uv) * 3.));

  float p6 = PI / 3.;

  float d = .1 - exp(beat * -5.) * 0.2 * sign(mod(time, 2.) - 1.);

  return (
    metaball(uv + .1) +
    metaball(rot(uv, p6) + d) +
    metaball(rot(uv, p6 * 2.) + d) +
    metaball(rot(uv, p6 * 3.) + d) +
    metaball(rot(uv, p6 * 4.) + d) +
    metaball(rot(uv, p6 * 5.) + d)
  );
}

vec4 draw(in vec2 uv) {
  float loopLength = 1.;

  vec4 c = vec4(0);

  float o48 = osc(48.);
  float o49 = osc(49.);
  float o50 = osc(50.);
  float o51 = osc(51.);
  float o52 = osc(52.);
  float o53 = osc(53.);
  float o54 = osc(54.);
  float o56 = osc(56.);

  if (o48 > .0) c += stripes(rot(uv, .5));
  if (o49 > .0) c += stars(uv);
  if (o50 > .0) c += rings(uv);
  if (o51 > .0) c += dia(uv);
  if (o52 > .0) c += balls(uv);
  if (o53 > .0) c += arcBalls(uv) * 1.0;
  if (o54 > .0) c += metaballs(uv);

  if (o56 > .0) c += texture2D(vertBuffer, uv);

  // return smoothstep(.2, 4, c);
  return c;
}

vec2 pre(in vec2 uv) {
  vec2 p = (gl_FragCoord.xy * 2. - resolution) / min(resolution.x, resolution.y);

  float o0 = osc(0.);
  float o1 = osc(1.);
  float o2 = osc(2.);
  float o3 = osc(3.);
  float o4 = osc(4.);
  float o5 = osc(5.);
  float o6 = osc(6.);
  float o7 = osc(7.);

  uv = iWiggle(uv, o0);
  uv = iSplit(uv, o1);
  uv = iRot(uv, o2);
  uv = iXShift(uv, o3);
  uv = iKaleido(uv, o4);
  uv = iZoom(uv, o5);
  uv = iDia(uv, o6);
  uv = iBor(uv, o7);

  return uv;
}

vec4 post(in vec4 c) {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 p = (gl_FragCoord.xy * 2. - resolution) / min(resolution.x, resolution.y);

  // c = vec4(step(0.05, fwidth(c.r))); // edge

  float o16 = osc(16.);
  float o17 = osc(17.);
  float o18 = osc(18.);
  float o19 = osc(19.);
  float o20 = osc(20.);
  float o21 = osc(21.);
  float o22 = osc(22.);
  float o23 = osc(23.);
  float o24 = osc(24.);
  float o25 = osc(25.);
  float o26 = osc(26.);
  float o27 = osc(27.);
  float o28 = osc(28.);

  c = oChroma(c, uv, p, o27);
  c = oBloom(c, uv, p, o28);

  c = oRgb(c, uv, p, o16);
  c = oMosh(c, uv, p, o17);
  c = oInvert(c, uv, p, o18);
  c = oHue(c, uv, p, o19);
  c = oRainbow(c, uv, p, o20);
  c = oRgl(c, uv, p, o21);
  c = oPixSort(c, uv, p, o22);

  c = oRgbSwap1(c, uv, p, o24);
  c = oRgbSwap2(c, uv, p, o25);
  c = oRgbSwap3(c, uv, p, o26);

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
    // gl_FragColor = c;
  }
}
