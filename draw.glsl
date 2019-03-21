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

float hexLine(in vec2 p, in float width) {
    p = abs(p);
    float a = atan(p.y, p.x);
    if (a < PI / 3.) {
        p = rot(p, -PI / 3.);
    }
    return .01 / abs(p.y - .95);
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

  float bt = time * PI / 7.5; // 15sec

  for (int i = 0; i < 5; i++) {
    c1 = rot(c1, bt);
    c += star(uv, c1 * (1. - 0.2* float(i) / 8.));
  }

  return c * sin(1. - length(uv));
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
