/*{
  glslify: true,
  frameskip: 2,
  pixelRatio: 1,
}*/
precision highp float;
uniform float time;
uniform vec2 resolution;

#pragma glslify: blur = require('glsl-fast-gaussian-blur')
#pragma glslify: noise2 = require('glsl-noise/simplex/2d')
#pragma glslify: noise3 = require('glsl-noise/simplex/3d')

#define PI 3.141593

struct Camera {
  vec3 pos;
  vec3 dir;
};

vec2 rot(in vec2 uv, in float t) {
  float c = cos(t), s = sin(t);
  return mat2(c, -s, s, c) * uv;
}

float stripes(in vec2 uv, in float beat) {
  beat = exp(beat * -10.);

  float fy = floor(uv.y * 32.);
  float freq = noise2(vec2(fy, time * 0.01)) * 15. + 2.;
  float timeFactor = noise2(vec2(fy)) * 10.1;

  float x = uv.x;
  return sin(x * freq + timeFactor * beat * PI);
}

float rings(in vec2 uv, in float beat) {
  uv = uv * 2. - 1.;
  beat = exp(beat * -4.);

  float c = 0.0;
  float d = 0.0; // depth

  for (int i = 0; i < 16; i++) {
    float fi = float(i);
    float ni = sin(fi * 3.7) * cos(fi * 13.9);
    float nt = sin(fi + beat * 2.8 + time * .7) * 0.5 * 1.;

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

float stars(in vec2 uv, in float beat) {
  uv = uv * 2. - 1.;
  uv.x *= resolution.x / resolution.y;

  uv *= 1.2;

  float c = 0.0;

  vec2 c1 = vec2(0.5, 0.4);
  vec2 c2 = vec2(-0.6, 0.1);
  vec2 c3 = vec2(0.3, -0.3);

  beat = exp(beat * - 4.0);
  // uv /= 1. + sin(beat) * 2.;

  // c1 *= 2.;
  // c2 *= 2.;
  // c3 *= 2.;

  float bt = time * PI / 7.5; // 15sec

  // for (int i = 0; i < 8; i++) {
  //   c1 = rot(c1, bt);
  //   c += star(uv, c1 * (1. - 0.2* float(i) / 8.));
  // }

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

  return smoothstep(.2, .8, c);
}

float line(float x, float y) {
  float d = abs(y - x);
  return smoothstep(.03, .0, d);
}

float dia(in vec2 uv, in float beat) {
  uv = uv * 2. - 1.;
  uv.x *= resolution.x / resolution.y;

  float c = 0.0;

  uv *= 4.0 * PI;
  uv.y *= 1. + cos(uv.x) * 0.1;

  beat = exp(beat* -5.0);

  uv.x *= 1. - beat;

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

float draw(in vec2 uv) {
  float loopLength = 1.;
  float beat = fract(time / loopLength); // 15sec

  float c = 0.0;

  // c += stripes(rot(uv, .5), beat);
  // c += stars(uv, beat);
  // c += rings(uv, beat);
  c += dia(uv, beat);

  return c;
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
  float c = 0.0;

  // float c = draw(uv);

  gl_FragColor = vec4(
    draw((uv - .5) * 1.00 + 0.5),
    draw((uv - .5) * 1.03 + 0.5),
    draw((uv - .5) * 1.05 + 0.5),
    1.0
  );
}
