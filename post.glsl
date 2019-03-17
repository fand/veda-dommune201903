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
