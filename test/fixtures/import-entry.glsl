precision mediump float;
const float a = 1.0;
#pragma glslify: import(./import-1.glsl)
const float c = 3.0;
#pragma glslify: import(import-2.glsl)

void main() {
  gl_FragColor = vec4(a, b, c, d);
}
