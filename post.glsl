vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    // vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    // vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    vec4 p = c.g < c.b ? vec4(c.bg, K.wz) : vec4(c.gb, K.xy);
    vec4 q = c.r < p.x ? vec4(p.xyw, c.r) : vec4(c.r, p.yzx);
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hueRot(vec3 col, float t)
{
  vec3 hsv = rgb2hsv(col);
  hsv.x += t;
  return hsv2rgb(hsv);
}

vec3 godray(in float level) {
  float d = level * .1;
  vec3 b = vec3(0.);

  vec2 uv = (gl_FragCoord.xy / resolution) - .5;
  vec2 uvr = uv;
  vec2 uvg = uv;
  vec2 uvb = uv;

  for (int i = 0; i < 20; i++) {
    uvr *= (1. - d * (sin(time * .3 + 1.) * .5 + .6));
    uvg *= (1. - d * (sin(time * .3 + 1.3) * .5 + .6));
    uvb *= (1. - d * (sin(time * .3 + 1.5) * .5 + .6));

    b += vec3(
      texture2D(backbuffer, uvr + .5).r,
      texture2D(backbuffer, uvg + .5).g,
      texture2D(backbuffer, uvb + .5).b
    );
  }

  return b * level * .1;
}

vec3 bloom(vec2 dir) {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec3 col = blur(backbuffer, uv, resolution, dir).rgb;
  return col * col * col;
}

vec4 oInvert(in vec4 c, in vec2 uv, in vec2 p, in float ch) {
  if (ch == 1.) {
    c.rgb = 1. - c.rgb;
  } else {
    c.rgb = mix(c.rgb, 1. - c.rgb, step(.4, noise3(vec3(uv.xx, time * 3. * ch) * ch * 3.)));
  }

  c.rgb = mix(c.rgb, 1. - c.rgb, step(.4, noise3(vec3(uv.xx, time * 3. * ch) * ch * 3.)));
  return c;
}

vec4 oHue(in vec4 c, in vec2 uv, in vec2 p, in float ch) {
  if (ch > 0.0) {
    c.rgb = hueRot(c.rgb, time * ch - length(p) * .7 * ch);
  }

  return c;
}

vec4 oRainbow(in vec4 c, in vec2 uv, in vec2 p, in float ch) {
  if (ch > 0.) {
    c.rgb = hueRot(c.rgb, time * ch + uv.y + uv.x);
  }
  return c;
}

vec4 oRgl(in vec4 c, in vec2 uv, in vec2 p, in float ch) {
  if (ch > 0.) {
    c.r = texture2D(renderBuffer, fract(uv + vec2(sin(time * 30.) * sin(time * 183.) * sin(time * 73.) * .1, 0) + .01)).g;
  }
  return c;
}

vec4 oPixSort(in vec4 c, in vec2 uv, in vec2 p, in float ch) {
  if (ch > 0.) {
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

// Fake mosh
vec4 oMosh(in vec4 c, in vec2 uv, in vec2 p, in float ch) {
  if (ch > 0.) {
    float nx = blockNoise(uv * 2.7, fract(time * .1)) *.1;
    float ny = blockNoise(uv * 1.8, fract(time * .2)) *.1;
    c.rgb = mix(c.rgb, vec3(
      c.r * ch / texture2D(renderBuffer, fract(uv + vec2(nx, ny) + .01)).b,
      c.g * ch / texture2D(renderBuffer, fract(uv + vec2(nx, ny) + .03)).b,
      c.b / texture2D(renderBuffer, fract(uv + vec2(nx, ny) + .01)).r
    ), ch * .2);
  }
  return c;
}

// glichy noise
vec4 oRgb(in vec4 c, in vec2 uv, in vec2 p, in float ch) {
  if (ch > 0.) {
    c.r += step(.99, blockNoise(uv *1.7, fract(time * .1 * ch)));
    c.gb += step(.99, blockNoise(uv *2.4, fract(time * .1 * ch)));
  }
  return c;
}

vec4 oRgbSwap1(in vec4 c, in vec2 uv, in vec2 p, in float ch) {
  if (ch > 0.)  {
    c = texture2D(v1, asin(c.rg) * 0.3 + 0.5);
  }
  return c;
}
vec4 oRgbSwap2(in vec4 c, in vec2 uv, in vec2 p, in float ch) {
  if (ch > 0.)  {
    c = texture2D(v2, asin(c.rg) * 0.3 + 0.5);
  }
  return c;
}
vec4 oRgbSwap3(in vec4 c, in vec2 uv, in vec2 p, in float ch) {
  if (ch > 0.)  {
    c = texture2D(v3, asin(c.rg) * 0.3 + 0.5);
  }
  return c;
}

vec4 oChroma(in vec4 c, in vec2 uv, in vec2 p, in float ch) {
  if (ch > 0.)  {
    uv -= .5;

    c.r = texture2D(renderBuffer, uv * 0.97 + .5).r;
    c.g = texture2D(renderBuffer, uv * 0.985 + .5).g;
    c.b = texture2D(renderBuffer, uv * 1.00 + .5).b;
  }
  return c;
}

vec4 oBloom(in vec4 c, in vec2 uv, in vec2 p, in float ch) {
  if (ch > 0.)  {
    if (length(c.rgb) > .5) {
      float d = 0.1;
      c += (
        texture2D(renderBuffer, uv) * 4. +
        texture2D(renderBuffer, uv + vec2(d, 0)) * 2. +
        texture2D(renderBuffer, uv + vec2(-d, 0)) * 2. +
        texture2D(renderBuffer, uv + vec2(0, d)) * 2. +
        texture2D(renderBuffer, uv + vec2(0, -d)) * 2. +
        texture2D(renderBuffer, uv + vec2(d, d)) +
        texture2D(renderBuffer, uv + vec2(d, -d)) +
        texture2D(renderBuffer, uv + vec2(-d, d)) +
        texture2D(renderBuffer, uv + vec2(-d, -d))
      ) / 16.;
    }
  }
  return c;
}

vec4 oBlink(in vec4 c, in vec2 uv, in vec2 p, in float ch) {
  if (ch > .0) {
    c *= step(.5, fract(time * 15.)) * 2. - 1.;
    // c = fract(c);
    // c = 1. - c;
  }

  return c;
}
