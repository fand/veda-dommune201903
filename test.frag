/*{
  osc: 3333,
  audio: true,
}*/
precision highp float;
uniform float time;
uniform vec2 resolution;
uniform sampler2D backbuffer;
uniform sampler2D osc_beat;
uniform float volume;

float beat;
float loopLength;

void initGlobals() {
  beat = texture2D(osc_beat, vec2(0)).r;
  loopLength = texture2D(osc_beat, vec2(1)).r;

  // beat *= 1000.;
  beat = exp(beat * -4.);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  uv -= .5;

  initGlobals();

  uv /= 1. + smoothstep(.0, .04, volume * volume);

  // uv.x += sin(beat * 3.14 * 2.) *0.5 *beat;

  gl_FragColor = vec4(.1/ length(uv));
  // gl_FragColor.r = loopLength / 3.;
}
