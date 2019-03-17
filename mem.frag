/*{
  osc: 3333,
}*/
precision mediump float;
uniform vec2  resolution;
uniform float time;
uniform float volume;
uniform sampler2D mem;
uniform sampler2D osc_cc;
uniform sampler2D osc_note;

float osc(in float ch) {
  return texture2D(osc_note, vec2(ch / 64.)).r;
}

void main() {
  if (gl_FragCoord.x + gl_FragCoord.y > 2.) { discard; }

  vec4 acc = texture2D(mem, vec2(0));
  float deltaTime = time - acc.x;

  float lim = 20.;

  float accel = acc.z;
  if (osc(63.) > 0.) {
    accel = (lim - accel) * 0.9 + 1.;
  } else {
    accel = (accel - 1.) * 0.2 + 1.;
    // accel = 1.;
  }
  accel = clamp(accel, 1., lim);

  gl_FragColor = vec4(
    time, // absTime
    acc.y + deltaTime * accel, // accTime
    accel,
    acc.w + volume * accel // accVolume
  );
}
