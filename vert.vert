/*{
  "pixelRatio": 1,
  "vertexCount": 1000,
  "vertexMode": "LINES",
  audio: true,
  osc: 3333,
}*/
precision mediump float;
attribute float vertexId;
uniform float vertexCount;
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
varying vec4 v_color;
uniform float volume;
uniform sampler2D osc_note;
uniform sampler2D osc_beat;

#define PI 3.141593

float beat;
void initGlobals() {
  beat = texture2D(osc_beat, vec2(0)).r;
}

vec2 rot(vec2 st, float t) {
  float c = cos(t), s = sin(t);
  return mat2(c, -s, s, c) * st;
}

float osc(in float ch) {
  return texture2D(osc_note, vec2(ch / 64.)).r;
}

vec3 tetra(in float id, in float count) {
  float m = mod(id, 6.); // TBD: change mod
  vec3 p = vec3(0);

  vec3 a = vec3(-1, -1, -1);
  vec3 b = vec3(-1, 1, 1);
  vec3 c = vec3(1, -1, 1);
  vec3 d = vec3(1, 1, -1);

  float ti = id / count;
  float wireness = fract(time * .2);
  ti = mix(ti, step(.5, ti), wireness * .9);

  if (m == 0.) p = mix(a, b, ti);
  if (m == 1.) p = mix(a, c, ti);
  if (m == 2.) p = mix(a, d, ti);
  if (m == 3.) p = mix(b, c, ti);
  if (m == 4.) p = mix(b, d, ti);
  if (m == 5.) p = mix(c, d, ti);

  float be = (1. - log(beat * -4.)) * 3. + time;
  p.xy = rot(p.xy, be * PI / 7.5); // 15sec
  p.xz = rot(p.xz, be * PI / 5.); // 10sec

  return p;
}

vec3 box(in float id, in float count) {
  float m = mod(id, 12.);
  vec3 p = vec3(0);

  vec3 a = vec3(-1, -1, -1);
  vec3 b = vec3(-1, -1, 1);
  vec3 c = vec3(-1, 1, -1);
  vec3 d = vec3(-1, 1, 1);
  vec3 e = vec3(1, -1, -1);
  vec3 f = vec3(1, -1, 1);
  vec3 g = vec3(1, 1, -1);
  vec3 h = vec3(1, 1, 1);

  float ti = id / count;

  float wireness = fract(time * .2);
  ti = mix(ti, step(.5, ti), wireness * .9);

  if (m == 0.) p = mix(a, b, ti);
  else if (m == 1.) p = mix(c, d, ti);
  else if (m == 2.) p = mix(e, f, ti);
  else if (m == 3.) p = mix(g, h, ti);
  else if (m == 4.) p = mix(a, c, ti);
  else if (m == 5.) p = mix(b, d, ti);
  else if (m == 6.) p = mix(e, g, ti);
  else if (m == 7.) p = mix(f, h, ti);
  else if (m == 8.) p = mix(a, e, ti);
  else if (m == 9.) p = mix(b, f, ti);
  else if (m == 10.) p = mix(c, g, ti);
  else  p = mix(d, h, ti);

  p.xy = rot(p.xy, time * PI / 7.5); // 15sec
  p.xz = rot(p.xz, time * PI / 5.); // 10sec

  return p;
}

vec3 oTetra(vec3 pos, in float id, in float count) {
  return tetra(mod(vertexId * 11., vertexCount), vertexCount) * .3;
}

vec3 oBox(vec3 pos, in float id, in float count) {
  return box(mod(vertexId * 17., vertexCount), vertexCount) * .3;
}

vec3 oQuad(vec3 pos, in float id, in float count) {
  if (vertexId < vertexCount * .25) {
    pos.yz = rot(pos.yz, .3);
    pos.x += .4;
  }
  else if (vertexId < vertexCount * .5) {
    pos.yz = rot(pos.yz, .7);
    pos.y += .2;
  }
  else if (vertexId < vertexCount * .75) {
    pos.xz = rot(pos.xz, .7);
    pos.y -= .2;
  }
  else {
    pos.xy = rot(pos.xy, .9);
    pos.x -= .4;
  }

  return pos;
}

vec3 oRing(vec3 pos, in float id, in float count) {
  if (mod(id, 2.) < 0.) { return vec3(0.); }

  return vec3(
      cos(id +time), sin(id +time), 0.
  ) * 0.5;
}

void main() {
  initGlobals();

  float i = vertexId * 2.;

  vec3 pos = vec3(
    sin(i * 2.) * sin(time * .2 + i),
    cos(i * 3.) * cos(time * .4 + i),
    cos(time) * sin(time + vertexId)
  );

  if (osc(56.) > .0) pos = oTetra(pos, vertexId, vertexCount);
  if (osc(57.) > .0) pos = oRing(pos, vertexId, vertexCount);
  if (osc(58.) > .0) pos = oBox(pos, vertexId, vertexCount);
  if (osc(59.) > .0) pos = oQuad(pos, vertexId, vertexCount);

  // pos = oBox(pos, vertexId, vertexCount);

  float noisiness = .0;
  pos.x += sin(vertexId * 2. + time * 30.) * .1 * noisiness;
  pos.y += sin(vertexId * 3. + time * 23.) * .1 * noisiness;
  pos.z += sin(vertexId * 4. + time * 13.) * .1 * noisiness;

  gl_Position = vec4(pos.x, pos.y * resolution.x / resolution.y, pos.z, 1);
  gl_PointSize = 2. / max(abs(pos.z), .1);

  v_color = vec4(
    sin(pos.x + i * .0003+ time),
    sin(pos.y + i * .0002),
    sin(pos.z + i * .0001),
    1
    // fract(sin(i * 0.7) * sin(i * 2.3))
  );
}
