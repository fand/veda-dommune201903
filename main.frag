/*{
  glslify: true,
  frameskip: 1,
  pixelRatio: 2,
  audio: true,
  osc: 3333,
  "IMPORTED": {
    v1: { PATH: "./vj/beeple/beeple00020.mp4" },
    v2: { PATH: "./vj/tatsuya/tatsuya00034.mov" },
    // v1: { PATH: './vj/beeple/beeple00034.mp4' },
    // v2: { PATH: './vj/beeple/beeple00100.mp4' },
    v3: { PATH: './vj/beeple/beeple00010.mp4' },
  },
  PASSES: [
    { fs: "mem.frag", TARGET: "mem", FLOAT: true },
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
uniform sampler2D osc_note;
uniform sampler2D v1;
uniform sampler2D v2;
uniform sampler2D v3;

#pragma glslify: blur = require('glsl-fast-gaussian-blur')
#pragma glslify: noise2 = require('glsl-noise/simplex/2d')
#pragma glslify: noise3 = require('glsl-noise/simplex/3d')
#pragma glslify: import('./post')

#define PI 3.141593
#define SQRT3 1.7320508

struct Camera {
  vec3 pos;
  vec3 dir;
};

float osc(in float ch) {
  return texture2D(osc_note, vec2(ch / 64.)).r;
}

vec2 rot(in vec2 uv, in float t) {
  float c = cos(t), s = sin(t);
  return mat2(c, -s, s, c) * uv;
}

vec2 hexCenter(in vec2 p) {
    mat2 skew = mat2(1. / 1.1457, 0, 0.5, 1);
    mat2 inv = 2. * mat2(1., 0, -0.5, 1. / 1.1457);

    vec2 cellP = skew * p;

    // Decide which lane the cell is in
    vec2 cellOrigin = floor(cellP); // -10 to 10, skewed
    float celltype = mod(cellOrigin.x + cellOrigin.y, 3.0);
    vec2 cellCenter = cellOrigin; // -10 to -10, skewed

    if (celltype < 1.) {
        // do nothing
    }
    else if (celltype < 2.) {
        cellCenter = cellOrigin + 1.;
    }
    else if (celltype < 3.) {
        cellP = fract(cellP);
        if (cellP.x > cellP.y) {
            cellCenter = cellOrigin + vec2(1, 0);
        }
        else {
            cellCenter = cellOrigin + vec2(0, 1);
        }
    }

    return inv * (cellCenter / SQRT3);
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

float balls(in vec2 uv, in float beat) {
  uv = uv * 2. - 1.;
  uv.x *= resolution.x / resolution.y;


  float c;

  beat = 1. - exp(beat * -8.0);

  float d = beat * 2.;
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

float arcBall(in vec2 uv, in float beat, in float seed) {
  uv = uv * 2. - 1.;
  uv.x *= resolution.x / resolution.y;

  uv *= 6.;

  beat = 1. - exp(beat * -8.0);

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

float arcBalls(in vec2 uv, in float beat) {
    return (
      arcBall(uv + vec2(cos(time * 0.3), sin(time * 0.4)) * 0.2, beat, 10.) +
      arcBall(uv + vec2(cos(time * 0.2), sin(time * 0.7)) * 0.2, beat, 20.) +
      arcBall(uv + vec2(cos(time * 0.9), sin(time * 0.3)) * 0.2, beat, 30.) +
      arcBall(uv + vec2(cos(time * 0.4), sin(time * 0.15)) * 0.2, beat, 40.) +
      arcBall(uv + vec2(cos(time * 0.5), sin(time * 0.8)) * 0.2, beat, 50.)
    ) / 2.;
}

float metaball(in vec2 uv, in float beat) {
  float c = 0.0;

  uv.x += uv.x * cos(uv.x * PI + time);

  float nb = 16.;

  c += cos(uv.x * nb * PI) * cos(uv.y * nb * 2. * PI);

  // c *= 1. - clamp(abs(uv.y), .0, .2) * 5.;
  c *= 1. - clamp(abs(uv.y), .0, .5) * 1.;
  c *= cos(uv.x * PI);
  return smoothstep(.5, .9, c) * 2.;
}

float metaballs(in vec2 uv, in float beat) {
  uv = uv * 2. - 1.;
  uv.x *= resolution.x / resolution.y;

  uv *= 1.2;

  uv = rot(uv, sin(length(uv) * 3.));

  float p6 = PI / 3.;

  float d = .1 - exp(beat * -5.) * 0.2 * sign(mod(time, 2.) - 1.);

  return (
    metaball(uv + .1, beat) +
    metaball(rot(uv, p6) + d, beat) +
    metaball(rot(uv, p6 * 2.) + d, beat) +
    metaball(rot(uv, p6 * 3.) + d, beat) +
    metaball(rot(uv, p6 * 4.) + d, beat) +
    metaball(rot(uv, p6 * 5.) + d, beat)
  );
}

float draw(in vec2 uv) {
  float loopLength = 1.;
  float beat = fract(time / loopLength); // 15sec

  float c = 0.0;

  // c += stripes(rot(uv, .5), beat);
  // c += stars(uv, beat);
  // c += rings(uv, beat);
  c += dia(uv, beat);
  // c += balls(uv, beat);
  // c += arcBalls(uv, beat) * 1.0;

  c += metaballs(uv, beat);

  // return smoothstep(.2, 4, c);
  return c;
}

float blockNoise(in vec2 uv, float t) {
  float n = 0.;
  float k = .8;
  float l = 3.7;
  uv += .3;
  for (int i = 0; i < 3; i++) {
    l += 2.2;
    n += noise3(vec3(floor(uv * l), t)) * k;
    k *= .8;
  }

  return fract(n);
}

vec2 pre(in vec2 uv) {
  vec2 p = (gl_FragCoord.xy * 2. - resolution) / min(resolution.x, resolution.y);

  // wiggle
  float owiggle = osc(8.);
  if (owiggle > 0.) {
    uv.x += noise2(vec2(time * 10.)) * .01 * owiggle;
    uv.y += noise2(vec2(time * 8. + 1.)) * .01 * owiggle;
  }

  float osplit = osc(9.);
  if (osplit > 0.) {
    float ntt = noise2(vec2(time));
    if (ntt > .1) {
        uv.x = fract(uv.x * 2.);
    }
    if (ntt > .2) {
        uv.x = fract(uv.x * 1.2 +sin(time));
    }
  }

  float orot = osc(10.);
  if (orot > 0.) {
    float l = length(uv - .5) * sin(time * 0.3) * 3.;
    uv = rot(uv - .5, sin(time * 0.2 + l * l) * orot) + .5;
  }

  // x glitch
  float oxg = osc(4.);
  if (oxg > 0.) {
    float ny = noise3(vec3(floor(uv.yy * 40.), time* 30.));
    uv.x += step(1., ny * 4. * osc(4.)) * ny * .04 * oxg *oxg;
  }

  // kaleido
  float okal = osc(7.) * 2.;
  if (okal > 0.0) {
    float l = length(uv);
    uv -=.5;

    uv = abs(uv);
    uv = rot(uv, time * .2);

    if (okal >= 0.5) {
      uv = fract(uv * 1.2 +.2);
      uv = abs(uv);
      uv = rot(uv, -time * .4);
    }

    if (okal > 0.75) {
      uv = fract(uv * 1.3 + .2);
      uv = abs(uv);
      uv = rot(uv, time);
    }

    uv += .5;
  }

  // Random zoom
  float ozoom = osc(5.) * 2.;
  float nt = noise2(vec2(time));
  if (nt * ozoom > .1) {
    float zoom = sin(time * 1.4) * sin(time * 2.37) * .5 + .5;
    uv = uv + vec2(
      sin(time * 2.8) + cos(time * 3.7),
      sin(time * 1.3) + cos(time * 1.9)
    ) * (1. - zoom) * .5;
    uv = (uv - .5) * zoom + .5;
  }

  // dia
  float odia = osc(6.) * 2.;
  if (odia > 0.0) {
    float ll = abs(uv.x - .5) + abs(uv.y - .5) - time * .3;
    float ls = sin(floor(ll * 10.)) * .5 + .5;
    uv = (uv - .5) * (1. - ls * .8 * odia) + .5;
  }

  float obor = osc(13.);
  if (obor > .0) {
    uv.x = uv.y;
  }

  return uv;
}

vec4 post(in vec4 c) {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 p = (gl_FragCoord.xy * 2. - resolution) / min(resolution.x, resolution.y);

  float oscrgbmap1 = osc(24.);
  float oscrgbmap2 = osc(25.);
  float oscrgbmap3 = osc(26.);
  if (oscrgbmap1 > 0.) {
    c = texture2D(v1, asin(c.rg) * 0.3 + 0.5);
  }
  if (oscrgbmap2 > 0.) {
    c = texture2D(v2, asin(c.gb) * 0.3 + 0.5);
  }
  if (oscrgbmap3 > 0.) {
    c = texture2D(v3, asin(c.rb) * 0.3 + 0.5);
  }

  // glichy noise
  float oscrgb = osc(2.);
  if (oscrgb > 0.) {
    c.r += step(.99, blockNoise(uv *1.7, fract(time * .1 * oscrgb)));
    c.gb += step(.99, blockNoise(uv *2.4, fract(time * .1 * oscrgb)));
  }

  // mosh
  float oscmosh = osc(3.);
  if (oscmosh > 0.) {
    float nx = blockNoise(uv * 2.7, fract(time * .1)) *.1;
    float ny = blockNoise(uv * 1.8, fract(time * .2)) *.1;
    c.rgb = mix(c.rgb, vec3(
      c.r * oscmosh / texture2D(renderBuffer, fract(uv + vec2(nx, ny) + .01)).b,
      c.g * oscmosh / texture2D(renderBuffer, fract(uv + vec2(nx, ny) + .03)).b,
      c.b / texture2D(renderBuffer, fract(uv + vec2(nx, ny) + .01)).r
    ), oscmosh * .2);
  }

  // c = vec4(step(0.05, fwidth(c.r))); // edge

  // invert
  float oscinv = osc(0.);
  if (oscinv == 1.) {
    c.rgb = 1. - c.rgb;
  } else {
    c.rgb = mix(c.rgb, 1. - c.rgb, step(.4, noise3(vec3(uv.xx, time * 3. * oscinv) * oscinv * 3.)));
  }

  // hueshift
  float oschue = osc(1.);
  if (oschue > 0.0) {
    c.rgb = hueRot(c.rgb, time * oschue - length(p) * .7 * oschue);
  }

  // rainbow
  float oscrain = osc(11.);
  if (oscrain > 0.) {
    c.rgb = hueRot(c.rgb, time * oscrain + uv.y + uv.x);
  }

  float oscrgl = osc(12.);
  if (oscrgl > 0.) {
    c.r = texture2D(renderBuffer, fract(uv + vec2(sin(time * 30.) * sin(time * 183.) * sin(time * 73.) * .1, 0) + .01)).g;
  }

  // pixelsort
  float oscpxs = osc(16.);
  if (oscpxs > 0.) {
    if (texture2D(renderBuffer, floor(uv * 320.) / 320.).g > .5) {
      vec3 x = vec3(.0);///texture2D(renderBuffer, fract(uv)).rgb;
      // vec2 du = rot(vec2(1, 0), noise2(floor(uv * 3.)) * 10.);
      float nh = noise2(hexCenter(p * 1.5) + time *.04);
      vec2 du = rot(vec2(1, 0), nh * 10.);

      // float xi = mod(uv.x * resolution.x, 700.) / 700.;
      float xi = uv.x;
      for (int i = 0; i < 200; i++) {
        float fi = float(i) * nh * 5.;
        // vec3 r = texture2D(renderBuffer, uv + vec2(fi / resolution.x, 0)).rgb;
        vec3 r = texture2D(renderBuffer, fract(uv + du * (fi / resolution.x))).rgb;
        if (abs(length(r) - xi) < .03) {
          x = r;
          break;
        }
      }
      c.rgb = x.grb *3.;
    }
  }

  return c;
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
  float c = 0.0;

  if (PASSINDEX == 1)  {
    uv = pre(uv);
    gl_FragColor = vec4(draw(uv));
    gl_FragColor = vec4(
      draw(uv),
      draw(uv+.003),
      draw(uv-.003),
      1.
    );
  }
  else if (PASSINDEX == 2) {
    vec4 c = texture2D(renderBuffer, uv);
    gl_FragColor = post(c);
  }
}
