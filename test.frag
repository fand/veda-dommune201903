precision highp float;
uniform float time;
uniform vec2 resolution;
uniform sampler2D backbuffer;



void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  uv -= .5;

  uv.x += sin(time) *0.5;

  gl_FragColor = vec4(.1/ length(uv));
}
