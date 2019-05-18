precision mediump float;
const float a = 1.0;
#include "./include-1.glsl"
const float c = 3.0;
#include "include-2.glsl"

void main() {
  gl_FragColor = vec4(a, b, c, d);
}
