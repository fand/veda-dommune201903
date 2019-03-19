vec2 iWiggle(in vec2 uv, in float ch) {
  if (ch > 0.) {
    uv.x += noise2(vec2(time * 10.)) * .01 * ch;
    uv.y += noise2(vec2(time * 8. + 1.)) * .01 * ch;
  }
  return uv;
}

vec2 iSplit(in vec2 uv, in float ch) {
  if (ch > 0.) {
    float ntt = noise2(vec2(time));
    if (ntt > .1) {
        uv.x = fract(uv.x * 2.);
    }
    if (ntt > .2) {
        uv.x = fract(uv.x * 1.2 +sin(time));
    }
  }
  return uv;
}

vec2 iRot(in vec2 uv, in float ch) {
  if (ch > 0.) {
    float l = length(uv - .5) * sin(time * 0.3) * 3.;
    uv = rot(uv - .5, sin(time * 0.2 + l * l) * ch) + .5;
  }
  return uv;
}

vec2 iXShift(in vec2 uv, in float ch) {
  if (ch > 0.) {
    float ny = noise3(vec3(floor(uv.yy * 40.), time* 30.));
    uv.x += step(1., ny * 4. * osc(4.)) * ny * .04 * ch * ch;
  }
  return uv;
}

vec2 iKaleido(in vec2 uv, in float ch) {
  if (ch > 0.0) {
    float l = length(uv);
    uv -=.5;

    uv = abs(uv);
    uv = rot(uv, time * .2);

    if (ch >= 0.5) {
      uv = fract(uv * 1.2 +.2);
      uv = abs(uv);
      uv = rot(uv, -time * .4);
    }

    if (ch > 0.75) {
      uv = fract(uv * 1.3 + .2);
      uv = abs(uv);
      uv = rot(uv, time);
    }

    uv += .5;
  }
  return uv;
}

vec2 iZoom(in vec2 uv, in float ch) {
  if (ch > .1) {
    // float nt = noise2(vec2(time));
    float zoom = sin(time * 1.4) * sin(time * 2.37) * .5 + .5;
    uv = uv + vec2(
      sin(time * 2.8) + cos(time * 3.7),
      sin(time * 1.3) + cos(time * 1.9)
    ) * (1. - zoom) * .5;
    uv = (uv - .5) * zoom + .5;
  }
  return uv;
}

vec2 iDia(in vec2 uv, in float ch) {
  if (ch > 0.0) {
    float ll = abs(uv.x - .5) + abs(uv.y - .5) - time * .3;
    float ls = sin(floor(ll * 10.)) * .5 + .5;
    uv = (uv - .5) * (1. - ls * .8 * ch) + .5;
  }
  return uv;
}

vec2 iBor(in vec2 uv, in float ch) {
  if (ch > .0) {
    uv.x = uv.y;
  }
  return uv;
}
